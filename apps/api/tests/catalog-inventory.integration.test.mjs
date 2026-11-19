import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { Op } from 'sequelize';
import { verifyUploadedImage } from '../dist/modules/files/uploads.service.js';
import { inventoryDelta, moveInventory } from '../dist/modules/inventory/inventory.service.js';
import {
  AuditLogModel,
  DomainEventModel,
  FileModel,
  IdempotencyRecordModel,
  InventoryMovementModel,
  ProductImageModel,
  ProductModel,
  ProductSlugRedirectModel,
  ProductVariantModel,
  sequelize,
  UploadTicketModel,
  UserModel,
} from '../dist/sequelize/models/index.js';

const base = process.env.P4_TEST_API_URL;
test('inventory deltas preserve the on-hand/reserved invariant', () => {
  assert.deepEqual(inventoryDelta('reserve', 2), { onHand: 0, reserved: 2 });
  assert.deepEqual(inventoryDelta('commit', 2), { onHand: -2, reserved: -2 });
  assert.deepEqual(inventoryDelta('release', 2), { onHand: 0, reserved: -2 });
  assert.throws(() => inventoryDelta('receipt', -1));
  assert.throws(() => inventoryDelta('adjust', 0));
});
test('uploaded images require provider-verified identity, type, size and format', () => {
  const ticket = { storageId: 'owner/ticket', private: true, maxBytes: 10000 };
  const resource = {
    public_id: ticket.storageId,
    type: 'authenticated',
    resource_type: 'image',
    bytes: 100,
    width: 30,
    height: 40,
    format: 'png',
    secure_url: 'https://res.cloudinary.com/image',
  };
  assert.equal(verifyUploadedImage(resource, ticket).bytes, 100);
  for (const invalid of [
    { public_id: 'foreign' },
    { type: 'upload' },
    { bytes: 10001 },
    { format: 'svg' },
    { width: 9999999 },
    { secure_url: 'http://untrusted' },
  ])
    assert.throws(() => verifyUploadedImage({ ...resource, ...invalid }, ticket));
});

describe('catalog and SKU inventory on local API', { skip: !base }, () => {
  let token;
  let product;
  let variant;
  const suffix = randomUUID();
  async function call(method, path, body, expected = 200, key, publicCall = false) {
    const response = await fetch(base + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(!publicCall && token ? { authorization: `Bearer ${token}` } : {}),
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
    return result.data;
  }
  before(async () => {
    assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
    token = (
      await call('POST', '/auth/login', { email: 'admin@example.com', password: 'password123' })
    ).token;
    product = await call(
      'POST',
      '/products',
      {
        name: 'Test clothing',
        slug: `test-${suffix}`,
        price: 120000,
        stock: 1,
        description: 'Test garment',
      },
      201,
    );
    variant = (await call('GET', `/admin/products/${product.id}/variants`))[0];
  });
  after(async () => {
    if (product) {
      const variants = await ProductVariantModel.findAll({ where: { productId: product.id } });
      const ids = variants.map((row) => row.id);
      await InventoryMovementModel.destroy({ where: { variantId: ids } });
      await ProductVariantModel.destroy({ where: { productId: product.id } });
      await ProductSlugRedirectModel.destroy({ where: { productId: product.id } });
      await ProductModel.destroy({ where: { id: product.id } });
      await DomainEventModel.destroy({ where: { aggregateId: [...ids, product.id] } });
      await AuditLogModel.destroy({ where: { resourceId: [...ids, product.id] } });
      await IdempotencyRecordModel.destroy({
        where: { scope: 'inventory.adjust', key: { [Op.like]: `test-${suffix}%` } },
      });
    }
    await sequelize.close();
  });
  test('product batch variants are atomic, stock is audited and duplicate paths identify rows', async () => {
    const batch = await call(
      'POST',
      '/products',
      {
        name: 'Batch variants',
        slug: `batch-${suffix}`,
        price: 100,
        stock: 0,
        variants: {
          create: [
            { sku: `BATCH-S-RED-${suffix}`, size: 'S', color: 'red', price: 100, stock: 3 },
            { sku: `BATCH-M-RED-${suffix}`, size: 'M', color: 'red', price: 110, stock: 2 },
          ],
        },
      },
      201,
    );
    try {
      let skus = await call('GET', `/admin/products/${batch.id}/variants`);
      assert.equal(skus.length, 2);
      assert.equal(skus.filter((row) => row.isDefault).length, 1);
      const opening = await InventoryMovementModel.findAll({
        where: { variantId: skus.map((row) => row.id), kind: 'opening' },
      });
      assert.equal(opening.length, 2);
      const before = await call('GET', `/admin/products/${batch.id}`);
      const response = await fetch(`${base}/products/${batch.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: 'Must roll back',
          expectedVersion: before.version,
          variants: {
            update: [{ id: skus[0].id, price: 999 }],
            create: [{ sku: skus[1].sku, size: 'L', color: 'blue', price: 100 }],
          },
        }),
      });
      assert.equal(response.status, 409);
      const error = await response.json();
      assert.ok(error.extensions['variants.create.0.sku']);
      assert.equal((await call('GET', `/admin/products/${batch.id}`)).name, before.name);
      assert.equal((await call('GET', `/admin/products/${batch.id}`)).version, before.version);
      assert.equal(
        (await call('GET', `/admin/products/${batch.id}/variants`)).find(
          (row) => row.id === skus[0].id,
        ).price,
        skus[0].price,
      );
      const saved = await call('PATCH', `/products/${batch.id}`, {
        expectedVersion: before.version,
        variants: {
          delete: [skus[0].id],
          update: [{ id: skus[1].id, price: 120, isDefault: true }],
          create: [
            { sku: `BATCH-L-BLUE-${suffix}`, size: 'L', color: 'blue', price: 130, stock: 4 },
          ],
        },
      });
      assert.equal(saved.version, before.version + 1);
      skus = await call('GET', `/admin/products/${batch.id}/variants`);
      assert.equal(skus.filter((row) => row.status === 'active').length, 2);
      assert.equal(skus.filter((row) => row.isDefault).length, 1);
      // A reservation must reject both delete and deactivate without persisting product edits.
      const reserved = skus.find((row) => row.status === 'active');
      await ProductVariantModel.update({ reserved: 1 }, { where: { id: reserved.id } });
      for (const changes of [
        { delete: [reserved.id] },
        { update: [{ id: reserved.id, status: 'inactive' }] },
      ])
        await call(
          'PATCH',
          `/products/${batch.id}`,
          { name: 'Must roll back', variants: changes },
          409,
        );
      assert.equal((await call('GET', `/admin/products/${batch.id}`)).name, before.name);
    } finally {
      const rows = await ProductVariantModel.findAll({ where: { productId: batch.id } });
      await InventoryMovementModel.destroy({ where: { variantId: rows.map((row) => row.id) } });
      await ProductVariantModel.destroy({ where: { productId: batch.id } });
      await ProductModel.destroy({ where: { id: batch.id } });
      await DomainEventModel.destroy({
        where: { aggregateId: [batch.id, ...rows.map((row) => row.id)] },
      });
      await AuditLogModel.destroy({
        where: { resourceId: [batch.id, ...rows.map((row) => row.id)] },
      });
    }
  });
  test('drafts are private; publication requires a cover; admin read remains available', async () => {
    await call('GET', `/products/${product.id}`, undefined, 404, undefined, true);
    await call('GET', `/products/by-slug/test-${suffix}`, undefined, 404, undefined, true);
    const admin = await call('GET', `/admin/products/${product.id}`);
    assert.equal(admin.status, 'draft');
    await call(
      'PATCH',
      `/products/${product.id}/publication`,
      { status: 'active', expectedVersion: admin.version },
      409,
    );
    const listed = await call('GET', '/admin/products?q=Test%20clothing');
    assert.ok(listed.some((row) => row.id === product.id));
  });
  test('admin list filters by publication status; storefront rejects the filter', async () => {
    const drafts = await call('GET', '/admin/products?q=Test%20clothing&status=draft');
    assert.ok(drafts.some((row) => row.id === product.id));
    assert.ok(drafts.every((row) => row.status === 'draft'));
    const active = await call('GET', '/admin/products?q=Test%20clothing&status=active');
    assert.ok(!active.some((row) => row.id === product.id));
    assert.ok(active.every((row) => row.status === 'active'));
    await call('GET', '/admin/products?status=unknown', undefined, 400);
    await call('GET', '/products?status=draft', undefined, 400, undefined, true);
  });
  test('SKU combinations and codes are unique; inventory fields cannot be patched', async () => {
    const input = { sku: `TEST-${suffix}`, size: 'M', color: 'Black', price: 125000 };
    await call('POST', `/products/${product.id}/variants`, input, 201);
    await call('POST', `/products/${product.id}/variants`, input, 400);
    await call(
      'PATCH',
      `/products/${product.id}/variants/${variant.id}`,
      { expectedVersion: variant.version, stock: 100 },
      400,
    );
    await call('PUT', `/products/${product.id}`, { stock: 100 }, 400);
  });
  test('concurrent receipt replay applies once; payload conflict and negative adjustments fail', async () => {
    const key = `test-${suffix}-receipt`;
    const input = { variantId: variant.id, quantity: 2, reason: 'Test receipt' };
    const results = await Promise.all([
      call('POST', '/admin/inventory/receipts', input, 201, key),
      call('POST', '/admin/inventory/receipts', input, 201, key),
    ]);
    assert.equal(results.filter((r) => !r.replayed).length, 1);
    await call('POST', '/admin/inventory/receipts', { ...input, quantity: 3 }, 409, key);
    await call(
      'POST',
      '/admin/inventory/adjustments',
      { ...input, quantity: -4 },
      409,
      `test-${suffix}-negative`,
    );
    const row = await ProductVariantModel.findByPk(variant.id);
    assert.equal(row.onHand, 3);
  });
  test('two reservations cannot oversell the final unit; rollback leaves no ledger entries', async () => {
    const attempt = () =>
      sequelize.transaction(async (transaction) =>
        moveInventory(
          {
            variantId: variant.id,
            quantity: 3,
            kind: 'reserve',
            actorId: null,
            reason: 'Concurrency test',
            reference: suffix,
          },
          transaction,
        ),
      );
    const results = await Promise.allSettled([attempt(), attempt()]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(results.filter((r) => r.status === 'rejected').length, 1);
    await sequelize.transaction(async (transaction) =>
      moveInventory(
        {
          variantId: variant.id,
          quantity: 3,
          kind: 'release',
          actorId: null,
          reason: 'Release test',
          reference: suffix,
        },
        transaction,
      ),
    );
    const before = await InventoryMovementModel.count({ where: { variantId: variant.id } });
    await assert.rejects(
      () =>
        sequelize.transaction(async (transaction) => {
          await moveInventory(
            {
              variantId: variant.id,
              quantity: 1,
              kind: 'reserve',
              actorId: null,
              reason: 'Rollback',
              reference: suffix,
            },
            transaction,
          );
          throw new Error('business failed');
        }),
      /business failed/,
    );
    assert.equal(await InventoryMovementModel.count({ where: { variantId: variant.id } }), before);
    assert.equal((await call('GET', '/admin/inventory/reconciliation')).consistent, true);
  });
  test('PUT replaces the gallery with owned files in order, once, and rolls back invalid attachments', async () => {
    const actor = await UserModel.findOne({ where: { email: 'admin@example.com' } });
    const foreign = await UserModel.findOne({ where: { email: 'user001@example.com' } });
    assert.ok(actor);
    assert.ok(foreign);
    const files = [];
    const tickets = [];
    const original = await call('GET', `/admin/products/${product.id}`);
    try {
      for (let index = 0; index < 5; index++) {
        const storageId = `test-${suffix}-${index}`;
        const file = await FileModel.create({
          storageId,
          provider: 'system',
          url: 'https://example.invalid/photo.png',
        });
        files.push(file);
        tickets.push(
          await UploadTicketModel.create({
            id: randomUUID(),
            storageId,
            fileId: file.id,
            ownerId: index === 3 ? foreign.id : actor.id,
            purpose: 'product',
            resourceId: product.id,
            status: 'completed',
            private: false,
            maxBytes: 100,
            expiresAt: new Date(Date.now() + 60000),
          }),
        );
      }
      await call(
        'POST',
        `/products/${product.id}/images`,
        { storageId: files[0].storageId, sortOrder: 7 },
        201,
      );
      const before = await call('GET', `/admin/products/${product.id}`);
      const auditCount = await AuditLogModel.count({
        where: { resourceId: product.id, action: 'product.updated' },
      });
      const updated = await call('PUT', `/products/${product.id}`, {
        expectedVersion: before.version,
        imageStorageIds: [
          files[0].storageId,
          files[1].storageId,
          files[1].storageId,
          files[2].storageId,
        ],
      });
      assert.equal(updated.version, before.version + 1);
      assert.deepEqual(
        updated.images.map((image) => image.fileId),
        files.slice(0, 3).map((file) => file.id),
      );
      assert.deepEqual(
        updated.images.map((image) => image.sortOrder),
        [0, 1, 2],
      );
      assert.equal(updated.thumbnailId, original.thumbnailId);
      assert.equal(
        await AuditLogModel.count({ where: { resourceId: product.id, action: 'product.updated' } }),
        auditCount + 1,
      );
      const replay = await call('PUT', `/products/${product.id}`, {
        expectedVersion: updated.version,
        imageStorageIds: files.slice(0, 3).map((file) => file.storageId),
      });
      assert.equal(replay.images.length, 3);
      await call(
        'PUT',
        `/products/${product.id}`,
        { expectedVersion: updated.version, imageStorageIds: [files[0].storageId] },
        409,
      );
      await call(
        'PUT',
        `/products/${product.id}`,
        {
          name: 'Must roll back',
          expectedVersion: replay.version,
          imageStorageIds: [files[2].storageId, files[3].storageId],
        },
        403,
      );
      const after = await call('GET', `/admin/products/${product.id}`);
      assert.equal(after.name, before.name);
      assert.equal(after.version, replay.version);
      assert.deepEqual(after.images, replay.images);
      const thumbnailOnly = await call('PUT', `/products/${product.id}`, {
        expectedVersion: after.version,
        thumbnailStorageId: files[4].storageId,
      });
      assert.equal(thumbnailOnly.thumbnail.fileId, files[4].id);
      assert.ok(thumbnailOnly.images.every((image) => image.fileId !== files[4].id));
      assert.deepEqual(thumbnailOnly.images, after.images);
      const cleared = await call('PUT', `/products/${product.id}`, {
        expectedVersion: thumbnailOnly.version,
        thumbnailStorageId: null,
      });
      assert.equal(cleared.thumbnailId, null);
      assert.equal(cleared.thumbnail, null);
      assert.equal(cleared.thumbnailUrl, cleared.images[0].url);
      assert.deepEqual(cleared.images, after.images);
      const listed = await call('GET', `/admin/products?q=Test%20clothing`);
      assert.equal(listed.find((row) => row.id === product.id).thumbnailUrl, cleared.images[0].url);
      await call(
        'PUT',
        `/products/${product.id}`,
        {
          thumbnailStorageId: files[3].storageId,
        },
        403,
      );
    } finally {
      await ProductModel.update(
        { thumbnailId: original.thumbnailId },
        { where: { id: product.id } },
      );
      await ProductImageModel.destroy({
        where: { productId: product.id, fileId: files.map((file) => file.id) },
      });
      await UploadTicketModel.destroy({ where: { id: tickets.map((ticket) => ticket.id) } });
      await FileModel.destroy({ where: { id: files.map((file) => file.id) } });
    }
  });
  test('archiving preserves records and keeps public lookup unavailable', async () => {
    await call('DELETE', `/products/${product.id}`);
    assert.equal((await call('GET', `/admin/products/${product.id}`)).status, 'archived');
    const archived = await call('GET', '/admin/products?q=Test%20clothing&status=archived');
    assert.ok(archived.some((row) => row.id === product.id));
    assert.ok(await ProductModel.findByPk(product.id));
  });
});
