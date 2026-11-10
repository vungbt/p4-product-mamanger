// ST-23: CI supplies Postgres and the running API. No local database is needed to build.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { AuditLogModel, BuildingModel, sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const marker = `audit-${randomUUID()}`;
const actorId = randomUUID();
const managerId = randomUUID();
const tenantId = randomUUID();
const ids = Array.from({ length: 5 }, () => randomUUID());
const buildings = [randomUUID(), randomUUID()];
const password = 'audit-test-password-123';

async function signIn(email, pass = password) {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });

  assert.equal(response.status, 200, await response.clone().text());
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}

async function get(cookie, path) {
  const response = await fetch(`${base}/api/audit-logs${path}`, {
    headers: { origin, ...(cookie ? { cookie } : {}) },
  });

  return { status: response.status, body: await response.json() };
}

async function createUser(id, role) {
  const email = `${id}@stay.local`;

  await sequelize.query(
    `INSERT INTO users (id, email, display_name, email_verified, role, account_status)
    VALUES (:id, :email, 'Audit test', true, :role, 'active');
    INSERT INTO auth_accounts (id, account_id, provider_id, user_id, password)
    VALUES (:accountId, :id, 'credential', :id, :hash);`,
    {
      replacements: {
        id,
        email,
        role,
        accountId: randomUUID(),
        hash: await bcrypt.hash(password, 10),
      },
    },
  );
  return signIn(email);
}

describe('Stay audit viewer', { skip: !base }, () => {
  let owner;
  let manager;
  let tenant;

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    for (const [index, id] of buildings.entries())
      await BuildingModel.create({
        id,
        code: `T${id.replaceAll('-', '').slice(0, 5)}`,
        name: `Audit ${index}`,
      });
    manager = await createUser(managerId, 'manager');
    tenant = await createUser(tenantId, 'tenant');
    await sequelize.query(
      'INSERT INTO building_members (id, building_id, user_id) VALUES (:id, :buildingId, :userId)',
      {
        replacements: { id: randomUUID(), buildingId: buildings[0], userId: managerId },
      },
    );
    const changes = [
      {
        buildingId: buildings[0],
        before: { password: 'password-value', cccd: '012345678901' },
        after: {
          accessToken: 'token-value',
          nested: [
            {
              idNumber: '123456789',
              id_number: '987654321012',
              cookie: 'session-cookie-value',
              fileUrl: 'https://private.example/file',
              safe: 'visible',
            },
          ],
        },
      },
      { after: { buildingId: buildings[0], amount: 200 } },
      { buildingId: buildings[1] },
      { amount: 400 },
      { before: { buildingId: buildings[0] } },
    ];
    for (const [index, id] of ids.entries())
      await AuditLogModel.create({
        id,
        actorId,
        action: index === 1 ? 'issue' : 'update',
        resourceType: index === 4 ? 'building' : 'invoice',
        resourceId: index === 4 ? buildings[0] : `${marker}-${index}`,
        changes: changes[index],
        outcome: 'success',
        requestId: marker,
        reason: 'token-value',
        createdAt: new Date(`2026-10-${10 + index}T10:00:00Z`),
      });
  });

  after(async () => {
    await AuditLogModel.destroy({
      where: {
        [Op.or]: [{ id: { [Op.in]: ids } }, { actorId: { [Op.in]: [managerId, tenantId] } }],
      },
    });
    await sequelize.query('DELETE FROM users WHERE id IN (:ids)', {
      replacements: { ids: [managerId, tenantId] },
    });
    await BuildingModel.destroy({ where: { id: { [Op.in]: buildings } } });
    await sequelize.close();
  });

  test('signed out and tenant access is denied on both endpoints', async () => {
    for (const path of ['', `/${ids[0]}`]) {
      assert.equal((await get(undefined, path)).status, 401);
      assert.equal((await get(tenant, path)).status, 403);
    }
  });

  test('owner list is paginated, searchable and deterministically sorted', async () => {
    const result = await get(
      owner,
      `?actorId=${actorId}&pageSize=2&sortBy=createdAt&sortOrder=asc`,
    );

    assert.equal(result.status, 200);
    assert.deepEqual(
      result.body.data.map((entry) => entry.id),
      ids.slice(0, 2),
    );
    assert.equal(result.body.meta.total, 5);
    const page = await get(owner, `?actorId=${actorId}&page=2&pageSize=2&sortOrder=asc`);

    assert.deepEqual(
      page.body.data.map((entry) => entry.id),
      ids.slice(2, 4),
    );
    assert.equal((await get(owner, `?q=${marker}`)).body.meta.total, 4);
  });

  test('filters combine actor, action, type, building, record and inclusive dates', async () => {
    const result = await get(
      owner,
      `?actorId=${actorId}&action=issue&resourceType=invoice&buildingId=${buildings[0]}&from=2026-10-11&to=2026-10-11`,
    );

    assert.equal(result.status, 200);
    assert.deepEqual(
      result.body.data.map((entry) => entry.id),
      [ids[1]],
    );
    assert.equal((await get(owner, `?resourceId=${marker}-2`)).body.data[0].id, ids[2]);
    assert.equal((await get(owner, `?actorId=${randomUUID()}`)).body.meta.total, 0);
  });

  test('detail, missing IDs and invalid input', async () => {
    assert.equal((await get(owner, `/${ids[0]}`)).body.data.id, ids[0]);
    assert.equal((await get(owner, `/${randomUUID()}`)).status, 404);
    for (const query of [
      'actorId=no',
      'buildingId=no',
      'from=invalid',
      'from=2026-10-12&to=2026-10-10',
      'sortBy=changes',
      'pageSize=101',
      'page=0',
    ])
      assert.equal((await get(owner, `?${query}`)).status, 400, query);
    assert.equal((await get(owner, '/invalid')).status, 400);
  });

  test('managers see only assigned buildings including nested audit contexts', async () => {
    const result = await get(manager, `?actorId=${actorId}&sortOrder=asc`);

    assert.equal(result.status, 200);
    assert.deepEqual(
      result.body.data.map((entry) => entry.id),
      [ids[0], ids[1], ids[4]],
    );
    for (const id of [ids[0], ids[1], ids[4]])
      assert.equal((await get(manager, `/${id}`)).status, 200);
    for (const id of [ids[2], ids[3]]) assert.equal((await get(manager, `/${id}`)).status, 404);
    assert.equal(
      (await get(manager, `?buildingId=${buildings[1]}&actorId=${actorId}`)).body.meta.total,
      0,
    );
  });

  test('list and detail redact legacy rows recursively at read time', async () => {
    for (const result of [
      await get(owner, `/${ids[0]}`),
      await get(owner, `?resourceId=${marker}-0`),
    ]) {
      const text = JSON.stringify(result.body);

      for (const secret of [
        'password-value',
        '012345678901',
        'token-value',
        '123456789',
        '987654321012',
        'session-cookie-value',
        'https://private.example/file',
      ])
        assert.ok(!text.includes(secret), secret);
      assert.ok(text.includes('[REDACTED]'));
      assert.ok(text.includes('visible'));
    }
  });
});
