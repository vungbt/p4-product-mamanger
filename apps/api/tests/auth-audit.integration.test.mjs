import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { env } from '../dist/configs/env.js';
import { deleteFile } from '../dist/modules/files/files.service.js';
import router from '../dist/modules/index.js';
import * as db from '../dist/sequelize/models/index.js';
import { auditedCommand, setAuditChanges } from '../dist/shared/audit/audited-command.js';
import { applyAuditPolicies } from '../dist/shared/audit/route-policy.js';
import { AUDIT_ACTIONS } from '../dist/shared/audit/types.js';
import { unseal } from '../dist/shared/commerce/encryption.js';
import { runIdempotent } from '../dist/shared/commerce/persistence.js';
import { requestStore } from '../dist/shared/request-store.js';

const base = process.env.P4_TEST_API_URL;
describe('Better Auth and shared audit integration', { skip: !base }, () => {
  const suffix = randomUUID();
  const users = [];
  const categories = [];
  const requestIds = [];
  const password = 'local-Test-12345';
  let owner;
  let customer;
  async function user(role) {
    const row = await db.UserModel.create({
      email: `auth-audit-${role}-${suffix}@example.invalid`,
      role,
      staffRole: role === 'admin' ? 'owner' : null,
      passwordHash: await bcrypt.hash(password, 10),
    });
    users.push(row.id);
    return row;
  }
  async function native(path, body, cookie) {
    const response = await fetch(`${base}/auth${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://127.0.0.1:5173',
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    const requestId = response.headers.get('x-request-id');
    if (requestId) requestIds.push(requestId);
    return {
      response,
      data,
      cookie: response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; '),
    };
  }
  function context(row, action) {
    const requestId = `audit-${action}-${randomUUID()}`;
    requestIds.push(requestId);
    return { requestId, source: 'http', user: { id: row.id, email: row.email, role: row.role } };
  }
  before(async () => {
    assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
    owner = await user('admin');
    customer = await user('user');
  });
  after(async () => {
    try {
      await db.RealtimeEventModel.destroy({ where: { userId: users } });
      await db.IdempotencyRecordModel.destroy({ where: { actorId: users } });
      await db.CategoryModel.destroy({ where: { id: categories } });
      await db.AuditLogModel.destroy({
        where: {
          [Op.or]: [{ actorId: users }, { requestId: requestIds }, { resourceId: categories }],
        },
      });
      await db.DomainEventModel.destroy({ where: { aggregateId: users } });
      await db.UserModel.destroy({ where: { id: users } });
    } finally {
      await db.sequelize.close();
    }
  });
  test('native email sign-in preserves identity and authenticates HttpOnly cookie requests', async () => {
    const login = await native('/sign-in/email', { email: owner.email, password });
    assert.equal(login.response.status, 200);
    assert.equal(login.data.user.id, owner.id);
    assert.ok(login.response.headers.getSetCookie().some((value) => /httponly/i.test(value)));
    assert.ok(login.cookie);
    const response = await fetch(`${base}/me/profile`, { headers: { cookie: login.cookie } });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.data.role, 'admin');
    assert.equal(data.data.passwordHash, undefined);
    const bad = await native('/sign-in/email', { email: owner.email, password: 'wrong-password' });
    assert.equal(bad.response.status, 401);
    const logs = await db.AuditLogModel.findAll({
      where: { actorId: owner.id, action: 'auth.login' },
    });
    assert.ok(logs.some((row) => row.outcome === 'success'));
    assert.ok(!JSON.stringify(logs).includes(password));
    await native('/sign-out', {}, login.cookie);
    assert.equal(
      (await fetch(`${base}/me/profile`, { headers: { cookie: login.cookie } })).status,
      401,
    );
  });
  test('cookie-authenticated business mutations reject untrusted or missing origins', async () => {
    const login = await native('/sign-in/email', { email: owner.email, password });
    for (const origin of [undefined, 'https://untrusted.example.invalid']) {
      const response = await fetch(`${base}/notifications/read-all`, {
        method: 'POST',
        headers: { cookie: login.cookie, ...(origin ? { origin } : {}) },
      });
      assert.equal(response.status, 403);
    }
    const allowed = await fetch(`${base}/notifications/read-all`, {
      method: 'POST',
      headers: { cookie: login.cookie, origin: 'http://127.0.0.1:5173' },
    });
    assert.equal(allowed.status, 200);
    await native('/sign-out', {}, login.cookie);
  });
  test('legacy JWT cannot authenticate after the Better Auth migration', async () => {
    const token = jwt.sign(
      { sub: owner.id, email: owner.email, role: 'admin', ver: owner.authVersion },
      env.jwt.secret,
    );
    assert.equal(
      (await fetch(`${base}/me/profile`, { headers: { authorization: `Bearer ${token}` } })).status,
      401,
    );
  });
  test('native signup cannot inject an admin role and stores its mail intent encrypted', async () => {
    const email = `auth-audit-signup-${suffix}@example.invalid`;
    const signup = await native('/sign-up/email', {
      email,
      name: 'SDK customer',
      password,
      role: 'admin',
    });
    assert.equal(signup.response.status, 200);
    users.push(signup.data.user.id);
    const row = await db.UserModel.findByPk(signup.data.user.id);
    assert.equal(row.role, 'user');
    const events = await db.DomainEventModel.findAll({
      where: { aggregateId: row.id, type: 'auth.mail_requested' },
    });
    assert.ok(events.length);
    assert.ok(!JSON.stringify(events.map((row) => row.payload)).includes(email));
  });
  test('native password change revokes other sessions and preserves the credential for rollback compatibility', async () => {
    const first = await native('/sign-in/email', { email: customer.email, password });
    const second = await native('/sign-in/email', { email: customer.email, password });
    const nextPassword = 'native-New-12345';
    const change = await native(
      '/change-password',
      { currentPassword: password, newPassword: nextPassword, revokeOtherSessions: true },
      first.cookie,
    );
    assert.equal(change.response.status, 200);
    assert.equal(
      (await fetch(`${base}/me/profile`, { headers: { cookie: second.cookie } })).status,
      401,
    );
    const login = await native('/sign-in/email', { email: customer.email, password: nextPassword });
    assert.equal(login.response.status, 200);
    assert.equal(
      (await native('/sign-in/email', { email: customer.email, password })).response.status,
      401,
    );
    await customer.reload();
    assert.equal(await bcrypt.compare(nextPassword, customer.passwordHash), true);
  });
  test('native email verification updates the profile and records the verified user', async () => {
    const id = users.at(-1);
    const event = await db.DomainEventModel.findOne({
      where: { aggregateId: id, type: 'auth.mail_requested' },
    });
    const { url } = JSON.parse(unseal(event.payload.encrypted));
    const response = await fetch(url, { redirect: 'manual' });
    assert.ok([200, 302].includes(response.status));
    const account = await db.UserModel.findByPk(id);
    assert.ok(account.emailVerifiedAt);
    const log = await db.AuditLogModel.findOne({ where: { actorId: id, action: 'auth.verify' } });
    assert.ok(log);
    assert.equal(log.outcome, 'success');
  });
  test('all registered routes declare explicit actions; missing or stale policies fail', () => {
    let count = 0;
    const visit = (stack) => {
      for (const layer of stack) {
        if (layer.route) {
          const methods = new Set(layer.route.stack.map((entry) => entry.method).filter(Boolean));
          for (const method of methods) {
            const first = layer.route.stack.find((entry) => entry.method === method);
            const policy = first.handle.auditPolicy;
            assert.ok(policy, `${method} ${layer.route.path}`);
            assert.ok(Object.hasOwn(AUDIT_ACTIONS, policy.action));
            count++;
          }
        } else if (Array.isArray(layer.handle?.stack)) visit(layer.handle.stack);
      }
    };
    visit(router.stack);
    assert.ok(count > 250);
    const missing = Router();
    missing.post('/new', () => {});
    assert.throws(() => applyAuditPolicies(missing, {}), /Missing explicit audit action/);
    const unsafe = Router();
    unsafe.post('/unsafe', () => {});
    assert.throws(
      () =>
        applyAuditPolicies(unsafe, {
          'POST /unsafe': { action: 'update', resourceType: 'category' },
        }),
      /requires apiHandler/,
    );
    const stale = Router();
    assert.throws(
      () =>
        applyAuditPolicies(stale, { 'POST /old': { action: 'create', resourceType: 'category' } }),
      /Stale audit route/,
    );
  });
  test('shared command rolls back both implicit ORM writes and successful audit when work fails', async () => {
    const ctx = context(owner, 'rollback');
    const slug = `rollback-${suffix}`;
    await assert.rejects(
      requestStore.run(ctx, () =>
        auditedCommand({ action: 'create', resourceType: 'category' }, async () => {
          await db.CategoryModel.create({ name: slug, slug, description: '' });
          throw new Error('fixture business failure');
        }),
      ),
      /fixture business failure/,
    );
    assert.equal(await db.CategoryModel.count({ where: { slug } }), 0);
    assert.equal(await db.AuditLogModel.count({ where: { requestId: ctx.requestId } }), 0);
  });
  test('audit insert failure rolls back business changes', async () => {
    const ctx = context(owner, 'write-failure');
    const slug = `audit-failure-${suffix}`;
    const original = db.AuditLogModel.create;
    try {
      db.AuditLogModel.create = async () => {
        throw new Error('fixture audit unavailable');
      };
      await assert.rejects(
        requestStore.run(ctx, () =>
          auditedCommand({ action: 'create', resourceType: 'category' }, async () =>
            db.CategoryModel.create({ name: slug, slug, description: '' }),
          ),
        ),
        /fixture audit unavailable/,
      );
    } finally {
      db.AuditLogModel.create = original;
    }
    assert.equal(await db.CategoryModel.count({ where: { slug } }), 0);
  });
  test('storage cleanup is queued atomically and cannot delete an asset before a rollback', async () => {
    const file = await db.FileModel.create({
      provider: 'cloudinary',
      storageId: `fixture/cleanup/${suffix}`,
      metadata: { ownerId: owner.id },
    });
    try {
      const ctx = context(owner, 'storage-rollback');
      await assert.rejects(
        requestStore.run(ctx, () =>
          auditedCommand(
            { action: 'delete', resourceType: 'file', resourceId: file.id },
            async () => {
              await deleteFile(file.id);
              throw new Error('fixture rollback after delete');
            },
          ),
        ),
        /fixture rollback/,
      );
      assert.ok(await db.FileModel.findByPk(file.id));
      assert.equal(await db.DomainEventModel.count({ where: { aggregateId: file.id } }), 0);
      await requestStore.run(context(owner, 'storage-delete'), () =>
        auditedCommand({ action: 'delete', resourceType: 'file', resourceId: file.id }, () =>
          deleteFile(file.id),
        ),
      );
      assert.equal(await db.FileModel.findByPk(file.id), null);
      assert.equal(
        await db.DomainEventModel.count({
          where: { aggregateId: file.id, type: 'file.delete_requested' },
        }),
        1,
      );
    } finally {
      await db.DomainEventModel.destroy({ where: { aggregateId: file.id } });
      await db.FileModel.destroy({ where: { id: file.id } });
    }
  });
  test('parallel commands isolate actors, redact credentials and share the same transaction', async () => {
    const runs = await Promise.all(
      [owner, customer].map((row, index) => {
        const ctx = context(row, `parallel-${index}`);
        return requestStore.run(ctx, () =>
          auditedCommand({ action: 'create', resourceType: 'category' }, async () => {
            const category = await db.CategoryModel.create({
              name: `parallel-${index}`,
              slug: `parallel-${index}-${suffix}`,
              description: '',
            });
            categories.push(category.id);
            setAuditChanges({ after: { id: category.id, password: 'never-log-this' } });
            return { id: category.id, expectedActor: row.id, requestId: ctx.requestId };
          }),
        );
      }),
    );
    for (const run of runs) {
      const log = await db.AuditLogModel.findOne({ where: { resourceId: run.id } });
      assert.equal(log.actorId, run.expectedActor);
      assert.equal(log.requestId, run.requestId);
      assert.equal(log.changes.after.password, '[REDACTED]');
    }
  });
  test('idempotent replay keeps one business audit while retry remains a separate request', async () => {
    let id;
    for (let i = 0; i < 2; i++) {
      const result = await requestStore.run(context(owner, `idem-${i}`), () =>
        auditedCommand({ action: 'create', resourceType: 'category' }, async () => {
          const result = await runIdempotent(
            { scope: 'audit-fixture', actorId: owner.id, key: suffix, payload: {} },
            async () => {
              const row = await db.CategoryModel.create({
                name: suffix,
                slug: `idem-${suffix}`,
                description: '',
              });
              categories.push(row.id);
              return { id: row.id };
            },
          );
          return result.result;
        }),
      );
      id = result.id;
    }
    assert.equal(await db.AuditLogModel.count({ where: { resourceId: id } }), 1);
  });
});
