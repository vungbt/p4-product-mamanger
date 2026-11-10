// CI uses the real API and migrated database. This suite never starts infrastructure.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { BuildingModel, MeterReadingModel, sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 5).toUpperCase();

async function login(email, password) {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  return response.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
}

async function call(cookie, method, path, body, headers = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: { origin, cookie: cookie ?? '', 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body.data;
}

describe('Stay meter closing', { skip: !base }, () => {
  let owner, manager, tenantCookie, building, outside, room, meters;
  const managerId = randomUUID();
  const tenantId = randomUUID();
  const period = '2042-04';
  const input = (meter, overrides = {}) => ({
    meterId: meter.id,
    period,
    reading: 150,
    readOn: `${period}-30`,
    version: 0,
    ...overrides,
  });
  const bulk = (rows) => call(owner, 'PUT', `/buildings/${building.id}/readings`, { rows });

  before(async () => {
    owner = await login('owner@stay.local', 'stay-owner-123');
    building = ok(
      await call(owner, 'POST', '/buildings', { code: `R${suffix}`, name: `Readings ${suffix}` }),
      201,
    );
    outside = await BuildingModel.create({ code: `Z${suffix}`, name: 'Outside manager scope' });
    room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: '101',
        floor: 1,
        listPrice: 3000000,
        maxOccupants: 2,
        initialElectric: 100,
        initialWater: 100,
      }),
      201,
    );
    const tenant = ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: building.id,
        fullName: 'Reading test',
        phone: '0901234567',
      }),
      201,
    );
    const contract = ok(
      await call(owner, 'POST', '/contracts', {
        roomId: room.id,
        startDate: '2042-01-01',
        endDate: '2043-01-01',
        rent: 3000000,
        depositAmount: 0,
        depositCollected: false,
        depositMethod: 'cash',
        initialElectric: 100,
        initialWater: 100,
        occupantIds: [tenant.id],
        primaryTenantId: tenant.id,
        serviceIds: [],
        vehicleIds: [],
      }),
      201,
    );
    ok(await call(owner, 'POST', `/contracts/${contract.id}/activate`));
    meters = ok(await call(owner, 'GET', `/rooms/${room.id}`)).meters;
    for (const [id, role] of [
      [managerId, 'manager'],
      [tenantId, 'tenant'],
    ]) {
      await sequelize.query(
        `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST13',true,:role,'active');
        INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
        {
          replacements: {
            id,
            role,
            email: `${role}-${suffix}@stay.local`,
            accountId: randomUUID(),
            hash: await bcrypt.hash('readings-password-123', 10),
          },
        },
      );
    }
    await sequelize.query(
      'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
      { replacements: { id: randomUUID(), buildingId: building.id, userId: managerId } },
    );
    manager = await login(`manager-${suffix}@stay.local`, 'readings-password-123');
    tenantCookie = await login(`tenant-${suffix}@stay.local`, 'readings-password-123');
  });
  after(async () => {
    await sequelize.close();
  });

  test('manager can read assigned building, gets 404 outside scope and tenant writes get 403', async () => {
    assert.equal(
      (await call(undefined, 'GET', `/buildings/${building.id}/readings?period=${period}`)).status,
      401,
    );
    const grid = ok(
      await call(manager, 'GET', `/buildings/${building.id}/readings?period=${period}`),
    );
    assert.equal(grid.rooms[0].meters[0].previous, 100);
    assert.equal(
      (await call(manager, 'GET', `/buildings/${outside.id}/readings?period=${period}`)).status,
      404,
    );
    assert.equal(
      (
        await call(manager, 'PUT', `/buildings/${outside.id}/readings`, {
          rows: [input(meters[0])],
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await call(tenantCookie, 'PUT', `/buildings/${building.id}/readings`, {
          rows: [input(meters[0])],
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await call(tenantCookie, 'POST', `/meters/${meters[0].id}/replace`, {
          finalReading: 100,
          initialReading: 0,
          replacedOn: `${period}-15`,
        })
      ).status,
      403,
    );
  });

  test('bulk preserves valid rows, rejects lower and fractional readings per row, guards stale versions', async () => {
    const result = ok(await bulk([input(meters[0]), input(meters[1], { reading: 90 })]));
    assert.equal(result.results[0].data.reading, 150);
    assert.equal(result.results[1].error.code, 'input_valid_error');
    const row = result.results[0].data;
    const lower = await call(
      owner,
      'PUT',
      `/readings/${row.id}`,
      input(meters[0], { reading: 90, version: row.version }),
    );
    assert.equal(lower.status, 400);
    assert.ok(lower.body.extensions.reading.length);
    assert.equal(ok(await bulk([input(meters[0])])).results[0].error.code, 'version_conflict');
    const stale = await call(
      owner,
      'PUT',
      `/readings/${row.id}`,
      input(meters[0], { reading: 160, version: 0 }),
    );
    assert.equal(stale.status, 409);
    assert.equal(stale.body.code, 'version_conflict');
    assert.equal(
      ok(await bulk([input(meters[1], { reading: 1.5 })])).results[0].error.code,
      'input_valid_error',
    );
    assert.equal(
      ok(await bulk([input(meters[1], { reading: -1 })])).results[0].error.code,
      'input_valid_error',
    );
    assert.equal(
      ok(await bulk([input(meters[1], { photoFileId: randomUUID() })])).results[0].error.code,
      'input_valid_error',
    );
    assert.equal(
      (
        await call(
          manager,
          'PUT',
          `/readings/${row.id}`,
          input(meters[0], { reading: 160, version: row.version }),
        )
      ).status,
      200,
    );
  });

  test('3-period average requires explicit high-consumption confirmation, locked records cannot change', async () => {
    const meter = meters[1];
    for (const [period, reading] of [
      ['2042-01', 110],
      ['2042-02', 120],
      ['2042-03', 130],
    ]) {
      const result = ok(await bulk([input(meter, { period, reading, readOn: `${period}-28` })]));
      assert.equal(result.results[0].error, null);
    }
    const grid = ok(
      await call(owner, 'GET', `/buildings/${building.id}/readings?period=${period}`),
    );
    assert.equal(grid.rooms[0].meters.find((m) => m.meterId === meter.id).average, 10);
    const warning = ok(await bulk([input(meter, { reading: 200 })])).results[0];
    assert.equal(warning.error.code, 'high_consumption_confirmation_required');
    const saved = ok(await bulk([input(meter, { reading: 200, confirmHighConsumption: true })]))
      .results[0].data;
    assert.ok(saved);
    await MeterReadingModel.update({ status: 'locked' }, { where: { id: saved.id } });
    assert.equal(
      (
        await call(
          owner,
          'PUT',
          `/readings/${saved.id}`,
          input(meter, { version: saved.version, reading: 210, confirmHighConsumption: true }),
        )
      ).status,
      409,
    );
    assert.equal(
      ok(await bulk([input(meter, { version: saved.version, reading: 210 })])).results[0].error
        .code,
      'reading_locked',
    );
    const lockedGrid = ok(
      await call(owner, 'GET', `/buildings/${building.id}/readings?period=${period}`),
    );
    assert.equal(
      lockedGrid.rooms[0].meters.find((m) => m.meterId === meter.id).current.status,
      'locked',
    );
    assert.equal(
      (
        await call(owner, 'POST', `/meters/${meter.id}/replace`, {
          finalReading: 210,
          initialReading: 0,
          replacedOn: '2042-04-30',
        })
      ).status,
      409,
    );
  });

  test('replacement mid-period adds old and new segments, retries return the same new meter', async () => {
    const meter = meters[0];
    const headers = { 'Idempotency-Key': randomUUID() };
    const body = { finalReading: 190, initialReading: 5, replacedOn: '2042-05-15', serial: 'NEW' };
    const replacement = ok(await call(owner, 'POST', `/meters/${meter.id}/replace`, body, headers));
    assert.deepEqual(
      ok(await call(owner, 'POST', `/meters/${meter.id}/replace`, body, headers)),
      replacement,
    );
    const saved = ok(
      await bulk([
        input({ id: replacement.id }, { period: '2042-05', readOn: '2042-05-31', reading: 15 }),
      ]),
    ).results[0];
    assert.equal(saved.error, null);
    const grid = ok(await call(owner, 'GET', `/buildings/${building.id}/readings?period=2042-05`));
    const electricity = grid.rooms[0].meters.find((m) => m.meterId === replacement.id);
    assert.equal(electricity.carriedConsumption, 30); // 190 - April's updated 160
    assert.equal(electricity.consumption, 40); // 30 + (15 - 5)
    assert.equal((await call(owner, 'POST', `/meters/${meter.id}/replace`, body)).status, 409);
  });
});
