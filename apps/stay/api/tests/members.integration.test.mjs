// ST-27: live API + migrated Postgres; uses isolated fixtures, never whole-building counts.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { hash } from 'bcryptjs';
import {
  AnnouncementModel,
  AuditLogModel,
  BuildingModel,
  ContractModel,
  DomainEventModel,
  ExpenseCategoryModel,
  ExpenseModel,
  InvoiceModel,
  MaintenanceRequestModel,
  MeterModel,
  MeterReadingModel,
  PaymentModel,
  RoomModel,
  sequelize,
  TenantModel,
  UserModel,
} from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 8).toLowerCase();

async function call(cookie, method, path, body) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      origin,
      ...(cookie ? { cookie } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();

  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function signIn(email, password) {
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

async function fixture(building) {
  const buildingId = building.id;
  const room = await RoomModel.create({
    buildingId,
    code: '101',
    floor: 1,
    areaM2: 20,
    listPrice: 1000000,
    maxOccupants: 2,
  });
  const tenant = await TenantModel.create({
    buildingId,
    fullName: `ST27 ${suffix}`,
    phone: '0901234567',
  });
  const contract = await ContractModel.create({
    buildingId,
    roomId: room.id,
    code: `ST27-${suffix}-${building.code}`,
    status: 'draft',
    startDate: '2026-11-01',
    rent: 1000000,
    depositAmount: 0,
    depositCollected: false,
    depositMethod: 'cash',
    initialElectric: 0,
    initialWater: 0,
  });
  const invoice = await InvoiceModel.create({
    buildingId,
    roomId: room.id,
    contractId: contract.id,
    kind: 'monthly',
    period: '2026-11',
    status: 'issued',
    code: `ST27-${suffix}-${building.code}`,
    roundingUnit: 1000,
    issuedOn: '2026-11-01',
    dueOn: '2026-11-05',
    subtotal: 1000000,
    rounding: 0,
    total: 1000000,
    paidTotal: 100,
  });
  const payment = await PaymentModel.create({
    buildingId,
    invoiceId: invoice.id,
    amount: 100,
    method: 'cash',
    paidOn: '2026-11-01',
    actorId: null,
  });
  const category = await ExpenseCategoryModel.findOne();
  const expense = await ExpenseModel.create({
    buildingId,
    categoryId: category.id,
    amount: 100,
    spentOn: '2026-11-01',
    period: '2026-11',
  });
  const meter = await MeterModel.create({
    roomId: room.id,
    kind: 'electricity',
    installedOn: '2026-10-01',
    initialReading: 0,
  });
  const reading = await MeterReadingModel.create({
    meterId: meter.id,
    period: '2026-11',
    reading: 1,
    readOn: '2026-11-30',
  });
  const request = await MaintenanceRequestModel.create({
    buildingId,
    roomId: room.id,
    source: 'owner',
    category: 'other',
    title: `ST27 ${suffix}`,
    description: '',
  });
  const audit = await AuditLogModel.create({
    id: randomUUID(),
    actorId: null,
    action: 'st27.test',
    resourceType: 'room',
    resourceId: room.id,
    outcome: 'success',
    changes: { buildingId },
    requestId: null,
    reason: null,
  });
  const notificationId = randomUUID();

  await sequelize.query(
    'INSERT INTO notifications (id, building_id, title, body, path) VALUES (:id, :buildingId, :title, :body, :path)',
    {
      replacements: {
        id: notificationId,
        buildingId,
        title: 'ST27',
        body: 'Private',
        path: '/rooms',
      },
    },
  );
  const announcement = await AnnouncementModel.create({
    buildingId,
    title: `ST27 ${suffix}`,
    body: 'Private',
    pinned: false,
  });

  return {
    audit,
    notificationId,
    room,
    tenant,
    contract,
    invoice,
    payment,
    expense,
    meter,
    reading,
    request,
    announcement,
  };
}

describe('ST-27 member management and building isolation', { skip: !base }, () => {
  let owner;
  let manager;
  let member;
  let a;
  let b;
  let dataA;
  let dataB;
  const email = `st27-${suffix}@stay.local`;
  const password = 'stay-manager-test-123';

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    a = await BuildingModel.create({
      code: `X${suffix.slice(0, 5).toUpperCase()}`,
      name: `ST27 A ${suffix}`,
    });
    b = await BuildingModel.create({
      code: `Y${suffix.slice(0, 5).toUpperCase()}`,
      name: `ST27 B ${suffix}`,
    });
    dataA = await fixture(a);
    dataB = await fixture(b);
    member = ok(
      await call(owner, 'POST', '/members/invitations', {
        email,
        buildingIds: [a.id],
        permissionGroups: ['operations', 'readings', 'payments', 'billing'],
      }),
      201,
    );
    await sequelize.query(
      `UPDATE auth_accounts SET password=:password WHERE user_id=:id AND provider_id='credential'`,
      { replacements: { id: member.id, password: await hash(password, 10) } },
    );
    manager = await signIn(email, password);
  });
  after(() => sequelize.close());

  test('owner invitation persists scope and durable mail without credential disclosure', async () => {
    assert.deepEqual(member.buildingIds, [a.id]);
    assert.equal(member.email, email);
    assert.equal('password' in member, false);
    assert.equal(
      await DomainEventModel.count({
        where: { aggregateId: member.id, type: 'stay.member.invitation' },
      }),
      1,
    );
    assert.ok(
      await AuditLogModel.count({
        where: { resourceId: member.id, resourceType: 'member', outcome: 'success' },
      }),
    );
    const members = ok(await call(owner, 'GET', `/members?q=${email}`));

    assert.ok(members.some((row) => row.id === member.id));
    assert.equal(
      (
        await call(owner, 'POST', '/members/invitations', {
          email,
          buildingIds: [a.id],
          permissionGroups: [],
        })
      ).status,
      409,
    );
  });

  test('manager and anonymous callers cannot administer members; invalid scopes and groups fail', async () => {
    for (const [method, path] of [
      ['GET', '/members'],
      ['POST', '/members/invitations'],
      ['PUT', `/members/${member.id}`],
      ['POST', `/members/${member.id}/disable`],
    ]) {
      assert.equal(
        (await call(manager, method, path, method === 'GET' ? undefined : {})).status,
        403,
      );
      assert.equal(
        (await call(undefined, method, path, method === 'GET' ? undefined : {})).status,
        401,
      );
    }
    for (const body of [
      { email, buildingIds: [], permissionGroups: [] },
      { email, buildingIds: [a.id], permissionGroups: ['manage'] },
      { email, buildingIds: [a.id, 1], permissionGroups: [] },
    ])
      assert.equal((await call(owner, 'POST', '/members/invitations', body)).status, 400);
    const ownerUser = await UserModel.findOne({ where: { role: 'owner' } });

    assert.equal((await call(owner, 'POST', `/members/${ownerUser.id}/disable`)).status, 404);
  });

  test('every resource list is scoped, explicit building B filters never disclose data', async () => {
    const buildings = ok(await call(manager, 'GET', '/buildings'));

    assert.deepEqual(
      buildings.map((row) => row.id),
      [a.id],
    );
    for (const resource of [
      'tenants',
      'contracts',
      'invoices',
      'payments',
      'deposits',
      'requests',
      'announcements',
    ]) {
      const result = await call(manager, 'GET', `/${resource}?pageSize=100`);
      const rows = ok(result);

      assert.ok(
        rows.every((row) => row.buildingId === a.id),
        resource,
      );
      const denied = await call(manager, 'GET', `/${resource}?buildingId=${b.id}`);

      assert.ok(
        denied.status === 404 || (denied.status === 200 && denied.body.data.length === 0),
        resource,
      );
    }
    const logs = ok(await call(manager, 'GET', '/audit-logs?action=st27.test'));

    assert.ok(logs.some((row) => row.id === dataA.audit.id));
    assert.ok(logs.every((row) => row.id !== dataB.audit.id));
    const notifications = ok(await call(manager, 'GET', '/notifications'));

    assert.ok(notifications.items.some((row) => row.id === dataA.notificationId));
    assert.ok(notifications.items.every((row) => row.id !== dataB.notificationId));
    for (const path of ['/expenses', '/settings'])
      assert.equal((await call(manager, 'GET', `${path}?buildingId=${b.id}`)).status, 403, path);
    for (const path of [
      `/buildings/${b.id}/rooms`,
      `/buildings/${b.id}/readings?period=2026-11`,
      `/buildings/${b.id}/overview?period=2026-11`,
      `/buildings/${b.id}/receivables`,
      `/buildings/${b.id}/residents?date=2026-11-01`,
      `/reports/revenue?buildingId=${b.id}&from=2026-11&to=2026-11`,
      `/reports/rooms?buildingId=${b.id}&year=2026`,
      `/reports/utilities?buildingId=${b.id}&from=2026-11&to=2026-11`,
    ])
      assert.equal((await call(manager, 'GET', path)).status, 404, path);
  });

  test('direct ids, linked ledgers, writes and exports cannot cross buildings', async () => {
    assert.equal(
      (await call(manager, 'POST', '/invoices/issue', { ids: [dataB.invoice.id] })).status,
      404,
    );
    assert.equal(
      (await call(manager, 'POST', `/requests/${dataB.request.id}/reply`, { message: 'Denied' }))
        .status,
      404,
    );
    assert.equal(
      (
        await call(manager, 'PUT', `/announcements/${dataB.announcement.id}`, {
          buildingId: b.id,
          title: 'Denied',
          body: 'Denied',
          roomIds: null,
          pinned: false,
          version: 1,
        })
      ).status,
      404,
    );

    for (const path of [
      `/buildings/${b.id}`,
      `/audit-logs/${dataB.audit.id}`,
      `/rooms/${dataB.room.id}`,
      `/tenants/${dataB.tenant.id}`,
      `/contracts/${dataB.contract.id}`,
      `/invoices/${dataB.invoice.id}`,
      `/contracts/${dataB.contract.id}/deposits`,
    ])
      assert.equal((await call(manager, 'GET', path)).status, 404, path);
    assert.equal(
      (
        await call(manager, 'PUT', `/readings/${dataB.reading.id}`, {
          meterId: dataB.meter.id,
          period: '2026-11',
          reading: 2,
          readOn: '2026-11-30',
          version: 1,
        })
      ).status,
      404,
    );
    assert.equal(
      (await call(manager, 'POST', `/notifications/${dataB.notificationId}/read`, {})).status,
      404,
    );
    for (const [path, body] of [
      [
        `/invoices/${dataB.invoice.id}/payments`,
        { amount: 100, method: 'cash', paidOn: '2026-11-01' },
      ],
    ]) {
      // Payment endpoint also validates idempotency before looking up the record.
      const response = await fetch(`${base}/api${path}`, {
        method: 'POST',
        headers: {
          origin,
          cookie: manager,
          'content-type': 'application/json',
          'idempotency-key': randomUUID(),
        },
        body: JSON.stringify(body),
      });

      assert.equal(response.status, 404, `${path}: ${await response.text()}`);
    }
    for (const [path, body] of [
      [`/buildings/${b.id}/residents/export`, { date: '2026-11-01', status: 'all' }],
      [
        '/reports/exports',
        { buildingId: b.id, from: '2026-11', to: '2026-11', sheets: ['invoices'] },
      ],
    ])
      assert.equal((await call(manager, 'POST', path, body)).status, 404, path);
  });

  test('permissions and assignments change on the next request with the same session; stale writes conflict', async () => {
    member = ok(
      await call(owner, 'PUT', `/members/${member.id}`, {
        buildingIds: [a.id, b.id],
        permissionGroups: ['readings', 'payments'],
        version: member.version,
      }),
    );
    assert.equal((await call(manager, 'GET', `/rooms/${dataB.room.id}`)).status, 200);
    assert.equal(
      (await call(manager, 'POST', `/buildings/${a.id}/billing/2026-11/drafts`, {})).status,
      403,
    );
    const caps = ok(await call(manager, 'GET', '/me/capabilities'));

    assert.ok(caps.rules.length);
    assert.equal(
      (
        await call(owner, 'PUT', `/members/${member.id}`, {
          buildingIds: [a.id],
          permissionGroups: [],
          version: member.version - 1,
        })
      ).status,
      409,
    );
    member = ok(
      await call(owner, 'PUT', `/members/${member.id}`, {
        buildingIds: [a.id],
        permissionGroups: [],
        version: member.version,
      }),
    );
    assert.equal((await call(manager, 'GET', `/rooms/${dataB.room.id}`)).status, 404);
    assert.equal(
      (
        await call(manager, 'PUT', `/buildings/${a.id}/readings`, {
          period: '2026-11',
          readings: [],
        })
      ).status,
      403,
    );
    assert.equal((await call(manager, 'GET', `/rooms/${dataA.room.id}`)).status, 200);
  });

  test('disable atomically revokes every session and prevents sign-in', async () => {
    ok(await call(owner, 'POST', `/members/${member.id}/disable`));
    assert.equal((await call(manager, 'GET', '/me')).status, 401);
    const [sessions] = await sequelize.query('SELECT id FROM auth_sessions WHERE user_id=:id', {
      replacements: { id: member.id },
    });

    assert.equal(sessions.length, 0);
    const response = await call(undefined, 'POST', '/auth/sign-in/email', { email, password });

    assert.ok(response.status >= 400);
  });
});
