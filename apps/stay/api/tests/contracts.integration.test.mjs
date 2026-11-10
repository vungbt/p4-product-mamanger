// ST-10: run by the existing CI Postgres integration runner. No local DB is started.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import {
  AuditLogModel,
  ContractModel,
  DepositEntryModel,
  sequelize,
} from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();

async function call(cookie, method, path, body, headers = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      origin,
      ...(cookie ? { cookie } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return { status: response.status, body: await response.json() };
}

async function signIn(credentials) {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  assert.equal(response.status, 200, await response.clone().text());
  return response.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
}

function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body.data;
}

function invalid(result, field) {
  assert.equal(result.status, 400, JSON.stringify(result.body));
  assert.ok(result.body.extensions[field]?.[0], JSON.stringify(result.body));
}

describe('Stay rental contracts', { skip: !base }, () => {
  let owner, building, other, tenants, services, room, draft;
  let number = 0;
  const input = (overrides = {}) => ({
    roomId: room.id,
    startDate: '2026-11-20',
    endDate: '2027-11-19',
    rent: 3_000_000,
    depositAmount: 3_000_000,
    depositCollected: true,
    depositMethod: 'bank_transfer',
    depositDate: '2026-11-20',
    initialElectric: 1250,
    initialWater: 88,
    occupantIds: tenants.slice(0, 2).map((t) => t.id),
    primaryTenantId: tenants[0].id,
    serviceIds: services
      .filter((s) => ['internet', 'garbage', 'common_fee', 'parking'].includes(s.code))
      .map((s) => s.id),
    vehicleIds: [],
    note: 'Private note never in audit',
    ...overrides,
  });
  const newRoom = async (options = {}) =>
    ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `C${++number}`,
        floor: 1,
        listPrice: 3_000_000,
        maxOccupants: 2,
        initialElectric: 1250,
        initialWater: 88,
        ...options,
      }),
      201,
    );
  const create = async (body = input(), headers) =>
    ok(await call(owner, 'POST', '/contracts', body, headers), 201);
  const activate = (id, cookie = owner) => call(cookie, 'POST', `/contracts/${id}/activate`);

  before(async () => {
    owner = await signIn({ email: 'owner@stay.local', password: 'stay-owner-123' });
    building = ok(
      await call(owner, 'POST', '/buildings', { code: `C${suffix}`, name: `Contracts ${suffix}` }),
      201,
    );
    other = ok(
      await call(owner, 'POST', '/buildings', { code: `X${suffix}`, name: `Other ${suffix}` }),
      201,
    );
    tenants = [];
    for (let i = 0; i < 3; i++)
      tenants.push(
        ok(
          await call(owner, 'POST', '/tenants', {
            buildingId: building.id,
            fullName: `Contract test ${i}`,
            phone: `098765432${i}`,
          }),
          201,
        ),
      );
    services = ok(await call(owner, 'GET', '/services'));
    room = await newRoom();
  });
  after(() => sequelize.close());

  test('local seed has nine active contracts in building A', async () => {
    const a = ok(await call(owner, 'GET', '/buildings')).find((b) => b.code === 'A');
    const seeded = ok(
      await call(owner, 'GET', `/contracts?buildingId=${a.id}&status=active&pageSize=100`),
    );
    assert.equal(seeded.filter((c) => c.code.match(/^HD-A-000[1-9]$/)).length, 9);
  });

  test('requires authentication, validates request and query fields', async () => {
    const id = randomUUID();
    for (const [method, path] of [
      ['GET', '/contracts'],
      ['POST', '/contracts'],
      ['GET', `/contracts/${id}`],
      ['PUT', `/contracts/${id}`],
      ['POST', `/contracts/${id}/activate`],
      ['POST', `/contracts/${id}/cancel`],
      ['GET', `/contracts/${id}/move-in-preview`],
    ])
      assert.equal(
        (await call(undefined, method, path, method === 'GET' ? undefined : {})).status,
        401,
      );
    invalid(
      await call(owner, 'POST', '/contracts', input({ startDate: '2026-02-30' })),
      'startDate',
    );
    invalid(
      await call(owner, 'POST', '/contracts', input({ occupantIds: [tenants[0].id, 17] })),
      'occupantIds',
    );
    invalid(await call(owner, 'GET', '/contracts?status=oops&expiring=yes'), 'status');
  });

  test('creates per-building codes, draft updates require the current version, optional idempotency', async () => {
    const key = randomUUID();
    draft = await create(input(), { 'Idempotency-Key': key });
    assert.equal(draft.code, `HD-${building.code}-0001`);
    assert.equal(draft.status, 'draft');
    const replay = await create(input(), { 'Idempotency-Key': key });
    assert.equal(replay.id, draft.id);
    assert.equal(
      (await call(owner, 'POST', '/contracts', input({ rent: 4 }), { 'Idempotency-Key': key }))
        .status,
      409,
    );
    const updated = ok(
      await call(owner, 'PUT', `/contracts/${draft.id}`, { ...input(), version: draft.version }),
    );
    assert.equal(updated.version, draft.version + 1);
    assert.equal(
      (await call(owner, 'PUT', `/contracts/${draft.id}`, { ...input(), version: draft.version }))
        .status,
      409,
    );
    draft = updated;
  });

  test('move-in preview matches rules.md: 20 November, two people, one vehicle, no utilities/deposit', async () => {
    const vehicle = ok(
      await call(owner, 'POST', `/tenants/${tenants[0].id}/vehicles`, {
        plate: '59-X1 123.45',
        type: 'motorbike',
      }),
      201,
    );
    // Use explicit prices so the example stays independent of other suites changing defaults.
    const expected = { internet: 100000, garbage: 30000, common_fee: 50000, parking: 100000 };
    for (const [code, price] of Object.entries(expected)) {
      const s = services.find((s) => s.code === code);
      assert.ok(s, code);
      ok(
        await call(owner, 'PUT', `/buildings/${building.id}/prices`, {
          serviceId: s.id,
          price,
          effectiveFrom: '2026-01-01',
        }),
      );
    }
    draft = ok(
      await call(owner, 'PUT', `/contracts/${draft.id}`, {
        ...input({ vehicleIds: [vehicle.id] }),
        version: draft.version,
      }),
    );
    const preview = ok(await call(owner, 'GET', `/contracts/${draft.id}/move-in-preview`));
    assert.equal(preview.occupantCount, 2);
    assert.equal(preview.vehicleCount, 1);
    assert.equal(preview.total, 1221000);
    assert.equal(preview.subtotal, 1221001);
    assert.equal(
      preview.lines.reduce((n, l) => n + l.amount, 0),
      preview.total,
    );
    assert.deepEqual(
      preview.lines
        .filter((l) => !['service', 'rounding'].includes(l.type))
        .map((l) => [l.type, l.amount]),
      [['rent', 1100000]],
    );
    assert.equal(preview.lines[0].ratioNum, 11);
    assert.equal(preview.lines[0].ratioDen, 30);
    assert.equal(await DepositEntryModel.count({ where: { contractId: draft.id } }), 0);
  });

  test('activation receives one deposit, records history and derives reserved then occupied room/tenant status', async () => {
    const active = ok(await activate(draft.id));
    assert.equal(active.status, 'active');
    assert.equal(active.depositHeld, 3000000);
    assert.equal(await DepositEntryModel.count({ where: { contractId: active.id } }), 1);
    assert.equal(active.events.filter((e) => e.type === 'activated').length, 1);
    assert.equal((await activate(draft.id)).status, 409);
    assert.equal(await DepositEntryModel.count({ where: { contractId: active.id } }), 1);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(
      new Date(),
    );
    const detail = ok(await call(owner, 'GET', `/rooms/${room.id}`));
    assert.equal(detail.status, today < '2026-11-20' ? 'reserved' : 'occupied');
    assert.equal(detail.contract.id, active.id);
    // Backdate this fixture to exercise living status independent of the CI clock.
    await ContractModel.update({ startDate: '2020-01-01' }, { where: { id: active.id } });
    await sequelize.query(
      "UPDATE contract_occupants SET from_date='2020-01-01' WHERE contract_id=:id",
      { replacements: { id: active.id } },
    );
    const tenant = ok(await call(owner, 'GET', `/tenants/${tenants[0].id}`));
    assert.equal(tenant.status, 'living');
    assert.equal(tenant.currentRoom.id, room.id);
    assert.ok(tenant.contracts.some((c) => c.id === active.id));
    assert.equal(ok(await call(owner, 'GET', `/rooms/${room.id}`)).status, 'occupied');
    assert.equal(
      (
        await call(owner, 'POST', `/rooms/${room.id}/maintenance`, {
          maintenance: true,
          reason: 'Blocked',
          version: detail.version,
        })
      ).status,
      409,
    );
    const logs = await AuditLogModel.findAll({
      where: { resourceType: 'contract', resourceId: active.id },
    });
    assert.ok(logs.length);
    for (const log of logs) {
      const text = JSON.stringify(log.changes);
      for (const personal of ['Private note', 'Contract test', '098765432', '123.45'])
        assert.equal(text.includes(personal), false, text);
    }
  });

  test('cancellation leaves no deposit; active contracts cannot be edited or cancelled', async () => {
    const cancelled = await create(input());
    assert.equal(
      ok(await call(owner, 'POST', `/contracts/${cancelled.id}/cancel`)).status,
      'cancelled',
    );
    assert.equal(await DepositEntryModel.count({ where: { contractId: cancelled.id } }), 0);
    assert.equal((await activate(cancelled.id)).status, 409);
    assert.equal((await call(owner, 'POST', `/contracts/${draft.id}/cancel`)).status, 409);
    assert.equal(
      (await call(owner, 'PUT', `/contracts/${draft.id}`, { ...input(), version: draft.version }))
        .status,
      409,
    );
  });

  test('concurrent activations: one success; direct DB writes also obey the partial unique index', async () => {
    const target = await newRoom();
    const a = await create(input({ roomId: target.id }));
    const b = await create(input({ roomId: target.id }));
    const results = await Promise.all([activate(a.id), activate(b.id)]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    const loser = results[0].status === 200 ? b : a;
    await assert.rejects(
      () => ContractModel.update({ status: 'active' }, { where: { id: loser.id } }),
      (error) => error.name === 'SequelizeUniqueConstraintError',
    );
    assert.equal(await DepositEntryModel.count({ where: { contractId: loser.id } }), 0);
  });

  test('maintenance, initial meter readings, primary occupant and room capacity block activation', async () => {
    const target = await newRoom();
    const on = ok(
      await call(owner, 'POST', `/rooms/${target.id}/maintenance`, {
        maintenance: true,
        reason: 'Repair',
        version: target.version,
      }),
    );
    let d = await create(input({ roomId: target.id }));
    assert.equal((await activate(d.id)).status, 409);
    ok(
      await call(owner, 'POST', `/rooms/${target.id}/maintenance`, {
        maintenance: false,
        version: on.version,
      }),
    );
    d = ok(
      await call(owner, 'PUT', `/contracts/${d.id}`, {
        ...input({ roomId: target.id, initialElectric: 1249, initialWater: 87 }),
        version: d.version,
      }),
    );
    invalid(await activate(d.id), 'initialElectric');
    invalid(await activate(d.id), 'initialWater');
    d = ok(
      await call(owner, 'PUT', `/contracts/${d.id}`, {
        ...input({ roomId: target.id, occupantIds: [], primaryTenantId: null }),
        version: d.version,
      }),
    );
    invalid(await activate(d.id), 'primaryTenantId');
    d = ok(
      await call(owner, 'PUT', `/contracts/${d.id}`, {
        ...input({ roomId: target.id, occupantIds: tenants.map((t) => t.id) }),
        version: d.version,
      }),
    );
    assert.equal(
      ok(await call(owner, 'GET', `/contracts/${d.id}/move-in-preview`)).warnings.length,
      1,
    );
    invalid(await activate(d.id), 'occupantIds');
    assert.equal(await DepositEntryModel.count({ where: { contractId: d.id } }), 0);
  });

  test('list filters, pagination and expiring ≤ 30 days', async () => {
    const list = await call(
      owner,
      'GET',
      `/contracts?buildingId=${building.id}&status=active&pageSize=1`,
    );
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 1);
    assert.ok(list.body.meta.total >= 2);
    assert.ok(
      ok(await call(owner, 'GET', `/contracts?buildingId=${building.id}&roomId=${room.id}`)).every(
        (c) => c.roomId === room.id,
      ),
    );
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(
      new Date(),
    );
    await ContractModel.update({ endDate: today }, { where: { id: draft.id } });
    const expiring = ok(
      await call(owner, 'GET', `/contracts?buildingId=${building.id}&expiring=true`),
    );
    assert.ok(expiring.some((c) => c.id === draft.id));
    await ContractModel.update({ endDate: '2099-01-01' }, { where: { id: draft.id } });
    assert.equal(
      ok(await call(owner, 'GET', `/contracts?buildingId=${building.id}&expiring=true`)).some(
        (c) => c.id === draft.id,
      ),
      false,
    );
  });

  test('manager has building-scoped reads/writes; missing scope is 404, owner-only resources are 403', async () => {
    const id = randomUUID();
    const email = `contract-manager-${suffix}@stay.local`;
    const password = 'manager-password-123';
    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'Manager',true,'manager','active');
      INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash);
      INSERT INTO building_members(id,building_id,user_id) VALUES(:memberId,:buildingId,:id);`,
      {
        replacements: {
          id,
          email,
          accountId: randomUUID(),
          memberId: randomUUID(),
          buildingId: building.id,
          hash: await bcrypt.hash(password, 10),
        },
      },
    );
    const manager = await signIn({ email, password });
    assert.equal((await call(manager, 'GET', `/contracts/${draft.id}`)).status, 200);
    assert.equal((await call(manager, 'GET', `/contracts?buildingId=${other.id}`)).status, 404);
    const otherRoom = ok(
      await call(owner, 'POST', `/buildings/${other.id}/rooms`, {
        code: 'M1',
        floor: 1,
        listPrice: 1,
        maxOccupants: 2,
      }),
      201,
    );
    const hidden = await create(
      input({ roomId: otherRoom.id, occupantIds: [], primaryTenantId: null, vehicleIds: [] }),
    );
    for (const [method, path, body] of [
      ['GET', `/contracts/${hidden.id}`],
      ['GET', `/contracts/${hidden.id}/move-in-preview`],
      [
        'PUT',
        `/contracts/${hidden.id}`,
        { ...input({ roomId: otherRoom.id }), version: hidden.version },
      ],
      ['POST', `/contracts/${hidden.id}/activate`],
      ['POST', `/contracts/${hidden.id}/cancel`],
    ])
      assert.equal((await call(manager, method, path, body)).status, 404, path);
    assert.equal(
      (await call(manager, 'POST', '/contracts', input({ roomId: otherRoom.id }))).status,
      404,
    );
    assert.equal((await call(manager, 'PUT', '/settings', {})).status, 403);
    const own = ok(await call(manager, 'POST', '/contracts', input()), 201);
    assert.equal((await call(manager, 'POST', `/contracts/${own.id}/cancel`)).status, 200);
  });
});
