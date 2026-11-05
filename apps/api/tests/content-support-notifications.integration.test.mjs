import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { safeContentUrl } from '../dist/modules/content/content.validation.js';
import * as db from '../dist/sequelize/models/index.js';

test('content URL policy rejects executable and protocol-relative URLs', () => {
  assert.equal(safeContentUrl('/shop'), '/shop');
  assert.throws(() => safeContentUrl('javascript:alert(1)'));
  assert.throws(() => safeContentUrl('//evil.example'));
  assert.throws(() => safeContentUrl('/\\evil.example'));
  assert.throws(() => safeContentUrl('https://user:pass@example.com'));
});
const base = process.env.P4_TEST_API_URL;
describe('content/support/notifications local APIs', { skip: !base }, () => {
  const suffix = randomUUID();
  let admin, customer, other, post, ticket;
  const userIds = [];
  async function call(method, path, body, session = customer, expected = 200) {
    const res = await fetch(base + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(session ? { authorization: `Bearer ${session.token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await res.json();
    assert.equal(res.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
    return result.data;
  }
  before(async () => {
    assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
    admin = await call(
      'POST',
      '/auth/login',
      { email: 'admin@example.com', password: 'password123' },
      null,
    );
    for (const label of ['content-test', 'content-other']) {
      const user = await db.UserModel.create({
        email: `${label}-${suffix}@example.invalid`,
        role: 'user',
        passwordHash: await bcrypt.hash('test-password-12345', 10),
      });
      userIds.push(user.id);
      const session = await call(
        'POST',
        '/auth/login',
        { email: user.email, password: 'test-password-12345' },
        null,
      );
      if (!customer) customer = session;
      else other = session;
    }
  });
  after(async () => {
    try {
      if (ticket) {
        await db.SupportMessageModel.destroy({ where: { ticketId: ticket.id } });
        await db.SupportTicketModel.destroy({ where: { id: ticket.id } });
      }
      if (post) {
        await db.ContentRevisionModel.destroy({ where: { entryId: post.id } });
        await db.ContentRedirectModel.destroy({ where: { entryId: post.id } });
        await db.ContentEntryModel.destroy({ where: { id: post.id } });
        await db.DomainEventModel.destroy({ where: { aggregateId: post.id } });
      }
      await db.RealtimeEventModel.destroy({ where: { userId: userIds } });
      await db.NotificationModel.destroy({ where: { userId: userIds } });
      await db.NotificationDeliveryModel.destroy({ where: { userId: userIds } });
      await db.NotificationPreferencesModel.destroy({ where: { userId: userIds } });
      await db.DomainEventModel.destroy({ where: { aggregateId: ticket?.id ?? '' } });
      await db.AuditLogModel.destroy({
        where: {
          [Op.or]: [{ actorId: userIds }, { resourceId: [post?.id, ticket?.id].filter(Boolean) }],
        },
      });
      await db.RefreshTokenModel.destroy({ where: { userId: userIds } });
      await db.UserModel.destroy({ where: { id: userIds } });
    } finally {
      await db.sequelize.close();
    }
  });
  test('drafts stay private and editing published content preserves the public revision', async () => {
    const input = {
      slug: `test-${suffix}`,
      title: 'Original',
      body: [{ type: 'paragraph', text: 'Safe body' }],
    };
    await call(
      'POST',
      '/admin/posts',
      { ...input, body: [{ type: 'paragraph', text: '<script>evil</script>' }] },
      admin,
      400,
    );
    post = await call('POST', '/admin/posts', input, admin, 201);
    await call('GET', `/posts/${input.slug}`, undefined, null, 404);
    post = await call(
      'POST',
      `/admin/posts/${post.id}/publish`,
      { expectedVersion: post.version },
      admin,
    );
    assert.equal((await call('GET', `/posts/${input.slug}`, undefined, null)).title, 'Original');
    post = await call(
      'PATCH',
      `/admin/posts/${post.id}`,
      { ...input, title: 'Unpublished change', expectedVersion: post.version },
      admin,
    );
    assert.equal((await call('GET', `/posts/${input.slug}`, undefined, null)).title, 'Original');
    await call('PATCH', `/admin/posts/${post.id}`, { ...input, expectedVersion: 1 }, admin, 409);
    await call(
      'POST',
      `/admin/posts/${post.id}/publish`,
      { expectedVersion: post.version },
      customer,
      403,
    );
  });
  test('support ownership, internal messages and version conflicts are enforced', async () => {
    ticket = await call(
      'POST',
      '/support/tickets',
      { subject: 'Test request', category: 'other', body: 'Customer message' },
      customer,
      201,
    );
    await call('GET', `/support/tickets/${ticket.id}`, undefined, other, 403);
    await call(
      'POST',
      `/support/tickets/${ticket.id}/messages`,
      { body: 'Cannot inject internal', internal: true, expectedVersion: ticket.version },
      customer,
      403,
    );
    await call(
      'POST',
      `/support/tickets/${ticket.id}/messages`,
      { body: 'Staff private note', internal: true, expectedVersion: ticket.version },
      admin,
      201,
    );
    const publicMessages = await call('GET', `/support/tickets/${ticket.id}/messages`);
    assert.equal(publicMessages.length, 1);
    assert.equal(publicMessages[0].internal, false);
    const staffMessages = await call(
      'GET',
      `/support/tickets/${ticket.id}/messages`,
      undefined,
      admin,
    );
    assert.equal(staffMessages.length, 2);
    await call(
      'POST',
      `/support/tickets/${ticket.id}/messages`,
      { body: 'Stale', expectedVersion: ticket.version },
      customer,
      409,
    );
    const refreshed = await call('GET', `/support/tickets/${ticket.id}`);
    await call('POST', `/support/tickets/${ticket.id}/close`, {
      reason: 'Resolved',
      expectedVersion: refreshed.version,
    });
  });
  test('notification preferences are versioned and inbox/read actions are scoped', async () => {
    let pref = await call('GET', '/me/notification-preferences');
    pref = await call('PATCH', '/me/notification-preferences', {
      expectedVersion: pref.version,
      transactionalEmail: false,
      marketingEmail: false,
      stockEmail: false,
    });
    await call(
      'PATCH',
      '/me/notification-preferences',
      {
        expectedVersion: pref.version - 1,
        transactionalEmail: true,
        marketingEmail: true,
        stockEmail: true,
      },
      customer,
      409,
    );
    const event = await db.DomainEventModel.create({
      id: randomUUID(),
      type: 'support.message',
      aggregateType: 'support_ticket',
      aggregateId: ticket.id,
      payload: { ticketId: ticket.id },
      status: 'pending',
      attempts: 0,
      availableAt: new Date(),
      leaseUntil: null,
      deliveredAt: null,
    });
    const { supportNotification } = await import(
      '../dist/modules/notifications/notifications.service.js'
    );
    await supportNotification(event);
    await supportNotification(event);
    const inbox = await call('GET', '/notifications');
    assert.equal(inbox.length, 1);
    assert.equal((await call('GET', '/notifications/unread-count')).count, 1);
    await call('POST', `/notifications/${inbox[0].id}/read`, {}, other, 404);
    await call('POST', `/notifications/${inbox[0].id}/read`, {});
    assert.equal((await call('GET', '/notifications/unread-count')).count, 0);
    assert.equal(
      await db.NotificationDeliveryModel.count({
        where: { userId: userIds[0], status: 'suppressed' },
      }),
      1,
    );
  });
});
