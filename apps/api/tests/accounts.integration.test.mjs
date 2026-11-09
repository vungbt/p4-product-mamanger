import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { canAccess, createAppAbility } from '@p4/ability/shared';
import { Op } from 'sequelize';
import {
  AccountTokenModel,
  AddressModel,
  AuditLogModel,
  DomainEventModel,
  RefreshTokenModel,
  sequelize,
  UserModel,
} from '../dist/sequelize/models/index.js';
import { unseal } from '../dist/shared/commerce/encryption.js';

const base = process.env.P4_TEST_API_URL;
describe('account/profile/staff APIs on the local stack', { skip: !base }, () => {
  const ids = [];
  const suffix = randomUUID();
  const password = 'local-Test-12345';
  let admin;
  let actor;
  let other;
  let staff;
  async function call(method, path, body, session, expected = 200) {
    const response = await fetch(base + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(session ? { authorization: `Bearer ${session.token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${result.message ?? ''}`);
    return result.data;
  }
  async function login(email, pw = password) {
    return call('POST', '/auth/login', { email, password: pw });
  }
  async function token(userId, purpose) {
    const record = await AccountTokenModel.findOne({
      where: { userId, purpose, consumedAt: null },
      order: [['createdAt', 'DESC']],
    });
    assert.ok(record);
    const events = await DomainEventModel.findAll({
      where: { aggregateId: userId, type: 'account.mail_requested' },
      order: [['createdAt', 'DESC']],
    });
    const event = events.find((e) => e.payload.tokenId === record.id);
    assert.ok(event);
    return JSON.parse(unseal(event.payload.encrypted)).token;
  }
  async function account(name) {
    const email = `${name}-${suffix}@example.invalid`;
    await call('POST', '/auth/register', { email, password, displayName: name }, undefined, 201);
    const row = await UserModel.findOne({ where: { email } });
    assert.ok(row);
    ids.push(row.id);
    const session = await login(email);
    return { email, row, session };
  }
  before(async () => {
    assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
    admin = await login('admin@example.com', 'password123');
    actor = await account('account');
    other = await account('other');
    staff = await account('staff');
  });
  after(async () => {
    if (ids.length) {
      await AddressModel.destroy({ where: { userId: ids } });
      await RefreshTokenModel.destroy({ where: { userId: ids } });
      await AccountTokenModel.destroy({ where: { userId: ids } });
      await AuditLogModel.destroy({ where: { [Op.or]: [{ resourceId: ids }, { actorId: ids }] } });
      await DomainEventModel.destroy({ where: { aggregateId: ids } });
      await UserModel.destroy({ where: { id: ids } });
    }
    await sequelize.close();
  });
  test('email verification consumes one token once and encrypted outbox never exposes raw tokens', async () => {
    const raw = await token(actor.row.id, 'verify_email');
    const results = await Promise.all([
      fetch(base + '/auth/email-verifications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: raw }),
      }),
      fetch(base + '/auth/email-verifications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: raw }),
      }),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
    const user = await call('GET', '/me/profile', undefined, actor.session);
    assert.equal(user.emailVerified, true);
    assert.equal(Object.hasOwn(user, 'passwordHash'), false);
    const events = await DomainEventModel.findAll({ where: { aggregateId: actor.row.id } });
    assert.ok(!JSON.stringify(events.map((e) => e.payload)).includes(raw));
  });
  test('profile/preferences enforce version and reject role injection/invalid timezones', async () => {
    const user = await call('GET', '/me/profile', undefined, actor.session);
    const updated = await call(
      'PATCH',
      '/me/profile',
      { expectedVersion: user.version, displayName: 'Changed', role: 'admin' },
      actor.session,
    );
    assert.equal(updated.role, 'user');
    assert.equal(updated.displayName, 'Changed');
    await call(
      'PATCH',
      '/me/profile',
      { expectedVersion: user.version, displayName: 'Stale' },
      actor.session,
      409,
    );
    await call(
      'PATCH',
      '/me/preferences',
      { expectedVersion: updated.version, locale: 'en', timezone: 'wrong/timezone' },
      actor.session,
      400,
    );
    const prefs = await call(
      'PATCH',
      '/me/preferences',
      { expectedVersion: updated.version, locale: 'en', timezone: 'UTC' },
      actor.session,
    );
    assert.equal(prefs.locale, 'en');
  });
  test('address defaults serialize concurrent updates and remain scoped', async () => {
    const data = {
      fullName: 'Test',
      phone: '0900000000',
      line1: 'Test street',
      city: 'Test city',
      isDefault: true,
    };
    const a = await call('POST', '/addresses', data, actor.session, 201);
    const b = await call('POST', '/addresses', data, actor.session, 201);
    await Promise.all([
      call('PATCH', `/addresses/${a.id}/default`, {}, actor.session),
      call('PATCH', `/addresses/${b.id}/default`, {}, actor.session),
    ]);
    assert.equal(await AddressModel.count({ where: { userId: actor.row.id, isDefault: true } }), 1);
    await call('PATCH', `/addresses/${a.id}/default`, {}, other.session, 404);
  });
  test('staff invitations require the recipient and permissions apply to old admin routes', async () => {
    await call(
      'POST',
      '/admin/staff/invitations',
      { email: staff.email, staffRole: 'content' },
      admin,
      202,
    );
    const raw = await token(staff.row.id, 'staff_invitation');
    await call('POST', '/staff/invitations/accept', { token: raw }, other.session, 403);
    await call('POST', '/staff/invitations/accept', { token: raw }, staff.session);
    staff.session = await login(staff.email);
    const caps = await call('GET', '/me/capabilities', undefined, staff.session);
    const ability = createAppAbility(caps.rules);
    assert.ok(canAccess(ability, 'write', 'Content'));
    assert.equal(canAccess(ability, 'write', 'Catalog'), false);
    await call('POST', '/products', { name: 'Forbidden', price: 1, stock: 1 }, staff.session, 403);
    await call('GET', '/orders', undefined, staff.session, 403);
    await call('GET', '/admin/audit-logs', undefined, staff.session, 403);
  });
  test('Better Auth sessions stay valid across reads and revocation invalidates the session token', async () => {
    const fresh = await login(other.email);
    const results = await Promise.all([
      fetch(base + '/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: fresh.refreshToken }),
      }),
      fetch(base + '/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: fresh.refreshToken }),
      }),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 200]);
    const active = await login(other.email);
    const sessions = await call('GET', '/me/sessions', undefined, active);
    assert.ok(sessions.length);
    const current = sessions[0];
    assert.ok(current);
    await call('DELETE', `/me/sessions/${current.id}`, undefined, active);
    await call('GET', '/me/profile', undefined, active, 401);
  });
  test('password reset rotates auth version and revokes previous access sessions', async () => {
    await call('POST', '/auth/password-reset-requests', { email: actor.email }, undefined, 202);
    const raw = await token(actor.row.id, 'password_reset');
    await call('POST', '/auth/password-resets', { token: raw, password: 'new-Test-12345' });
    await call('GET', '/me/profile', undefined, actor.session, 401);
    await login(actor.email, 'new-Test-12345');
    await call(
      'POST',
      '/auth/password-resets',
      { token: raw, password: 'new-Test-12345' },
      undefined,
      400,
    );
  });
  test('audit output is permission guarded and excludes credentials', async () => {
    const events = await call('GET', `/admin/audit-logs?actorId=${actor.row.id}`, undefined, admin);
    assert.ok(events.length > 0);
    assert.ok(!JSON.stringify(events).includes(password));
    await call('GET', '/admin/audit-logs', undefined, other.session, 403);
  });
});
