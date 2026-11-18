// Service description: create/update/read and its snapshot on issued invoice lines.
// CI Postgres/API only; own building, room and far-future contract (2042). The test service is
// switched off at the end so other suites never bill it.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { AuditLogModel, sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();

async function signIn(email, password) {
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

async function call(cookie, method, path, body) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      origin,
      'accept-language': 'vi',
      ...(cookie ? { cookie } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body.data;
}

describe('service description', { skip: !base }, () => {
  let owner, service;
  const name = `Dịch vụ chung ${suffix}`;
  const description = 'Thang máy, máy giặt, rác';
  const listed = async () =>
    ok(await call(owner, 'GET', '/services')).find((row) => row.id === service.id);
  const update = (changes) =>
    call(owner, 'PUT', `/services/${service.id}`, {
      name: service.name,
      unit: service.unit,
      defaultPrice: service.defaultPrice,
      sortOrder: service.sortOrder,
      active: service.active,
      version: service.version,
      ...changes,
    });

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
  });
  after(async () => {
    if (service) {
      const current = await listed();

      ok(
        await call(owner, 'PUT', `/services/${service.id}`, {
          ...current,
          active: false,
          version: current.version,
        }),
      );
    }
    await sequelize.close();
  });

  test('create, read, validate, update and audit the description', async () => {
    const tooLong = await call(owner, 'POST', '/services', {
      name,
      kind: 'per_room',
      unit: 'phòng',
      defaultPrice: 60000,
      description: 'x'.repeat(501),
    });

    assert.equal(tooLong.status, 400, JSON.stringify(tooLong.body));
    assert.ok(tooLong.body.extensions.description?.[0]);

    service = ok(
      await call(owner, 'POST', '/services', {
        name,
        kind: 'per_room',
        unit: 'phòng',
        defaultPrice: 60000,
        description: `  ${description}  `,
      }),
      201,
    );
    assert.equal(service.description, description);
    assert.equal((await listed()).description, description);
    const audit = await AuditLogModel.findOne({
      where: { action: 'service.create', resourceId: service.id, outcome: 'success' },
    });
    assert.equal(audit.changes.after.description, description);

    // Omitted (older clients: toggle, reorder) keeps it; `''`/`null` clears it.
    service = ok(await update({ sortOrder: service.sortOrder }));
    assert.equal(service.description, description);
    service = ok(await update({ description: '' }));
    assert.equal(service.description, null);
    service = ok(await update({ description }));
    assert.equal(service.description, description);
    assert.equal((await update({ description: 'x'.repeat(501) })).status, 400);
  });

  test('invoice lines snapshot the description; later edits leave issued invoices unchanged', async () => {
    const building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `D${suffix}`,
        name: `Description ${suffix}`,
      }),
      201,
    );
    const prices = ok(await call(owner, 'GET', `/buildings/${building.id}/prices`));
    assert.equal(prices.items.find((row) => row.serviceId === service.id).description, description);
    const room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: '101',
        floor: 1,
        listPrice: 3000000,
        maxOccupants: 2,
        initialElectric: 0,
        initialWater: 0,
      }),
      201,
    );
    const tenant = ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: building.id,
        fullName: `Description tenant ${suffix}`,
        phone: '0901234567',
      }),
      201,
    );
    const draft = ok(
      await call(owner, 'POST', '/contracts', {
        roomId: room.id,
        startDate: '2042-10-01',
        endDate: '2043-12-31',
        rent: 3000000,
        depositAmount: 0,
        depositCollected: false,
        depositMethod: 'cash',
        initialElectric: 0,
        initialWater: 0,
        occupantIds: [tenant.id],
        primaryTenantId: tenant.id,
        serviceIds: [service.id],
        vehicleIds: [],
      }),
      201,
    );
    const preview = ok(await call(owner, 'GET', `/contracts/${draft.id}/move-in-preview`));
    assert.ok(
      preview.lines.some((line) => line.label === `${name} (${description})`),
      JSON.stringify(preview.lines),
    );
    const contract = ok(await call(owner, 'POST', `/contracts/${draft.id}/activate`));
    const [moveIn] = ok(
      await call(owner, 'GET', `/invoices?contractId=${contract.id}&kind=move_in`),
    );
    ok(await call(owner, 'POST', '/invoices/issue', { ids: [moveIn.id] }));
    const lineOf = async () =>
      ok(await call(owner, 'GET', `/invoices/${moveIn.id}`)).lines.find(
        (line) => line.serviceId === service.id,
      );

    assert.equal((await lineOf()).meta.serviceDescription, description);
    assert.equal((await lineOf()).description.params.name, name);

    service = ok(await update({ name: `${name} mới`, description: 'Chỉ thang máy' }));
    assert.equal((await lineOf()).meta.serviceDescription, description);
    assert.equal((await lineOf()).description.params.name, name);
  });
});
