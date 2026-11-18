// ST-08 rooms against the live API and seeded database (scripts/test-stay-api-integration.sh).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import {
  AuditLogModel,
  BuildingModel,
  MeterModel,
  RoomModel,
  sequelize,
} from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const owner = { email: 'owner@stay.local', password: 'stay-owner-123' };
const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();

async function signIn(credentials) {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(credentials),
  });

  assert.equal(response.status, 200, await response.clone().text());
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}

/** `{ status, body }` of one JSON request; `cookie` undefined = signed out. */
async function call(cookie, method, path, body, headers = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      origin,
      'accept-language': 'vi',
      ...(cookie ? { cookie } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();

  return { status: response.status, body: text ? JSON.parse(text) : null };
}

function assertFieldErrors(result, fields) {
  assert.equal(result.status, 400, JSON.stringify(result.body));
  assert.equal(result.body.code, 'input_valid_error');
  for (const field of fields)
    assert.ok(result.body.extensions?.[field]?.[0], `${field}: ${JSON.stringify(result.body)}`);
}

async function auditCount(where) {
  return AuditLogModel.count({ where: { outcome: 'success', ...where } });
}

/** A manager account assigned to `buildingId`, created directly in the database. */
async function createManager(buildingId) {
  const id = randomUUID();
  const email = `rooms-manager-${suffix.toLowerCase()}@stay.local`;
  const password = 'manager-password-123';

  await sequelize.query(
    `INSERT INTO users (id, email, display_name, email_verified, role, account_status)
     VALUES (:id, :email, 'Quản lý', true, 'manager', 'active');
     INSERT INTO auth_accounts (id, account_id, provider_id, user_id, password)
     VALUES (:accountId, :id, 'credential', :id, :hash);
     INSERT INTO building_members (id, building_id, user_id) VALUES (:memberId, :buildingId, :id);`,
    {
      replacements: {
        id,
        email,
        accountId: randomUUID(),
        memberId: randomUUID(),
        buildingId,
        hash: await bcrypt.hash(password, 10),
      },
    },
  );
  return { email, password };
}

describe('Stay API: rooms and the room map', { skip: !base }, () => {
  let cookie;
  let buildingA;
  let building;
  let services;
  let room;

  const roomsPath = () => `/api/buildings/${building.id}/rooms`;
  const roomBody = (overrides = {}) => ({
    code: 'a01',
    floor: 1,
    areaM2: 18.5,
    listPrice: 3_000_000,
    maxOccupants: 2,
    note: 'Cửa sổ hướng đông',
    serviceIds: [services.internet.id, services.garbage.id],
    initialElectric: 1250,
    initialWater: 87,
    electricSerial: 'E-001',
    ...overrides,
  });
  const bulkBody = (overrides = {}) => ({
    floorFrom: 1,
    floorTo: 2,
    roomsPerFloor: 3,
    template: '{floor}{number}',
    listPrice: 2_800_000,
    maxOccupants: 2,
    serviceIds: [services.internet.id],
    prices: [{ code: '203', listPrice: 3_100_000 }],
    ...overrides,
  });

  before(async () => {
    cookie = await signIn(owner);
    buildingA = await BuildingModel.findOne({ where: { code: 'A' } });

    const list = await call(cookie, 'GET', '/api/services');

    services = Object.fromEntries(list.body.data.map((item) => [item.code, item]));

    const created = await call(cookie, 'POST', '/api/buildings', {
      code: `R${suffix}`,
      name: `Toà phòng ${suffix}`,
    });

    assert.equal(created.status, 201, JSON.stringify(created.body));
    building = created.body.data;
  });
  after(() => sequelize.close());

  test('every endpoint requires a session', async () => {
    const id = randomUUID();
    const routes = [
      ['GET', `/api/buildings/${id}/rooms`],
      ['GET', `/api/buildings/${id}/rooms/summary`],
      ['POST', `/api/buildings/${id}/rooms`],
      ['POST', `/api/buildings/${id}/rooms/bulk/preview`],
      ['POST', `/api/buildings/${id}/rooms/bulk`],
      ['GET', `/api/rooms/${id}`],
      ['PUT', `/api/rooms/${id}`],
      ['POST', `/api/rooms/${id}/maintenance`],
      ['POST', `/api/rooms/${id}/archive`],
    ];

    for (const [method, path] of routes) {
      const result = await call(undefined, method, path, method === 'GET' ? undefined : {});

      assert.equal(result.status, 401, `${method} ${path}`);
    }
  });

  test('the seed gives building A 12 rooms on 3 floors, each with two meters', async () => {
    const summary = await call(cookie, 'GET', `/api/buildings/${buildingA.id}/rooms/summary`);

    assert.equal(summary.status, 200, JSON.stringify(summary.body));
    assert.ok(summary.body.data.total >= 12);
    assert.deepEqual(summary.body.data.floors.slice(0, 3), [1, 2, 3]);

    const page = await call(cookie, 'GET', `/api/buildings/${buildingA.id}/rooms?pageSize=100`);
    const codes = page.body.data.map((item) => item.code);

    for (const code of ['101', '104', '201', '304']) assert.ok(codes.includes(code), code);

    const seeded = await RoomModel.findOne({ where: { buildingId: buildingA.id, code: '101' } });

    assert.equal(await MeterModel.count({ where: { roomId: seeded.id } }), 2);
  });

  test('create: field errors for every invalid field at once', async () => {
    const result = await call(
      cookie,
      'POST',
      roomsPath(),
      roomBody({
        code: 'Phòng 1',
        floor: 120,
        areaM2: 18.555,
        listPrice: -1,
        maxOccupants: 0,
        serviceIds: [randomUUID()],
        initialElectric: 1.5,
        initialWater: -3,
      }),
    );

    assertFieldErrors(result, [
      'code',
      'floor',
      'areaM2',
      'listPrice',
      'maxOccupants',
      'serviceIds',
      'initialElectric',
      'initialWater',
    ]);
  });

  test('create: a room with default services and its electricity and water meters', async () => {
    const created = await call(cookie, 'POST', roomsPath(), roomBody());

    assert.equal(created.status, 201, JSON.stringify(created.body));
    room = created.body.data;
    assert.equal(room.code, 'A01');
    assert.equal(room.status, 'vacant');
    assert.equal(room.areaM2, 18.5);
    assert.equal(room.contract, null);
    assert.equal(room.occupantCount, 0);
    assert.equal(room.debt, 0);
    assert.deepEqual(room.occupants, []);
    assert.deepEqual(room.invoices, []);
    assert.equal(room.buildingCode, building.code);
    assert.deepEqual(room.defaultServices.map((item) => item.code).sort(), ['garbage', 'internet']);
    assert.deepEqual(
      room.meters.map(({ kind, initialReading, serial, latestReading }) => ({
        kind,
        initialReading,
        serial,
        latestReading,
      })),
      [
        { kind: 'electricity', initialReading: 1250, serial: 'E-001', latestReading: null },
        { kind: 'water', initialReading: 87, serial: null, latestReading: null },
      ],
    );
    assert.equal(
      await auditCount({ action: 'room.create', resourceType: 'room', resourceId: room.id }),
      1,
    );

    // Codes are unique per building, whatever their case.
    const duplicate = await call(cookie, 'POST', roomsPath(), roomBody({ code: ' A01 ' }));

    assertFieldErrors(duplicate, ['code']);

    // The same code is fine in another building.
    const other = await call(
      cookie,
      'POST',
      `/api/buildings/${buildingA.id}/rooms`,
      roomBody({ code: `A01${suffix.slice(0, 2)}`, serviceIds: [] }),
    );

    assert.equal(other.status, 201, JSON.stringify(other.body));

    const stats = await call(cookie, 'GET', `/api/buildings/${building.id}`);

    assert.equal(stats.body.data.stats.roomCount, 1);
  });

  test('detail and unknown rooms', async () => {
    const detail = await call(cookie, 'GET', `/api/rooms/${room.id}`);

    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.note, 'Cửa sổ hướng đông');
    assert.equal((await call(cookie, 'GET', `/api/rooms/${randomUUID()}`)).status, 404);
    assert.equal((await call(cookie, 'GET', '/api/rooms/not-a-uuid')).status, 400);
    assert.equal((await call(cookie, 'GET', `/api/buildings/${randomUUID()}/rooms`)).status, 404);
  });

  test('update with optimistic locking; a change of default services bumps the version', async () => {
    const body = roomBody({
      code: 'A02',
      listPrice: 3_200_000,
      areaM2: null,
      version: room.version,
    });
    const updated = await call(cookie, 'PUT', `/api/rooms/${room.id}`, body);

    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.data.code, 'A02');
    assert.equal(updated.body.data.areaM2, null);
    assert.equal(updated.body.data.version, room.version + 1);
    // Meters are not edited here (replacing a meter is ST-13).
    assert.equal(updated.body.data.meters[0].initialReading, 1250);

    const servicesOnly = await call(cookie, 'PUT', `/api/rooms/${room.id}`, {
      ...body,
      serviceIds: [],
      version: updated.body.data.version,
    });

    assert.equal(servicesOnly.status, 200, JSON.stringify(servicesOnly.body));
    assert.deepEqual(servicesOnly.body.data.defaultServiceIds, []);
    assert.equal(servicesOnly.body.data.version, updated.body.data.version + 1);

    const stale = await call(cookie, 'PUT', `/api/rooms/${room.id}`, body);

    assert.equal(stale.status, 409);
    assert.equal(stale.body.code, 'version_conflict');
    assert.equal(
      await auditCount({ action: 'room.update', resourceType: 'room', resourceId: room.id }),
      2,
    );
    room = servicesOnly.body.data;
  });

  test('maintenance: reason required, date not in the past, version checked, audited', async () => {
    const path = `/api/rooms/${room.id}/maintenance`;

    assertFieldErrors(
      await call(cookie, 'POST', path, {
        maintenance: true,
        until: '2000-01-01',
        version: room.version,
      }),
      ['reason', 'until'],
    );

    const on = await call(cookie, 'POST', path, {
      maintenance: true,
      reason: 'Sơn lại tường',
      until: '2099-12-31',
      version: room.version,
    });

    assert.equal(on.status, 200, JSON.stringify(on.body));
    assert.equal(on.body.data.status, 'maintenance');
    assert.equal(on.body.data.maintenanceReason, 'Sơn lại tường');
    assert.equal(on.body.data.maintenanceUntil, '2099-12-31');

    const filtered = await call(cookie, 'GET', `${roomsPath()}?status=maintenance`);

    assert.deepEqual(
      filtered.body.data.map((item) => item.id),
      [room.id],
    );

    const summary = await call(cookie, 'GET', `${roomsPath()}/summary`);

    assert.deepEqual(summary.body.data.counts, {
      vacant: 0,
      reserved: 0,
      occupied: 0,
      maintenance: 1,
    });

    const stale = await call(cookie, 'POST', path, { maintenance: false, version: room.version });

    assert.equal(stale.status, 409);
    assert.equal(stale.body.code, 'version_conflict');

    const off = await call(cookie, 'POST', path, {
      maintenance: false,
      version: on.body.data.version,
    });

    assert.equal(off.status, 200, JSON.stringify(off.body));
    assert.equal(off.body.data.status, 'vacant');
    assert.equal(off.body.data.maintenanceReason, null);
    assert.equal(
      await auditCount({
        action: 'room.maintenance_on',
        resourceType: 'room',
        resourceId: room.id,
      }),
      1,
    );
    assert.equal(
      await auditCount({
        action: 'room.maintenance_off',
        resourceType: 'room',
        resourceId: room.id,
      }),
      1,
    );
    room = off.body.data;
  });

  test('bulk preview marks existing codes and validates the template', async () => {
    await call(cookie, 'POST', roomsPath(), roomBody({ code: '102', floor: 1, serviceIds: [] }));

    const preview = await call(cookie, 'POST', `${roomsPath()}/bulk/preview`, bulkBody());

    assert.equal(preview.status, 200, JSON.stringify(preview.body));
    assert.deepEqual(
      preview.body.data.items.map((item) => `${item.code}:${item.floor}:${item.exists}`),
      ['101:1:false', '102:1:true', '103:1:false', '201:2:false', '202:2:false', '203:2:false'],
    );
    assert.equal(preview.body.data.createCount, 5);
    assert.equal(preview.body.data.skipCount, 1);

    assertFieldErrors(
      await call(
        cookie,
        'POST',
        `${roomsPath()}/bulk/preview`,
        bulkBody({ template: 'P{number}' }),
      ),
      ['template'],
    );
    assertFieldErrors(
      await call(cookie, 'POST', `${roomsPath()}/bulk/preview`, bulkBody({ floorFrom: 3 })),
      ['floorTo'],
    );
    assertFieldErrors(
      await call(
        cookie,
        'POST',
        `${roomsPath()}/bulk/preview`,
        bulkBody({ floorFrom: 0, floorTo: 9, roomsPerFloor: 50 }),
      ),
      ['roomsPerFloor'],
    );
  });

  test('bulk create skips existing codes and replays idempotently', async () => {
    const path = `${roomsPath()}/bulk`;
    const key = `rooms-${randomUUID()}`;

    const missingKey = await call(cookie, 'POST', path, bulkBody());

    assert.equal(missingKey.status, 400, JSON.stringify(missingKey.body));
    assertFieldErrors(
      await call(cookie, 'POST', path, bulkBody({ prices: [{ code: '999', listPrice: 1 }] }), {
        'Idempotency-Key': key,
      }),
      ['prices'],
    );

    const before = await RoomModel.count({ where: { buildingId: building.id } });
    const created = await call(cookie, 'POST', path, bulkBody(), { 'Idempotency-Key': key });

    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.deepEqual(
      created.body.data.created.map((item) => `${item.code}:${item.floor}:${item.listPrice}`),
      ['101:1:2800000', '103:1:2800000', '201:2:2800000', '202:2:2800000', '203:2:3100000'],
    );
    assert.deepEqual(created.body.data.skipped, [{ code: '102', floor: 1, reason: 'exists' }]);
    assert.deepEqual(created.body.data.created[0].defaultServiceIds, [services.internet.id]);
    assert.equal(await RoomModel.count({ where: { buildingId: building.id } }), before + 5);

    const createdId = created.body.data.created[0].id;

    assert.equal(await MeterModel.count({ where: { roomId: createdId } }), 2);

    // Same key and payload: the first result again, nothing created, no second audit row.
    const replay = await call(cookie, 'POST', path, bulkBody(), { 'Idempotency-Key': key });

    assert.equal(replay.status, 201, JSON.stringify(replay.body));
    assert.deepEqual(
      replay.body.data.created.map((item) => item.id),
      created.body.data.created.map((item) => item.id),
    );
    assert.deepEqual(replay.body.data.skipped, created.body.data.skipped);
    assert.equal(await RoomModel.count({ where: { buildingId: building.id } }), before + 5);
    assert.equal(
      await auditCount({
        action: 'room.bulk_create',
        resourceType: 'room',
        resourceId: building.id,
      }),
      1,
    );

    // Same key, other payload: refused.
    const conflict = await call(cookie, 'POST', path, bulkBody({ listPrice: 1 }), {
      'Idempotency-Key': key,
    });

    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.code, 'idempotency_conflict');

    // A new key now skips every code.
    const again = await call(cookie, 'POST', path, bulkBody(), {
      'Idempotency-Key': `rooms-${randomUUID()}`,
    });

    assert.equal(again.status, 201);
    assert.equal(again.body.data.created.length, 0);
    assert.equal(again.body.data.skipped.length, 6);
  });

  test('list: floor, status and code filters, pagination, floor then code order', async () => {
    const all = await call(cookie, 'GET', `${roomsPath()}?pageSize=100`);

    assert.equal(all.status, 200);
    assert.deepEqual(
      all.body.data.map((item) => item.code),
      // Floor first, then code (digits sort before letters).
      ['101', '102', '103', 'A02', '201', '202', '203'],
    );

    const floor2 = await call(cookie, 'GET', `${roomsPath()}?floor=2`);

    assert.deepEqual(
      floor2.body.data.map((item) => item.code),
      ['201', '202', '203'],
    );

    const search = await call(cookie, 'GET', `${roomsPath()}?q=a0`);

    assert.deepEqual(
      search.body.data.map((item) => item.code),
      ['A02'],
    );

    const reserved = await call(cookie, 'GET', `${roomsPath()}?status=reserved`);

    assert.equal(reserved.status, 200);
    assert.equal(reserved.body.meta.total, 0);

    const paged = await call(cookie, 'GET', `${roomsPath()}?pageSize=2&page=2`);

    assert.equal(paged.body.data.length, 2);
    assert.equal(paged.body.meta.total, 7);

    assertFieldErrors(await call(cookie, 'GET', `${roomsPath()}?status=busy&floor=x`), [
      'status',
      'floor',
    ]);
  });

  test('managers read rooms of their buildings only; writes stay with the owner', async () => {
    const manager = await signIn(await createManager(building.id));

    assert.equal((await call(manager, 'GET', roomsPath())).status, 200);
    assert.equal((await call(manager, 'GET', `${roomsPath()}/summary`)).status, 200);
    assert.equal((await call(manager, 'GET', `/api/rooms/${room.id}`)).status, 200);

    const hiddenList = await call(manager, 'GET', `/api/buildings/${buildingA.id}/rooms`);

    assert.equal(hiddenList.status, 404);

    const seeded = await RoomModel.findOne({ where: { buildingId: buildingA.id, code: '101' } });

    assert.equal((await call(manager, 'GET', `/api/rooms/${seeded.id}`)).status, 404);

    for (const [method, path, body] of [
      ['POST', roomsPath(), roomBody({ code: 'M01' })],
      ['POST', `${roomsPath()}/bulk/preview`, bulkBody()],
      ['POST', `${roomsPath()}/bulk`, bulkBody()],
      ['PUT', `/api/rooms/${room.id}`, roomBody({ version: room.version })],
      ['POST', `/api/rooms/${room.id}/maintenance`, { maintenance: false, version: 1 }],
      ['POST', `/api/rooms/${room.id}/archive`, {}],
    ])
      assert.equal(
        (await call(manager, method, path, body, { 'Idempotency-Key': randomUUID() })).status,
        403,
        `${method} ${path}`,
      );
  });

  test('archive hides the room, frees its code and blocks further changes', async () => {
    const archived = await call(cookie, 'POST', `/api/rooms/${room.id}/archive`);

    assert.equal(archived.status, 200, JSON.stringify(archived.body));
    assert.ok(archived.body.data.archivedAt);
    assert.equal(
      await auditCount({ action: 'room.archive', resourceType: 'room', resourceId: room.id }),
      1,
    );

    const list = await call(cookie, 'GET', `${roomsPath()}?pageSize=100`);

    assert.ok(!list.body.data.some((item) => item.id === room.id));

    const again = await call(cookie, 'POST', `/api/rooms/${room.id}/archive`);

    assert.equal(again.status, 409);
    assert.equal(again.body.code, 'room_archived');

    const update = await call(
      cookie,
      'PUT',
      `/api/rooms/${room.id}`,
      roomBody({ code: 'A02', version: archived.body.data.version }),
    );

    assert.equal(update.status, 409);
    assert.equal(update.body.code, 'room_archived');

    const reused = await call(cookie, 'POST', roomsPath(), roomBody({ code: 'A02' }));

    assert.equal(reused.status, 201, JSON.stringify(reused.body));
  });

  test('rooms of an archived building cannot be created', async () => {
    const archived = await call(cookie, 'POST', `/api/buildings/${building.id}/archive`);

    assert.equal(archived.status, 200, JSON.stringify(archived.body));

    const result = await call(cookie, 'POST', roomsPath(), roomBody({ code: 'Z01' }));

    assert.equal(result.status, 409);
    assert.equal(result.body.code, 'building_archived');
  });
});
