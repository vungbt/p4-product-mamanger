import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import * as db from '../dist/sequelize/models/index.js';

const base = process.env.P4_TEST_API_URL;
describe('list standards: real search, filters, metadata and ownership', { skip: !base }, () => {
  const token = randomUUID();
  const users = [];
  const owned = [];
  let admin, customer, other, event, ticket, variant;
  const tables = new Map();
  async function fixture(model, values) {
    const row = await model.create({ id: randomUUID(), ...values });
    if (!tables.has(model)) tables.set(model, []);
    tables.get(model).push(row.id);
    return row;
  }
  async function login(email, password = 'password123') {
    const res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    return body.data;
  }
  async function get(path, session = admin, status = 200) {
    const response = await fetch(base + path, {
      headers: { authorization: `Bearer ${session.token}` },
    });
    const body = await response.json();
    assert.equal(response.status, status, JSON.stringify(body));
    return body;
  }
  before(async () => {
    assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
    admin = await login('admin@example.com');
    for (let i = 0; i < 2; i++) {
      const row = await db.UserModel.create({
        email: `list-${token}-${i}@example.invalid`,
        role: 'user',
        passwordHash: await bcrypt.hash('test-password-12345', 10),
      });
      users.push(row.id);
      const session = await login(row.email, 'test-password-12345');
      if (i === 0) customer = session;
      else other = session;
    }
    event = await fixture(db.DomainEventModel, {
      type: `list.${token}`,
      aggregateType: 'fixture',
      aggregateId: token,
      payload: {},
      status: 'delivered',
      attempts: 1,
      availableAt: new Date(),
      leaseUntil: null,
      deliveredAt: new Date(),
    });
    for (let i = 0; i < 13; i++) {
      const row = await fixture(db.NotificationModel, {
        userId: i === 12 ? other.user.id : customer.user.id,
        eventId:
          i === 0
            ? event.id
            : (
                await fixture(db.DomainEventModel, {
                  type: `list.${token}`,
                  aggregateType: 'fixture',
                  aggregateId: token,
                  payload: {},
                  status: 'delivered',
                  attempts: 1,
                  availableAt: new Date(),
                  leaseUntil: null,
                  deliveredAt: new Date(),
                })
              ).id,
        type: `fixture.${token}`,
        title: `${token}-${String(i).padStart(2, '0')}`,
        body: 'literal %_ token',
        href: '/shop',
        readAt: i === 11 ? new Date() : null,
      });
      if (i < 11) owned.push(row.id);
    }
    ticket = await fixture(db.SupportTicketModel, {
      userId: customer.user.id,
      orderId: null,
      assigneeId: null,
      subject: `${token}-request`,
      category: 'other',
      status: 'open',
      version: 1,
    });
    await fixture(db.SupportMessageModel, {
      ticketId: ticket.id,
      authorId: customer.user.id,
      body: `${token}-public`,
      internal: false,
      attachmentIds: [],
    });
    await fixture(db.SupportMessageModel, {
      ticketId: ticket.id,
      authorId: admin.user.id,
      body: `${token}-private`,
      internal: true,
      attachmentIds: [],
    });
    for (const locale of ['vi', 'en'])
      await fixture(db.NotificationTemplateModel, {
        type: `fixture.${token}`,
        locale,
        subject: `${token}-${locale}`,
        body: 'test',
        version: 1,
      });
    for (const [name, kind] of [
      ['B', 'category'],
      ['A', 'category'],
      ['C', 'tag'],
    ])
      await fixture(db.ContentTaxonomyModel, {
        kind,
        name: `${token}-${name}`,
        slug: `${token}-${name.toLowerCase()}`,
      });
    await fixture(db.MerchandisingEntryModel, {
      kind: 'collection',
      key: `${token}-visible`,
      payload: { kind: 'collection', title: `${token}-Visible`, productIds: [] },
      active: true,
      startsAt: null,
      endsAt: null,
      version: 1,
    });
    await fixture(db.MerchandisingEntryModel, {
      kind: 'collection',
      key: `${token}-future`,
      payload: { kind: 'collection', title: `${token}-Future`, productIds: [] },
      active: true,
      startsAt: new Date(Date.now() + 86400000),
      endsAt: null,
      version: 1,
    });
    await fixture(db.ShippingMethodModel, {
      name: `${token}-shipping`,
      cities: ['fixture-city'],
      active: true,
      codEnabled: true,
      fee: 1,
      freeAbove: null,
      estimatedDays: 1,
      version: 1,
    });
    const product = await db.ProductModel.findOne({ where: { status: 'active' } });
    assert.ok(product);
    await fixture(db.WishlistItemModel, { userId: customer.user.id, productId: product.id });
    variant = await db.ProductVariantModel.findOne();
    assert.ok(variant);
    await fixture(db.InventoryMovementModel, {
      variantId: variant.id,
      kind: 'adjust',
      quantity: 1,
      onHandDelta: 1,
      reservedDelta: 0,
      onHandAfter: variant.onHand,
      reservedAfter: variant.reserved,
      actorId: null,
      reason: `${token}-adjust`,
      reference: token,
    });
  });
  after(async () => {
    try {
      // Remove only IDs created here; children before parents.
      for (const model of [
        db.WishlistItemModel,
        db.InventoryMovementModel,
        db.ShippingMethodModel,
        db.MerchandisingEntryModel,
        db.ContentTaxonomyModel,
        db.NotificationTemplateModel,
        db.SupportMessageModel,
        db.SupportTicketModel,
        db.NotificationModel,
        db.DomainEventModel,
      ])
        await model.destroy({ where: { id: tables.get(model) ?? [] } });
      await db.AuditLogModel.destroy({ where: { actorId: { [Op.in]: users } } });
      await db.UserModel.destroy({ where: { id: users } });
    } finally {
      await db.sequelize.close();
    }
  });
  test('notification text search and read filters execute in SQL with stable pages and owner scope', async () => {
    const query = `q=${token}&readStatus=unread&pageSize=10&sortBy=title&sortOrder=asc`;
    const first = await get('/notifications?' + query, customer);
    const second = await get('/notifications?' + query + '&page=2', customer);
    assert.equal(first.meta.total, 11);
    assert.equal(first.data.length, 10);
    assert.equal(second.data.length, 1);
    assert.ok([...first.data, ...second.data].every((row) => owned.includes(row.id)));
    assert.equal((await get(`/notifications?q=${token}&readStatus=read`, customer)).meta.total, 1);
    assert.equal((await get(`/notifications?q=${token}`, other)).meta.total, 1);
    assert.equal((await get(`/notifications?q=${token}-missing`, customer)).meta.total, 0);
    assert.equal(
      (await get('/notifications?q=%25_&type=fixture.' + token, customer)).meta.total,
      12,
    );
    const desc = await get(
      '/notifications?' + query.replace('sortOrder=asc', 'sortOrder=desc'),
      customer,
    );
    assert.equal(desc.data[0].id, second.data[0].id);
  });
  test('support filters and message search cannot reveal internal messages or another owner', async () => {
    assert.equal(
      (await get(`/admin/support/tickets?q=${token}&status=open&category=other`)).meta.total,
      1,
    );
    assert.equal(
      (await get(`/support/tickets/mine?q=${token}&status=closed`, customer)).meta.total,
      0,
    );
    assert.equal((await get(`/support/tickets/mine?q=${token}`, other)).meta.total, 0);
    assert.equal(
      (await get(`/support/tickets/${ticket.id}/messages?q=${token}-private`, customer)).meta.total,
      0,
    );
    assert.equal(
      (await get(`/support/tickets/${ticket.id}/messages?q=${token}-private`, admin)).meta.total,
      1,
    );
  });
  test('optional list endpoints retain legacy envelopes and expose true filtered totals', async () => {
    const tags = await get(`/post-categories?q=${token}&pageSize=1&sortBy=name&sortOrder=asc`);
    assert.equal(tags.meta.total, 2);
    assert.equal(tags.data.length, 1);
    assert.ok(tags.data[0].name.endsWith('-A'));
    const templates = await get(`/admin/notification-templates?q=${token}&locale=vi&pageSize=10`);
    assert.equal(templates.meta.total, 1);
    assert.equal(templates.data[0].locale, 'vi');
    const legacy = await get('/admin/notification-templates');
    assert.equal(legacy.meta, undefined);
    assert.ok(Array.isArray(legacy.data));
    const collections = await get(`/collections?q=${token}&pageSize=10`);
    assert.equal(collections.meta.total, 1);
    assert.ok(collections.data[0].title.endsWith('Visible'));
  });
  test('jobs, shipping, merchandising and movement q filters are applied rather than ignored', async () => {
    for (const path of [
      '/admin/jobs',
      '/admin/shipping-methods',
      '/admin/collections',
      '/admin/inventory/movements',
    ]) {
      const yes = await get(`${path}?q=${token}`);
      assert.ok(yes.meta.total > 0, path);
      const no = await get(`${path}?q=missing-${token}`);
      assert.equal(no.meta.total, 0, path);
    }
    assert.equal((await get(`/admin/inventory/movements?q=${token}&kind=return`)).meta.total, 0);
    const active = await get(`/admin/collections?q=${token}&active=false`);
    assert.equal(active.meta.total, 0);
  });
  test('wishlist search joins product fields without weakening owner isolation', async () => {
    const row = await db.WishlistItemModel.findOne({ where: { userId: customer.user.id } });
    const product = await db.ProductModel.findByPk(row.productId);
    const matches = await get(`/wishlist?q=${encodeURIComponent(product.name)}`, customer);
    assert.equal(matches.meta.total, 1);
    assert.equal(matches.data[0].productId, product.id);
    assert.equal(
      (await get(`/wishlist?q=${encodeURIComponent(product.name)}`, other)).meta.total,
      0,
    );
    assert.equal((await get(`/wishlist?q=missing-${token}`, customer)).meta.total, 0);
  });
  test('invalid and unsupported filters fail instead of silently returning unfiltered data', async () => {
    for (const path of [
      '/notifications?readStatus=oops',
      '/notifications?unread=true',
      '/admin/inventory/movements?kind=not-a-kind',
      '/admin/support/tickets?status=whatever',
      '/admin/returns?status=whatever',
      '/admin/exchanges?status=whatever',
      '/post-categories?sortBy=title',
      '/notifications?createdFrom=2026-02-02&createdTo=2026-01-01',
    ]) {
      const body = await get(path, admin, 400);
      assert.equal(body.code, 'input_valid_error');
      assert.ok(Object.keys(body.extensions).length);
    }
  });
});
