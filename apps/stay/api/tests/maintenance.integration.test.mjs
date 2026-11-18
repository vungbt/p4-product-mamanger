// ST-22: CI only, real migrated API/Postgres. Never starts infrastructure.
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { AuditLogModel, sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 5);
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

async function login(email, password) {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(response.status, 200, await response.clone().text());
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}

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

  return { status: response.status, body: await response.json(), headers: response.headers };
}

function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body.data;
}

async function upload(cookie, buildingId) {
  const ticket = ok(
    await call(cookie, 'POST', '/uploads', { purpose: 'maintenance_photo', buildingId }),
    201,
  );
  const form = new FormData();

  form.append('file', new Blob([PNG], { type: 'image/png' }), 'repair.png');
  const response = await fetch(new URL(ticket.uploadUrl, base), { method: 'POST', body: form });

  assert.equal(response.status, 200);
  return ok(await call(cookie, 'POST', `/uploads/${ticket.id}/complete`)).fileId;
}

describe('ST-22 maintenance jobs', { skip: !base }, () => {
  let owner, manager, readOnly, building, outside, room, otherRoom, category;

  async function createManager(groups) {
    const id = randomUUID();
    const email = `maintenance-${id}@stay.local`;

    await sequelize.query(
      `
      INSERT INTO users(id,email,display_name,email_verified,role,account_status,permission_groups)
        VALUES(:id,:email,'ST22',true,'manager','active',:groups);
      INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password)
        VALUES(:account,:id,'credential',:id,:hash);
      INSERT INTO building_members(id,building_id,user_id) VALUES(:member,:building,:id)`,
      {
        replacements: {
          id,
          email,
          groups: `{${groups.join(',')}}`,
          account: randomUUID(),
          member: randomUUID(),
          building: building.id,
          hash: await bcrypt.hash('maintenance-password-123', 10),
        },
      },
    );
    return login(email, 'maintenance-password-123');
  }

  before(async () => {
    owner = await login('owner@stay.local', 'stay-owner-123');
    building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `M${suffix.toUpperCase()}`,
        name: `ST22 ${suffix}`,
      }),
      201,
    );
    outside = ok(
      await call(owner, 'POST', '/buildings', {
        code: `N${suffix.toUpperCase()}`,
        name: `ST22 outside ${suffix}`,
      }),
      201,
    );
    const input = {
      code: 'R1',
      floor: 1,
      listPrice: 3000000,
      maxOccupants: 4,
      initialElectric: 0,
      initialWater: 0,
    };

    room = ok(await call(owner, 'POST', `/buildings/${building.id}/rooms`, input), 201);
    otherRoom = ok(await call(owner, 'POST', `/buildings/${outside.id}/rooms`, input), 201);
    manager = await createManager(['operations']);
    readOnly = await createManager(['readings']);
    category = ok(await call(owner, 'GET', '/expense-categories')).find(
      (row) => row.name === 'Sửa chữa',
    );
    assert.ok(category);
  });

  after(async () => {
    await sequelize.close();
  });

  const create = async (cookie = owner, changes = {}) =>
    ok(
      await call(cookie, 'POST', '/maintenance', {
        roomId: room.id,
        title: `ST22 ${suffix}`,
        description: 'Sửa vòi nước',
        ...changes,
      }),
      201,
    );
  const update = async (job, status, cookie = owner) =>
    ok(await call(cookie, 'PUT', `/maintenance/${job.id}`, { version: job.version, status }));

  test('session, list validation, private photos, source and strict transitions with history', async () => {
    assert.equal((await call(undefined, 'GET', '/maintenance')).status, 401);
    assert.equal((await call(owner, 'GET', '/maintenance?status=unknown')).status, 400);
    assert.equal((await call(owner, 'GET', '/maintenance?source=unknown')).status, 400);
    const photo = await upload(manager, building.id);
    let job = await create(manager, { photoFileIds: [photo] });

    assert.equal(job.status, 'open');
    assert.equal(job.source, 'owner');
    assert.equal(job.photos[0].fileId, photo);
    assert.match(job.photos[0].url, /signature=/);
    assert.deepEqual(
      job.history.map((entry) => entry.status),
      ['open'],
    );
    const ownList = ok(
      await call(
        manager,
        'GET',
        `/maintenance?buildingId=${building.id}&roomId=${room.id}&status=open&source=owner&q=${suffix}`,
      ),
    );

    assert.ok(ownList.some((row) => row.id === job.id));
    assert.equal(ok(await call(owner, 'GET', `/rooms/${room.id}`)).hasOpenMaintenance, true);
    for (const status of ['done', 'cancelled', 'new', 'rejected'])
      assert.equal(
        (await call(manager, 'PUT', `/maintenance/${job.id}`, { version: job.version, status }))
          .status,
        409,
      );
    job = await update(job, 'in_progress', manager);
    assert.equal(
      (await call(manager, 'PUT', `/maintenance/${job.id}`, { version: 1, status: 'done' })).status,
      409,
    );
    job = await update(job, 'done', manager);
    assert.deepEqual(
      job.history.map((entry) => entry.status),
      ['open', 'in_progress', 'done'],
    );
    assert.equal(
      (
        await call(manager, 'PUT', `/maintenance/${job.id}`, {
          version: job.version,
          status: 'open',
        })
      ).status,
      409,
    );
    const cancelled = await update(await update(await create(), 'in_progress'), 'cancelled');

    assert.equal(cancelled.status, 'cancelled');
    assert.equal(ok(await call(owner, 'GET', `/rooms/${room.id}`)).hasOpenMaintenance, false);
    assert.ok(
      await AuditLogModel.findOne({
        where: { resourceType: 'maintenance', resourceId: job.id, action: 'maintenance.update' },
      }),
    );
  });

  test('operations manager creates linked ST-20 expense; retries do not duplicate; ST-21 includes it', async () => {
    let job = await create(manager);
    const input = {
      categoryId: category.id,
      amount: 123456,
      spentOn: '2040-07-12',
      note: suffix,
      buildingId: outside.id,
      roomId: otherRoom.id,
    };
    const before = ok(
      await call(
        owner,
        'GET',
        `/reports/revenue?buildingId=${building.id}&from=2040-07&to=2040-07`,
      ),
    );

    job = ok(await call(manager, 'POST', `/maintenance/${job.id}/expense`, input), 201);
    assert.equal(job.expense.buildingId, building.id, 'scope comes from the job');
    assert.equal(job.expense.roomId, room.id);
    assert.equal(job.expense.amount, input.amount);
    assert.equal(
      (await call(manager, 'POST', `/maintenance/${job.id}/expense`, input)).status,
      409,
    );
    const costs = ok(
      await call(
        owner,
        'GET',
        `/expenses?buildingId=${building.id}&period=2040-07&roomId=${room.id}`,
      ),
    );

    assert.ok(costs.some((row) => row.id === job.expense.id));
    const report = ok(
      await call(
        owner,
        'GET',
        `/reports/revenue?buildingId=${building.id}&from=2040-07&to=2040-07`,
      ),
    );

    assert.equal(report.totals.expenses - before.totals.expenses, input.amount);
    assert.ok(
      await AuditLogModel.findOne({
        where: { resourceType: 'expense', resourceId: job.expense.id, action: 'expense.create' },
      }),
    );
  });

  test('manager scopes all reads/writes/uploads; permission groups deny operations writes', async () => {
    const other = await create(owner, { roomId: otherRoom.id });
    const own = await create(manager);
    const all = ok(await call(manager, 'GET', '/maintenance?pageSize=100'));

    assert.ok(all.every((row) => row.buildingId === building.id));
    for (const path of [
      `/maintenance?buildingId=${outside.id}`,
      `/maintenance?roomId=${otherRoom.id}`,
      `/maintenance/${other.id}`,
    ])
      assert.equal((await call(manager, 'GET', path)).status, 404);
    assert.equal(
      (await call(manager, 'POST', '/maintenance', { roomId: otherRoom.id, title: 'Outside' }))
        .status,
      404,
    );
    assert.equal(
      (
        await call(manager, 'PUT', `/maintenance/${other.id}`, {
          version: other.version,
          status: 'in_progress',
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await call(manager, 'POST', `/maintenance/${other.id}/expense`, {
          categoryId: category.id,
          amount: 100,
          spentOn: '2040-07-12',
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await call(manager, 'POST', '/uploads', {
          buildingId: outside.id,
          purpose: 'maintenance_photo',
        })
      ).status,
      404,
    );
    assert.equal((await call(readOnly, 'GET', `/maintenance/${own.id}`)).status, 200);
    assert.equal(
      (await call(readOnly, 'POST', '/maintenance', { roomId: room.id, title: 'Forbidden' }))
        .status,
      403,
    );
    assert.equal(
      (
        await call(readOnly, 'PUT', `/maintenance/${own.id}`, {
          version: own.version,
          status: 'in_progress',
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await call(readOnly, 'POST', `/maintenance/${own.id}/expense`, {
          categoryId: category.id,
          amount: 100,
          spentOn: '2040-07-12',
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await call(readOnly, 'POST', '/uploads', {
          buildingId: building.id,
          purpose: 'maintenance_photo',
        })
      ).status,
      404,
    );
    const otherPhoto = await upload(owner, outside.id);

    assert.equal(
      (
        await call(manager, 'PUT', `/maintenance/${own.id}`, {
          version: own.version,
          photoFileIds: [otherPhoto],
        })
      ).status,
      400,
    );
  });

  test('portal reports share the list; staff creation/status notifications and inbox history are preserved', async () => {
    const phone = `09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
    const tenant = ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: building.id,
        fullName: `ST22 Tenant ${suffix}`,
        phone,
      }),
      201,
    );
    const draft = ok(
      await call(owner, 'POST', '/contracts', {
        roomId: room.id,
        startDate: '2042-03-01',
        endDate: '2043-12-31',
        rent: 3000000,
        depositAmount: 0,
        depositCollected: false,
        depositMethod: 'cash',
        initialElectric: 0,
        initialWater: 0,
        occupantIds: [tenant.id],
        primaryTenantId: tenant.id,
        serviceIds: [],
        vehicleIds: [],
      }),
      201,
    );
    const contract = ok(await call(owner, 'POST', `/contracts/${draft.id}/activate`));
    const link = ok(
      await call(owner, 'POST', `/contracts/${contract.id}/portal-links`, { tenantId: tenant.id }),
      201,
    );
    const session = await call(undefined, 'POST', '/portal/sessions', {
      token: link.path.slice('/p/'.length),
      phoneLast4: phone.slice(-4),
    });

    assert.equal(session.status, 201);
    const portal = session.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    const report = ok(
      await call(portal, 'POST', '/portal/maintenance', {
        title: `Tenant ${suffix}`,
        category: 'water',
        severity: 'normal',
        description: 'Vòi nước',
      }),
      201,
    );
    let job = ok(await call(manager, 'GET', `/maintenance/${report.id}`));

    assert.equal(job.source, 'tenant');
    assert.equal(job.status, 'new');
    assert.ok(
      ok(
        await call(
          manager,
          'GET',
          `/maintenance?buildingId=${building.id}&source=tenant&q=${suffix}`,
        ),
      ).some((row) => row.id === job.id),
    );
    const [staff] = await sequelize.query(
      "SELECT id FROM notifications WHERE building_id=:id AND audience='staff' AND kind='maintenance.created'",
      { replacements: { id: building.id } },
    );

    assert.ok(staff.length > 0);
    job = await update(job, 'open', manager);
    // The existing ST-25 inbox accepts into in_progress; its write also appends history.
    ok(await call(manager, 'POST', `/requests/${job.id}/accept`, {}));
    job = ok(await call(manager, 'GET', `/maintenance/${job.id}`));
    assert.equal(job.status, 'in_progress');
    job = await update(job, 'done', manager);
    assert.deepEqual(
      job.history.map((entry) => entry.status),
      ['new', 'open', 'in_progress', 'done'],
    );
    const [notifications] = await sequelize.query(
      "SELECT id FROM notifications WHERE contract_id=:id AND tenant_id=:tenant AND audience='tenant' AND kind='request.updated'",
      { replacements: { id: contract.id, tenant: tenant.id } },
    );

    assert.ok(notifications.length >= 3);
    assert.equal(
      ok(await call(portal, 'GET', '/portal/maintenance')).find((row) => row.id === job.id).status,
      'done',
    );
  });
});
