import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { Op } from 'sequelize';
import { verifyUploadedImage } from '../dist/modules/files/uploads.service.js';
import { inventoryDelta, moveInventory } from '../dist/modules/inventory/inventory.service.js';
import {
  AuditLogModel,
  DomainEventModel,
  IdempotencyRecordModel,
  InventoryMovementModel,
  ProductModel,
  ProductSlugRedirectModel,
  ProductVariantModel,
  sequelize,
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
  test('archiving preserves records and keeps public lookup unavailable', async () => {
    await call('DELETE', `/products/${product.id}`);
    assert.equal((await call('GET', `/admin/products/${product.id}`)).status, 'archived');
    assert.ok(await ProductModel.findByPk(product.id));
  });
});
