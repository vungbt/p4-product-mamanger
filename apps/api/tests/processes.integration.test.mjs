import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { finishEvent } from '../dist/modules/jobs/jobs.service.js';
import { runProcess } from '../dist/modules/processes/process-worker.service.js';
import { removeProcessFile } from '../dist/modules/processes/storage.service.js';
import * as db from '../dist/sequelize/models/index.js';

const require = createRequire(import.meta.url);
const { io } = require('../node_modules/socket.io-client');
const base = process.env.P4_TEST_API_URL;
describe('worker processes and realtime local API', { skip: !base }, () => {
  const suffix = randomUUID();
  let admin, other, otherId, adminId;
  const ids = [];
  const sockets = [];
  const slugs = [];
  const productSlugs = [];
  async function call(method, path, body, session = admin, expected = 200, key) {
    const form = body instanceof FormData;
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(form ? {} : { 'content-type': 'application/json' }),
        ...(session ? { authorization: `Bearer ${session.token}` } : {}),
        ...(key ? { 'Idempotency-Key': key } : {}),
      },
      ...(body === undefined ? {} : { body: form ? body : JSON.stringify(body) }),
    });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
    return result.data;
  }
  // Runs the queued `process.requested` job of one fixture process and returns the process.
  // The integration stack also runs the background worker, which claims every pending event as
  // soon as it is committed, so the job may already belong to the worker when this is called.
  async function drive(id, { inProcess = false } = {}) {
    // Fence the exact fixture job atomically; never consume unrelated business/mail events.
    const [, fenced] = await db.DomainEventModel.update(
      {
        status: 'processing',
        leaseToken: randomUUID(),
        leaseUntil: new Date(Date.now() + 90000),
        attempts: db.sequelize.literal('attempts + 1'),
      },
      { where: { aggregateId: id, type: 'process.requested', status: 'pending' }, returning: true },
    );
    assert.ok(fenced.length <= 1, `process ${id} has ${fenced.length} pending jobs`);
    if (fenced.length) {
      await runProcess(fenced[0]);
      assert.equal(await finishEvent(fenced[0], null), true);
      return call('GET', `/processes/${id}`);
    }
    // Stubs installed in this test process (e.g. the media provider) do not reach the worker.
    assert.ok(!inProcess, `the worker claimed process ${id} before the test could run it`);
    const jobs = { aggregateId: id, type: 'process.requested' };
    assert.ok(await db.DomainEventModel.count({ where: jobs }), `process ${id} has no job`);
    // The worker owns the job: wait until it has delivered every job of this process.
    const deadline = Date.now() + 30000;
    for (;;) {
      const rows = await db.DomainEventModel.findAll({ where: jobs });
      const failed = rows.find((row) => row.lastErrorCode || row.status === 'dead_letter');
      assert.ok(!failed, `worker failed process ${id}: ${failed?.lastErrorCode}`);
      if (rows.every((row) => row.status === 'delivered')) break;
      assert.ok(Date.now() < deadline, `worker did not finish process ${id} in time`);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return call('GET', `/processes/${id}`);
  }
  async function importFile(content, resource = 'categories') {
    const form = new FormData();
    form.append('file', new Blob([content], { type: 'text/csv' }), 'fixture.csv');
    const process = await call(
      'POST',
      `/admin/imports/${resource}`,
      form,
      admin,
      202,
      `import-${randomUUID()}`,
    );
    ids.push(process.id);
    return process;
  }
  before(async () => {
    assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
    const adminRow = await db.UserModel.create({
      email: `process-admin-${suffix}@example.invalid`,
      role: 'admin',
      staffRole: 'owner',
      passwordHash: await bcrypt.hash('local-password-12345', 10),
    });
    adminId = adminRow.id;
    admin = await call(
      'POST',
      '/auth/login',
      { email: adminRow.email, password: 'local-password-12345' },
      null,
    );
    const user = await db.UserModel.create({
      email: `process-${suffix}@example.invalid`,
      role: 'user',
      passwordHash: await bcrypt.hash('local-password-12345', 10),
    });
    otherId = user.id;
    other = await call(
      'POST',
      '/auth/login',
      { email: user.email, password: 'local-password-12345' },
      null,
    );
  });
  after(async () => {
    for (const socket of sockets) socket.disconnect();
    try {
      const processes = await db.ProcessModel.findAll({ where: { id: ids } });
      for (const process of processes) {
        if (process.input.kind === 'data.import') await removeProcessFile(process.input.storageKey);
        if (process.outputKey) await removeProcessFile(process.outputKey);
      }
      await db.ProcessItemModel.destroy({ where: { processId: ids } });
      await db.ProcessModel.destroy({ where: { id: ids } });
      await db.DomainEventModel.destroy({ where: { aggregateId: ids } });
      await db.RealtimeEventModel.destroy({ where: { userId: [otherId, adminId] } });
      const events = await db.RealtimeEventModel.findAll({ where: { userId: admin?.user.id } });
      for (const event of events)
        if (event.payload.type === 'process.updated' && ids.includes(event.payload.process.id))
          await event.destroy();
      const products = await db.ProductModel.findAll({ where: { slug: productSlugs } });
      const productIds = products.map((row) => row.id);
      const variants = await db.ProductVariantModel.findAll({ where: { productId: productIds } });
      const variantIds = variants.map((row) => row.id);
      await db.InventoryMovementModel.destroy({ where: { variantId: variantIds } });
      await db.ProductVariantModel.destroy({ where: { id: variantIds } });
      await db.ProductModel.destroy({ where: { id: productIds } });
      await db.DomainEventModel.destroy({ where: { aggregateId: variantIds } });
      await db.AuditLogModel.destroy({ where: { resourceId: [...productIds, ...variantIds] } });
      const categories = await db.CategoryModel.findAll({ where: { slug: slugs } });
      const categoryIds = categories.map((row) => row.id);
      await db.CategoryModel.destroy({ where: { slug: slugs } });
      await db.AuditLogModel.destroy({ where: { resourceId: [...ids, ...categoryIds] } });
      await db.IdempotencyRecordModel.destroy({
        where: { scope: 'process.create', result: { processId: { [Op.in]: ids } } },
      });
      await db.AuditLogModel.destroy({ where: { actorId: adminId } });
      await db.RefreshTokenModel.destroy({ where: { userId: [otherId, adminId] } });
      await db.UserModel.destroy({ where: { id: [otherId, adminId] } });
    } finally {
      await db.sequelize.close();
    }
  });
  test('CSV preview is non-mutating; confirm applies valid rows once and preserves row errors', async () => {
    const slug = `import-${suffix}`;
    slugs.push(slug);
    const process = await importFile(
      `name,slug,description\nFixture,${slug},From CSV\nBroken,BAD SLUG,Invalid slug\n`,
    );
    await call('GET', `/processes/${process.id}`, undefined, other, 404);
    const preview = await drive(process.id);
    assert.equal(preview.state, 'awaiting_confirmation');
    assert.equal(preview.failed, 1);
    assert.equal(await db.CategoryModel.count({ where: { slug } }), 0);
    const items = await call('GET', `/processes/${process.id}/items`);
    assert.ok(items[1].issues[0].field);
    await call(
      'POST',
      `/processes/${process.id}/confirm`,
      { expectedVersion: preview.version - 1 },
      admin,
      409,
    );
    await call(
      'POST',
      `/processes/${process.id}/confirm`,
      { expectedVersion: preview.version },
      admin,
      202,
    );
    const done = await drive(process.id);
    assert.equal(done.state, 'completed_with_errors');
    assert.equal(done.succeeded, 1);
    assert.equal(done.failed, 1);
    assert.equal(await db.CategoryModel.count({ where: { slug } }), 1);
  });
  test('batch media verifies each provider image and keeps partial failures isolated', async () => {
    const { cloudinary } = await import('../dist/configs/cloudinary.js');
    const { env } = await import('../dist/configs/env.js');
    const { completeUpload } = await import('../dist/modules/files/uploads.service.js');
    const original = cloudinary.api.resource;
    const config = {
      cloudName: env.cloudinary.cloudName,
      apiKey: env.cloudinary.apiKey,
      apiSecret: env.cloudinary.apiSecret,
    };
    const ticketIds = [randomUUID(), randomUUID()];
    const storageIds = ticketIds.map((id) => `fixture/${suffix}/${id}`);
    let calls = 0;
    try {
      Object.assign(env.cloudinary, {
        cloudName: 'fixture',
        apiKey: 'fixture',
        apiSecret: 'fixture',
      });
      cloudinary.api.resource = async (publicId) => {
        calls++;
        return {
          public_id: publicId,
          resource_type: 'image',
          type: 'authenticated',
          bytes: publicId === storageIds[0] ? 128 : 99999999,
          width: 16,
          height: 16,
          format: 'png',
          secure_url: 'https://example.invalid/private.png',
        };
      };
      for (const [index, id] of ticketIds.entries())
        await db.UploadTicketModel.create({
          id,
          ownerId: adminId,
          purpose: 'support',
          resourceId: null,
          storageId: storageIds[index],
          status: 'pending',
          private: true,
          maxBytes: 10485760,
          expiresAt: new Date(Date.now() + 600000),
          fileId: null,
        });
      await call(
        'POST',
        '/files/uploads/batch/complete',
        { ticketIds },
        other,
        404,
        `batch-other-${suffix}`,
      );
      const process = await call(
        'POST',
        '/files/uploads/batch/complete',
        { ticketIds },
        admin,
        202,
        `batch-${suffix}`,
      );
      ids.push(process.id);
      const result = await drive(process.id, { inProcess: true });
      assert.equal(result.state, 'completed_with_errors');
      assert.equal(result.succeeded, 1);
      assert.equal(result.failed, 1);
      assert.equal(calls, 2);
      const good = await db.UploadTicketModel.findByPk(ticketIds[0]);
      assert.equal(good.status, 'completed');
      assert.ok(good.fileId);
      const file = await db.FileModel.findByPk(good.fileId);
      assert.equal(file.url, null);
      assert.equal(file.metadata.private, true);
      const retry = await completeUpload(adminId, good.id);
      assert.equal(retry.fileId, good.fileId);
      assert.equal(calls, 2);
      const bad = await db.UploadTicketModel.findByPk(ticketIds[1]);
      assert.equal(bad.fileId, null);
      const items = await call('GET', `/processes/${process.id}/items`);
      assert.ok(items[1].issues.length);
    } finally {
      cloudinary.api.resource = original;
      Object.assign(env.cloudinary, config);
      await db.UploadTicketModel.destroy({ where: { id: ticketIds } });
      await db.FileModel.destroy({ where: { storageId: storageIds } });
    }
  });
  test('export runs through a job and download is private', async () => {
    const process = await call(
      'POST',
      '/admin/exports',
      { resource: 'categories', format: 'xlsx' },
      admin,
      202,
      `export-${suffix}`,
    );
    ids.push(process.id);
    assert.equal(process.state, 'queued');
    const done = await drive(process.id);
    assert.equal(done.state, 'completed');
    const response = await fetch(base + `/processes/${process.id}/download`, {
      headers: { authorization: `Bearer ${admin.token}` },
    });
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 2).toString(), 'PK');
    await fetch(base + `/processes/${process.id}/download`, {
      headers: { authorization: `Bearer ${other.token}` },
    }).then((res) => assert.equal(res.status, 404));
  });
  test('product/SKU/inventory imports use domain services and ledger, including XLSX', async () => {
    const slug = `product-${suffix}`;
    productSlugs.push(slug);
    const product = await importFile(
      `name,slug,price,initialStock,description\nImport garment,${slug},120000,2,Fixture\n`,
      'products',
    );
    let preview = await drive(product.id);
    assert.equal(preview.state, 'awaiting_confirmation', JSON.stringify(preview));
    assert.equal(preview.failed, 0);
    await call(
      'POST',
      `/processes/${product.id}/confirm`,
      { expectedVersion: preview.version },
      admin,
      202,
    );
    assert.equal((await drive(product.id)).state, 'completed');
    const sku = `SKU-${suffix}`;
    const variant = await importFile(
      `productSlug,sku,size,color,price\n${slug},${sku},M,Black,130000\n`,
      'variants',
    );
    preview = await drive(variant.id);
    assert.equal(preview.failed, 0);
    await call(
      'POST',
      `/processes/${variant.id}/confirm`,
      { expectedVersion: preview.version },
      admin,
      202,
    );
    assert.equal((await drive(variant.id)).state, 'completed');
    const { spreadsheetBuffer } = await import('../dist/modules/processes/spreadsheets.service.js');
    const buffer = await spreadsheetBuffer(
      [{ sku, quantity: 3, reason: 'Fixture receipt' }],
      'xlsx',
      ['sku', 'quantity', 'reason'],
    );
    const form = new FormData();
    form.append('file', new Blob([buffer]), 'inventory.xlsx');
    const inventory = await call(
      'POST',
      '/admin/imports/inventory',
      form,
      admin,
      202,
      `inventory-${suffix}`,
    );
    ids.push(inventory.id);
    preview = await drive(inventory.id);
    assert.equal(preview.failed, 0);
    await call(
      'POST',
      `/processes/${inventory.id}/confirm`,
      { expectedVersion: preview.version },
      admin,
      202,
    );
    assert.equal((await drive(inventory.id)).state, 'completed');
    const row = await db.ProductVariantModel.findOne({ where: { sku: sku.toUpperCase() } });
    assert.equal(row.onHand, 3);
    assert.equal(await db.InventoryMovementModel.count({ where: { variantId: row.id } }), 1);
  });
  test('cancelled imports cannot apply and stale targets become row errors', async () => {
    const slug = `cancel-${suffix}`;
    slugs.push(slug);
    const process = await importFile(`name,slug\nCancelled,${slug}\n`);
    const preview = await drive(process.id);
    await call('POST', `/processes/${process.id}/cancel`, { expectedVersion: preview.version });
    await call(
      'POST',
      `/processes/${process.id}/confirm`,
      { expectedVersion: preview.version + 1 },
      admin,
      409,
    );
    assert.equal(await db.CategoryModel.count({ where: { slug } }), 0);
  });
  test('socket authenticates, isolates owners and replays process events after reconnect', async () => {
    const url = new URL(base).origin;
    const received = [];
    const foreign = io(url, {
      auth: { token: other.token, offset: '0' },
      transports: ['websocket'],
    });
    sockets.push(foreign);
    const foreignEvents = [];
    foreign.on('event', (event) => foreignEvents.push(event));
    const socket = io(url, {
      auth: { token: admin.token, offset: '0' },
      transports: ['websocket'],
    });
    sockets.push(socket);
    socket.on('event', (event) => received.push(event));
    await Promise.all([
      new Promise((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', reject);
      }),
      new Promise((resolve, reject) => {
        foreign.once('connect', resolve);
        foreign.once('connect_error', reject);
      }),
    ]);
    const process = await call(
      'POST',
      '/admin/exports',
      { resource: 'categories', format: 'csv' },
      admin,
      202,
      `socket-${suffix}`,
    );
    ids.push(process.id);
    const deadline = Date.now() + 5000;
    while (
      !received.some(
        (event) =>
          event.payload.type === 'process.updated' && event.payload.process.id === process.id,
      ) &&
      Date.now() < deadline
    )
      await new Promise((resolve) => setTimeout(resolve, 50));
    const event = received.find(
      (event) =>
        event.payload.type === 'process.updated' && event.payload.process.id === process.id,
    );
    assert.ok(event);
    assert.ok(
      !foreignEvents.some(
        (event) =>
          event.payload.type === 'process.updated' && event.payload.process.id === process.id,
      ),
    );
    socket.disconnect();
    await drive(process.id);
    const replay = [];
    const reconnected = io(url, {
      auth: { token: admin.token, offset: event.id },
      transports: ['websocket'],
    });
    sockets.push(reconnected);
    reconnected.on('event', (value) => replay.push(value));
    const end = Date.now() + 5000;
    while (
      !replay.some(
        (value) =>
          value.payload.type === 'process.updated' &&
          value.payload.process.id === process.id &&
          value.payload.process.state === 'completed',
      ) &&
      Date.now() < end
    )
      await new Promise((resolve) => setTimeout(resolve, 50));
    assert.ok(
      replay.some(
        (value) =>
          value.payload.type === 'process.updated' &&
          value.payload.process.id === process.id &&
          value.payload.process.state === 'completed',
      ),
    );
  });
});
