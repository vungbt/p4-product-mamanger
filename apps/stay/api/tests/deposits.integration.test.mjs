// ST-11: CI's migrated/seeded Postgres and real API only; never starts a local database.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { applyDepositForSettlement } from '../dist/modules/deposits/deposits.service.js';
import { AuditLogModel, DepositEntryModel, sequelize } from '../dist/sequelize/models/index.js';
import { auditedTransaction } from '../dist/shared/audit.js';

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

async function signIn(email = 'owner@stay.local', password = 'stay-owner-123') {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(response.status, 200, await response.clone().text());
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body.data;
}

const input = (type, amount, reason = null) => ({
  type,
  amount,
  reason,
  method: 'cash',
  occurredOn: '2026-11-20',
});

describe('Stay deposit ledger', { skip: !base }, () => {
  let owner, user, building, other, contract, otherContract;
  let roomNumber = 0;
  const ledger = async (id = contract.id, cookie = owner) =>
    ok(await call(cookie, 'GET', `/contracts/${id}/deposits`));
  const post = (body, id = contract.id, headers = {}) =>
    call(owner, 'POST', `/contracts/${id}/deposits`, body, headers);
  const createContract = async (target) => {
    const room = ok(
      await call(owner, 'POST', `/buildings/${target.id}/rooms`, {
        code: `D${++roomNumber}`,
        floor: 1,
        listPrice: 1000000,
        maxOccupants: 2,
        initialElectric: 0,
        initialWater: 0,
      }),
      201,
    );
    const tenant = ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: target.id,
        fullName: `Deposit ${suffix}`,
        phone: '0901234567',
      }),
      201,
    );
    const draft = ok(
      await call(owner, 'POST', '/contracts', {
        roomId: room.id,
        startDate: '2026-11-20',
        endDate: null,
        rent: 1000000,
        depositAmount: 1000,
        depositCollected: true,
        depositMethod: 'cash',
        depositDate: '2026-11-20',
        initialElectric: 0,
        initialWater: 0,
        occupantIds: [tenant.id],
        primaryTenantId: tenant.id,
        serviceIds: [],
        vehicleIds: [],
      }),
      201,
    );

    return ok(await call(owner, 'POST', `/contracts/${draft.id}/activate`));
  };

  before(async () => {
    owner = await signIn();
    user = ok(await call(owner, 'GET', '/me')).user;
    building = ok(
      await call(owner, 'POST', '/buildings', { code: `D${suffix}`, name: `Deposits ${suffix}` }),
      201,
    );
    other = ok(
      await call(owner, 'POST', '/buildings', {
        code: `E${suffix}`,
        name: `Other deposits ${suffix}`,
      }),
      201,
    );
    contract = await createContract(building);
    otherContract = await createContract(other);
  });
  after(() => sequelize.close());

  test('activation received entry, immutable history, strict validation and owner permission', async () => {
    assert.equal((await ledger()).balance.held, 1000);
    for (const [method, path] of [
      ['GET', '/deposits'],
      ['GET', `/contracts/${contract.id}/deposits`],
      ['POST', `/contracts/${contract.id}/deposits`],
    ])
      assert.equal(
        (await call(null, method, path, method === 'POST' ? input('received', 1) : undefined))
          .status,
        401,
      );
    for (const body of [
      input('applied', 1),
      input('received', 0),
      input('received', -1),
      input('received', 1.5),
      input('received', '1'),
      { ...input('received', 1), occurredOn: '2026-02-30' },
      { ...input('received', 1), method: 'invalid' },
      input('forfeited', 1),
      input('forfeited', 1, '   '),
    ])
      assert.equal((await post(body)).status, 400, JSON.stringify(body));
    const entry = ok(await post(input('received', 500)), 201);
    const saved = (await ledger()).entries.find((row) => row.id === entry.id);

    assert.equal(saved.amount, 500);
    for (const method of ['PUT', 'PATCH', 'DELETE'])
      assert.equal(
        (await call(owner, method, `/contracts/${contract.id}/deposits/${entry.id}`, {})).status,
        404,
      );
    const audit = await AuditLogModel.findOne({
      where: {
        resourceType: 'deposit_entry',
        resourceId: entry.id,
        action: 'deposit.created',
        outcome: 'success',
      },
    });

    assert.ok(audit?.actorId);
    assert.equal(audit.changes.buildingId, building.id);
  });

  test('partial refund, forfeit with reason, balance blocked at 422 and audit', async () => {
    ok(await post(input('refunded', 200)), 201);
    const entry = ok(await post(input('forfeited', 100, 'Hư hỏng cửa')), 201);
    const data = await ledger();

    assert.deepEqual(data.balance, {
      received: 1500,
      applied: 0,
      refunded: 200,
      forfeited: 100,
      held: 1200,
    });
    assert.equal(data.entries.find((row) => row.id === entry.id).note, 'Hư hỏng cửa');
    assert.equal((await post(input('refunded', 1201))).status, 422);
    assert.deepEqual((await ledger()).balance, data.balance);
  });

  test('concurrent refunds serialize on contract row; only one succeeds', async () => {
    const isolated = await createContract(building);
    const results = await Promise.all([
      post(input('refunded', 700), isolated.id),
      post(input('refunded', 700), isolated.id),
    ]);

    assert.deepEqual(results.map((result) => result.status).sort(), [201, 422]);
    assert.equal((await ledger(isolated.id)).balance.held, 300);
    assert.equal(
      await DepositEntryModel.count({ where: { contractId: isolated.id, type: 'refunded' } }),
      1,
    );
  });

  test('idempotent retries return same entry; changed content is 409', async () => {
    const headers = { 'Idempotency-Key': randomUUID() };
    const body = input('received', 50);
    const a = ok(await post(body, contract.id, headers), 201);
    const b = ok(await post(body, contract.id, headers), 201);

    assert.equal(a.id, b.id);
    assert.equal((await post(input('received', 51), contract.id, headers)).status, 409);
    assert.equal(await DepositEntryModel.count({ where: { id: a.id } }), 1);
  });

  test('totals cover all filtered contracts before pagination, building and status filters', async () => {
    const all = await call(owner, 'GET', `/deposits?buildingId=${building.id}&pageSize=100`);
    const page = await call(owner, 'GET', `/deposits?buildingId=${building.id}&pageSize=1`);
    const data = ok(all);

    assert.equal(ok(page).length, 1);
    assert.equal(
      all.body.meta.totalHeld,
      data.reduce((sum, row) => sum + row.held, 0),
    );
    assert.equal(page.body.meta.totalHeld, all.body.meta.totalHeld);
    assert.deepEqual(page.body.meta.buildingTotals, [
      { buildingId: building.id, held: all.body.meta.totalHeld },
    ]);
    for (const row of data) {
      const detail = await ledger(row.contractId);

      for (const field of ['received', 'applied', 'refunded', 'forfeited', 'held'])
        assert.equal(row[field], detail.balance[field]);
      assert.ok(row.roomCode);
      assert.ok(row.primaryTenantName);
    }
    const ended = await call(owner, 'GET', `/deposits?buildingId=${building.id}&status=ended`);

    assert.deepEqual(ok(ended), []);
    assert.equal(ended.body.meta.totalHeld, 0);
  });

  test('manager reads assigned building only and cannot write deposits', async () => {
    const id = randomUUID();
    const email = `deposits-manager-${suffix.toLowerCase()}@stay.local`;
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
    const manager = await signIn(email, password);
    const all = ok(await call(manager, 'GET', '/deposits?pageSize=100'));

    assert.ok(all.length > 0);
    assert.ok(all.every((row) => row.buildingId === building.id));
    assert.equal((await call(manager, 'GET', `/contracts/${contract.id}/deposits`)).status, 200);
    assert.equal(
      (await call(manager, 'GET', `/contracts/${otherContract.id}/deposits`)).status,
      404,
    );
    assert.equal((await call(manager, 'GET', `/deposits?buildingId=${other.id}`)).status, 404);
    assert.equal(
      (await call(manager, 'POST', `/contracts/${contract.id}/deposits`, input('received', 1)))
        .status,
      403,
    );
  });

  test('ST-17 service joins settlement transaction, audits and rolls back atomically', async () => {
    const before = await ledger();
    const apply = (amount, transaction) =>
      applyDepositForSettlement(
        user,
        contract.id,
        {
          amount,
          method: 'other',
          occurredOn: '2026-11-20',
          reason: null,
          invoiceId: randomUUID(),
        },
        transaction,
      );

    await assert.rejects(
      auditedTransaction(async (transaction) => {
        await apply(100, transaction);
        throw new Error('abort settlement');
      }),
      /abort settlement/,
    );
    assert.deepEqual((await ledger()).balance, before.balance);
    const entry = await auditedTransaction((transaction) => apply(100, transaction));

    assert.equal(entry.type, 'applied');
    assert.equal((await ledger()).balance.held, before.balance.held - 100);
    assert.equal((await ledger()).balance.applied, 100);
    const audit = await AuditLogModel.findOne({
      where: { resourceId: entry.id, action: 'deposit.created' },
    });

    assert.equal(audit.actorId, user.id);
    await assert.rejects(
      auditedTransaction((transaction) => apply(before.balance.held, transaction)),
    );
  });
});
