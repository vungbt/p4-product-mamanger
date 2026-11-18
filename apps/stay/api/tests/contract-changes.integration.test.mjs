// ST-12: CI Postgres/API only. Never starts local services.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import {
  contractFactsAt,
  contractOccupantsAt,
  contractRentAt,
  contractRoomClosingsForPeriod,
  contractServicesAt,
  contractVehiclesAt,
} from '../dist/modules/contracts/contracts.resolvers.js';
import { AuditLogModel, ContractEventModel, sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 6).toUpperCase();
async function call(cookie, method, path, body, headers = {}) {
  const r = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      origin,
      ...(cookie ? { cookie } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.json() };
}
async function signIn(email = 'owner@stay.local', password = 'stay-owner-123') {
  const r = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(r.status, 200, await r.clone().text());
  return r.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
}
function ok(r, status = 200) {
  assert.equal(r.status, status, JSON.stringify(r.body));
  return r.body.data;
}

describe('ST-12 dated contract changes', { skip: !base }, () => {
  let owner, building, contract, room, tenant, second, vehicle, service;
  let n = 0;
  const newRoom = async (maxOccupants = 3) =>
    ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `D${suffix}${++n}`,
        floor: 1,
        listPrice: 3000000,
        maxOccupants,
        initialElectric: 100,
        initialWater: 10,
      }),
      201,
    );
  const newContract = async (roomId) => {
    const draft = ok(
      await call(owner, 'POST', '/contracts', {
        roomId,
        startDate: '2020-01-01',
        endDate: '2098-12-31',
        rent: 3000000,
        initialElectric: 100,
        initialWater: 10,
        occupantIds: [tenant.id],
        primaryTenantId: tenant.id,
      }),
      201,
    );
    return ok(await call(owner, 'POST', `/contracts/${draft.id}/activate`));
  };
  const change = (kind, body = {}, headers = {}) =>
    call(
      owner,
      'POST',
      `/contracts/${contract.id}/${kind}`,
      { version: contract.version, effectiveDate: '2026-02-10', ...body },
      headers,
    );
  const apply = async (kind, body = {}, headers = {}) => {
    const result = ok(await change(kind, body, headers));
    contract = result.contract;
    return result;
  };
  before(async () => {
    owner = await signIn();
    building = ok(await call(owner, 'GET', '/buildings')).find((b) => b.code === 'A');
    tenant = ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: building.id,
        fullName: `ST12 ${suffix}`,
        phone: '0901234567',
      }),
      201,
    );
    room = await newRoom();
    contract = await newContract(room.id);
    // Older ST-10 seeds have activation events without a snapshot.
    await ContractEventModel.update(
      { payload: {} },
      { where: { contractId: contract.id, type: 'activated' } },
    );
    service = ok(await call(owner, 'GET', '/services')).find((s) => s.active);
    vehicle = ok(
      await call(owner, 'POST', `/tenants/${tenant.id}/vehicles`, {
        plate: `12A${suffix}`,
        type: 'motorbike',
      }),
      201,
    );
  });
  after(() => sequelize.close());

  test('all routes require authentication; draft and out-of-range changes are rejected', async () => {
    for (const path of [
      'renew',
      'rent-change',
      'occupants',
      `occupants/${tenant.id}/leave`,
      'vehicles',
      'services',
      'room-change',
    ])
      assert.equal(
        (await call(undefined, 'POST', `/contracts/${contract.id}/${path}`, {})).status,
        401,
      );
    assert.equal(
      (await change('rent-change', { effectiveDate: '2019-01-01', rent: 1 })).status,
      422,
    );
    assert.equal(
      (await change('rent-change', { effectiveDate: '2099-01-01', rent: 1 })).status,
      422,
    );
    const staleInputs = {
      renew: { endDate: '2099-12-31' },
      'rent-change': { rent: 1 },
      occupants: { fullName: 'Stale', phone: '0901234567' },
      [`occupants/${tenant.id}/leave`]: {},
      vehicles: { vehicleId: vehicle.id, enabled: true },
      services: { serviceId: service.id, enabled: true },
      'room-change': {
        roomId: room.id,
        rent: 1,
        closingElectric: 100,
        closingWater: 10,
        initialElectric: 0,
        initialWater: 0,
      },
    };
    for (const [kind, input] of Object.entries(staleInputs))
      assert.equal(
        (await change(kind, { ...input, version: contract.version + 1 })).status,
        409,
        kind,
      );
    const d = ok(
      await call(owner, 'POST', '/contracts', {
        roomId: room.id,
        startDate: '2020-01-01',
        rent: 1,
      }),
      201,
    );
    assert.equal(
      (
        await call(owner, 'POST', `/contracts/${d.id}/rent-change`, {
          version: d.version,
          effectiveDate: '2026-01-01',
          rent: 2,
        })
      ).status,
      409,
    );
  });
  test('preview validates without writing, rent uses issue-date resolution and stale version is 409', async () => {
    const before = await ContractEventModel.count({ where: { contractId: contract.id } });
    const p = ok(await change('rent-change', { rent: 4000000, preview: true }));
    assert.equal(p.contract, null);
    assert.equal(p.impact.firstIssuePeriod, '2026-03');
    assert.equal(await ContractEventModel.count({ where: { contractId: contract.id } }), before);
    const version = contract.version;
    const key = randomUUID();
    const input = { rent: 4000000, version };
    await apply('rent-change', input, { 'Idempotency-Key': key });
    const replay = ok(await change('rent-change', input, { 'Idempotency-Key': key }));
    assert.equal(replay.contract.version, contract.version);
    assert.equal((await change('rent-change', { rent: 5, version })).status, 409);
    assert.equal(await contractRentAt(contract.id, '2026-02-09'), 3000000);
    assert.equal(await contractRentAt(contract.id, '2026-02-10'), 4000000);
    assert.equal(await contractRentAt(contract.id, '2026-03-01'), 4000000);
  });
  test('renew extends the end date and records optional rent', async () => {
    await apply('renew', { endDate: '2099-12-31', rent: 4100000, effectiveDate: '2026-02-11' });
    assert.equal(contract.endDate, '2099-12-31');
    assert.equal(await contractRentAt(contract.id, '2026-02-10'), 4000000);
    assert.equal(await contractRentAt(contract.id, '2026-02-11'), 4100000);
  });
  test('add inline occupant, enforce capacity, transfer primary and reject last departure', async () => {
    assert.equal((await change(`occupants/${tenant.id}/leave`)).status, 422);
    await apply('occupants', { fullName: 'Inline Private Name', phone: '0987654321' });
    second = contract.occupants.find((o) => o.fullName === 'Inline Private Name');
    assert.equal((await contractOccupantsAt(contract.id, '2026-02-09')).length, 1);
    assert.equal((await contractOccupantsAt(contract.id, '2026-02-10')).length, 2);
    const third = ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: building.id,
        fullName: 'Third occupant',
        phone: '0909876543',
      }),
      201,
    );
    await apply('occupants', { tenantId: third.id });
    assert.equal(
      (await change('occupants', { fullName: 'Overflow', phone: '0901111111', preview: true }))
        .status,
      422,
    );
    assert.equal(
      (await change(`occupants/${tenant.id}/leave`, { effectiveDate: '2026-02-12' })).status,
      422,
    );
    await apply(`occupants/${tenant.id}/leave`, {
      effectiveDate: '2026-02-12',
      newPrimaryTenantId: second.tenantId,
    });
    const oldPrimary = (await contractOccupantsAt(contract.id, '2026-02-11')).find(
      (o) => o.isPrimary,
    );
    const newPrimary = (await contractOccupantsAt(contract.id, '2026-02-12')).find(
      (o) => o.isPrimary,
    );
    assert.equal(oldPrimary.tenantId, tenant.id);
    assert.equal(newPrimary.tenantId, second.tenantId);
    await apply(`occupants/${third.id}/leave`, { effectiveDate: '2026-02-13' });
    assert.equal(
      (await change(`occupants/${second.tenantId}/leave`, { effectiveDate: '2026-02-14' })).status,
      422,
    );
  });
  test('vehicle add/remove and service on/off retain date boundaries', async () => {
    // Backdated before the owner's departure above.
    await apply('vehicles', { vehicleId: vehicle.id, enabled: true });
    assert.equal((await contractVehiclesAt(contract.id, '2026-02-09')).length, 0);
    assert.equal((await contractVehiclesAt(contract.id, '2026-02-10')).length, 1);
    await apply('vehicles', { vehicleId: vehicle.id, enabled: false, effectiveDate: '2026-02-11' });
    assert.equal((await contractVehiclesAt(contract.id, '2026-02-11')).length, 0);
    await apply('services', { serviceId: service.id, enabled: true });
    assert.equal((await contractServicesAt(contract.id, '2026-02-09')).length, 0);
    assert.equal((await contractServicesAt(contract.id, '2026-02-10')).length, 1);
    await apply('services', { serviceId: service.id, enabled: false, effectiveDate: '2026-02-15' });
    assert.equal((await contractServicesAt(contract.id, '2026-02-15')).length, 0);
  });
  test('inactive service definitions cannot be enabled', async () => {
    const inactive = ok(
      await call(owner, 'POST', '/services', {
        name: `Inactive ${suffix}`,
        kind: 'per_room',
        unit: 'phòng',
        defaultPrice: 1,
        active: false,
      }),
      201,
    );
    assert.equal((await change('services', { serviceId: inactive.id, enabled: true })).status, 422);
  });
  test('room conflicts, maintenance and lower closing readings; move updates map, tenant and separate utility segment', async () => {
    const target = await newRoom();
    const occupied = await newRoom();
    await newContract(occupied.id);
    const move = {
      roomId: occupied.id,
      effectiveDate: '2026-03-01',
      rent: 4500000,
      closingElectric: 150,
      closingWater: 20,
      initialElectric: 100,
      initialWater: 10,
    };
    assert.equal((await change('room-change', move)).status, 409);
    const on = ok(
      await call(owner, 'POST', `/rooms/${target.id}/maintenance`, {
        version: target.version,
        maintenance: true,
        reason: 'Repair',
      }),
    );
    assert.equal((await change('room-change', { ...move, roomId: target.id })).status, 409);
    ok(
      await call(owner, 'POST', `/rooms/${target.id}/maintenance`, {
        version: on.version,
        maintenance: false,
      }),
    );
    assert.equal(
      (await change('room-change', { ...move, roomId: target.id, closingElectric: 99 })).status,
      422,
    );
    await apply('room-change', { ...move, roomId: target.id });
    assert.equal((await contractFactsAt(contract.id, '2026-02-28')).roomId, room.id);
    assert.equal((await contractFactsAt(contract.id, '2026-03-01')).roomId, target.id);
    assert.equal(await contractRentAt(contract.id, '2026-03-01'), 4500000);
    assert.equal(ok(await call(owner, 'GET', `/rooms/${room.id}`)).status, 'vacant');
    assert.equal(ok(await call(owner, 'GET', `/rooms/${target.id}`)).status, 'occupied');
    assert.equal(
      ok(await call(owner, 'GET', `/tenants/${second.tenantId}`)).currentRoom.id,
      target.id,
    );
    const closings = await contractRoomClosingsForPeriod(contract.id, '2026-04');
    assert.equal(closings.length, 1);
    assert.equal(closings[0].closingElectric, 150);
    assert.equal(closings[0].oldRoomId, room.id);
  });
  test('scheduled room moves preserve today occupancy and reserve destination against other writes', async () => {
    const currentRoom = contract.roomId;
    const destination = await newRoom();
    await apply('room-change', {
      roomId: destination.id,
      effectiveDate: '2090-01-01',
      rent: 5000000,
      closingElectric: 200,
      closingWater: 30,
      initialElectric: 100,
      initialWater: 10,
    });
    assert.equal(contract.roomId, currentRoom);
    assert.equal(ok(await call(owner, 'GET', `/rooms/${currentRoom}`)).status, 'occupied');
    assert.equal(ok(await call(owner, 'GET', `/rooms/${destination.id}`)).status, 'vacant');
    assert.equal((await contractFactsAt(contract.id, '2090-01-01')).roomId, destination.id);
    assert.equal(
      (
        await call(owner, 'POST', `/rooms/${destination.id}/maintenance`, {
          version: destination.version,
          maintenance: true,
          reason: 'Blocked future reservation',
        })
      ).status,
      409,
    );
    const draft = ok(
      await call(owner, 'POST', '/contracts', {
        roomId: currentRoom,
        startDate: '2020-01-01',
        rent: 1,
        initialElectric: 100,
        initialWater: 10,
        occupantIds: [tenant.id],
        primaryTenantId: tenant.id,
      }),
      201,
    );
    assert.equal((await call(owner, 'POST', `/contracts/${draft.id}/activate`)).status, 409);
  });
  test('history contains actor/time and audit omits personal data', async () => {
    assert.ok(contract.events.every((e) => e.actorName && e.actorId && e.createdAt));
    for (const kind of [
      'renew',
      'rent-change',
      'occupants',
      'leave',
      'vehicles',
      'services',
      'room-change',
    ])
      assert.ok(
        contract.events.some((e) => e.type === kind),
        kind,
      );
    const audits = await AuditLogModel.findAll({
      where: { resourceType: 'contract', resourceId: contract.id },
    });
    assert.ok(audits.length);
    for (const log of audits)
      for (const privateValue of ['Inline Private Name', '0987654321', vehicle.plate])
        assert.equal(JSON.stringify(log.changes).includes(privateValue), false);
  });
  test('manager scoped to another building receives 404 for changes and previews', async () => {
    const id = randomUUID(),
      email = `change-manager-${suffix.toLowerCase()}@stay.local`,
      password = 'manager-password-123';
    const other = ok(
      await call(owner, 'POST', '/buildings', {
        code: `Z${suffix.slice(0, 5)}`,
        name: 'Scope test',
      }),
      201,
    );
    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'Manager',true,'manager','active');
      INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash);
      INSERT INTO building_members(id,building_id,user_id) VALUES(:memberId,:buildingId,:id);`,
      {
        replacements: {
          id,
          email,
          hash: await bcrypt.hash(password, 10),
          accountId: randomUUID(),
          memberId: randomUUID(),
          buildingId: other.id,
        },
      },
    );
    const manager = await signIn(email, password);
    for (const preview of [true, false])
      assert.equal(
        (
          await call(manager, 'POST', `/contracts/${contract.id}/rent-change`, {
            version: contract.version,
            effectiveDate: '2026-04-01',
            rent: 1,
            preview,
          })
        ).status,
        404,
      );
    ok(await call(owner, 'POST', `/buildings/${other.id}/archive`));
  });
});
