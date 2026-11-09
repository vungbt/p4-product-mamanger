// ST-06/ST-07 against the live API and seeded database (scripts/test-stay-api-integration.sh).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { AuditLogModel, BuildingModel, sequelize } from '../dist/sequelize/models/index.js';

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
async function call(cookie, method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      origin,
      'accept-language': 'vi',
      ...(cookie ? { cookie } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
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
  const email = `manager-${suffix.toLowerCase()}@stay.local`;
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

describe('Stay API: settings, services, buildings and prices', { skip: !base }, () => {
  let cookie;
  let buildingA;
  let services;
  const service = (code) => services.find((item) => item.code === code);

  before(async () => {
    cookie = await signIn(owner);
    buildingA = await BuildingModel.findOne({ where: { code: 'A' } });
  });
  after(() => sequelize.close());

  test('every endpoint requires a session', async () => {
    const id = buildingA.id;
    const routes = [
      ['GET', '/api/settings'],
      ['PUT', '/api/settings'],
      ['GET', '/api/services'],
      ['POST', '/api/services'],
      ['PUT', `/api/services/${id}`],
      ['GET', '/api/buildings'],
      ['POST', '/api/buildings'],
      ['GET', `/api/buildings/${id}`],
      ['PUT', `/api/buildings/${id}`],
      ['POST', `/api/buildings/${id}/archive`],
      ['GET', `/api/buildings/${id}/prices`],
      ['PUT', `/api/buildings/${id}/prices`],
    ];

    for (const [method, path] of routes) {
      const result = await call(undefined, method, path, method === 'GET' ? undefined : {});

      assert.equal(result.status, 401, `${method} ${path}`);
      assert.equal(result.body.code, 'unauthorized');
    }
  });

  test('settings default to rules.md and update with optimistic locking', async () => {
    const current = await call(cookie, 'GET', '/api/settings');

    assert.equal(current.status, 200);
    assert.deepEqual(
      { ...current.body.data, version: undefined },
      {
        readingDay: 31,
        issueDay: 1,
        dueDay: 5,
        roundingUnit: 1000,
        refundUnusedRent: false,
        transferContentTemplate: '{invoiceCode}',
        version: undefined,
      },
    );

    const invalid = await call(cookie, 'PUT', '/api/settings', {
      readingDay: 29,
      issueDay: 0,
      dueDay: 5,
      roundingUnit: 500,
      refundUnusedRent: 'yes',
      transferContentTemplate: '',
      version: current.body.data.version,
    });

    assertFieldErrors(invalid, [
      'readingDay',
      'issueDay',
      'roundingUnit',
      'refundUnusedRent',
      'transferContentTemplate',
    ]);
    assert.match(invalid.body.extensions.readingDay[0], /cuối tháng/);

    const dueBeforeIssue = await call(cookie, 'PUT', '/api/settings', {
      ...current.body.data,
      issueDay: 10,
      dueDay: 5,
    });

    assertFieldErrors(dueBeforeIssue, ['dueDay']);

    const audits = await auditCount({ action: 'settings.update', resourceType: 'settings' });
    const updated = await call(cookie, 'PUT', '/api/settings', {
      ...current.body.data,
      readingDay: 25,
      dueDay: 10,
      roundingUnit: 100,
      refundUnusedRent: true,
    });

    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.data.readingDay, 25);
    assert.equal(updated.body.data.version, current.body.data.version + 1);
    assert.equal(
      await auditCount({ action: 'settings.update', resourceType: 'settings' }),
      audits + 1,
    );

    const stale = await call(cookie, 'PUT', '/api/settings', current.body.data);

    assert.equal(stale.status, 409);
    assert.equal(stale.body.code, 'version_conflict');

    const restored = await call(cookie, 'PUT', '/api/settings', {
      ...current.body.data,
      version: updated.body.data.version,
    });

    assert.equal(restored.status, 200);
    assert.equal(restored.body.data.readingDay, 31);
  });

  test('the migration seeds the default services', async () => {
    const result = await call(cookie, 'GET', '/api/services');

    assert.equal(result.status, 200);
    services = result.body.data;

    const defaults = Object.fromEntries(
      ['electricity', 'water', 'internet', 'garbage', 'common_fee', 'parking'].map((code) => {
        const { kind, unit, defaultPrice, active } = service(code);

        return [code, { kind, unit, defaultPrice, active }];
      }),
    );

    assert.deepEqual(defaults, {
      electricity: { kind: 'electricity', unit: 'kWh', defaultPrice: 3500, active: true },
      water: { kind: 'water', unit: 'm³', defaultPrice: 20000, active: true },
      internet: { kind: 'per_room', unit: 'phòng', defaultPrice: 100000, active: true },
      garbage: { kind: 'per_room', unit: 'phòng', defaultPrice: 30000, active: true },
      common_fee: { kind: 'per_person', unit: 'người', defaultPrice: 50000, active: true },
      parking: { kind: 'per_vehicle', unit: 'xe', defaultPrice: 100000, active: true },
    });
    assert.equal(service('electricity').name, 'Điện');
  });

  test('services: create, validation and unique names', async () => {
    const name = `Vệ sinh ${suffix}`;
    const audits = await auditCount({ action: 'service.create', resourceType: 'service' });
    const created = await call(cookie, 'POST', '/api/services', {
      name,
      kind: 'per_room',
      unit: 'phòng',
      defaultPrice: 20000,
    });

    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.data.code, `ve_sinh_${suffix.toLowerCase()}`);
    assert.equal(created.body.data.active, true);
    assert.ok(created.body.data.sortOrder > service('parking').sortOrder);
    assert.equal(
      await auditCount({
        action: 'service.create',
        resourceType: 'service',
        resourceId: created.body.data.id,
      }),
      1,
    );
    assert.equal(
      await auditCount({ action: 'service.create', resourceType: 'service' }),
      audits + 1,
    );

    assertFieldErrors(
      await call(cookie, 'POST', '/api/services', {
        name: name.toUpperCase(),
        kind: 'per_room',
        unit: 'phòng',
        defaultPrice: 1,
      }),
      ['name'],
    );
    assertFieldErrors(
      await call(cookie, 'POST', '/api/services', {
        name: '',
        kind: 'per_month',
        unit: '',
        defaultPrice: -1,
      }),
      ['name', 'kind', 'unit', 'defaultPrice'],
    );
    assertFieldErrors(
      await call(cookie, 'POST', '/api/services', {
        name: `Giá lẻ ${suffix}`,
        kind: 'per_room',
        unit: 'phòng',
        defaultPrice: 1000.5,
      }),
      ['defaultPrice'],
    );
  });

  test('services: only one active electricity and one active water', async () => {
    assertFieldErrors(
      await call(cookie, 'POST', '/api/services', {
        name: `Điện 2 ${suffix}`,
        kind: 'electricity',
        unit: 'kWh',
        defaultPrice: 4000,
      }),
      ['kind'],
    );

    // An inactive second electricity service is allowed…
    const spare = await call(cookie, 'POST', '/api/services', {
      name: `Điện 2 ${suffix}`,
      kind: 'electricity',
      unit: 'kWh',
      defaultPrice: 4000,
      active: false,
    });

    assert.equal(spare.status, 201, JSON.stringify(spare.body));

    const spareBody = ({ name, unit, defaultPrice, sortOrder, version }, active) => ({
      name,
      unit,
      defaultPrice,
      sortOrder,
      active,
      version,
    });

    // …but cannot be turned on while the original is active.
    assertFieldErrors(
      await call(
        cookie,
        'PUT',
        `/api/services/${spare.body.data.id}`,
        spareBody(spare.body.data, true),
      ),
      ['active'],
    );

    const electricity = service('electricity');
    const off = await call(
      cookie,
      'PUT',
      `/api/services/${electricity.id}`,
      spareBody(electricity, false),
    );

    assert.equal(off.status, 200, JSON.stringify(off.body));
    assert.equal(off.body.data.active, false);

    const swapped = await call(
      cookie,
      'PUT',
      `/api/services/${spare.body.data.id}`,
      spareBody(spare.body.data, true),
    );

    assert.equal(swapped.status, 200, JSON.stringify(swapped.body));

    // Restore: the seeded electricity service is the active one again.
    const spareOff = await call(
      cookie,
      'PUT',
      `/api/services/${spare.body.data.id}`,
      spareBody(swapped.body.data, false),
    );

    assert.equal(spareOff.status, 200);

    const on = await call(
      cookie,
      'PUT',
      `/api/services/${electricity.id}`,
      spareBody(off.body.data, true),
    );

    assert.equal(on.status, 200, JSON.stringify(on.body));
  });

  test('services: update keeps kind and code, rejects stale versions and unknown ids', async () => {
    const internet = service('internet');
    const body = {
      name: internet.name,
      unit: internet.unit,
      defaultPrice: 120000,
      sortOrder: internet.sortOrder,
      active: true,
      version: internet.version,
      kind: 'per_person',
      code: 'changed',
    };
    const updated = await call(cookie, 'PUT', `/api/services/${internet.id}`, body);

    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.data.defaultPrice, 120000);
    assert.equal(updated.body.data.kind, 'per_room');
    assert.equal(updated.body.data.code, 'internet');
    assert.equal(updated.body.data.version, internet.version + 1);

    const stale = await call(cookie, 'PUT', `/api/services/${internet.id}`, body);

    assert.equal(stale.status, 409);
    assert.equal(stale.body.code, 'version_conflict');

    const restored = await call(cookie, 'PUT', `/api/services/${internet.id}`, {
      ...body,
      defaultPrice: internet.defaultPrice,
      version: updated.body.data.version,
    });

    assert.equal(restored.status, 200);
    assert.equal((await call(cookie, 'PUT', `/api/services/${randomUUID()}`, body)).status, 404);
    assert.equal((await call(cookie, 'DELETE', `/api/services/${internet.id}`)).status, 404);
  });

  const buildingBody = (overrides = {}) => ({
    code: `b${suffix}`,
    name: `Toà ${suffix}`,
    address: '1 Lê Lợi, Quận 1',
    readingDay: null,
    issueDay: 2,
    dueDay: null,
    roundingUnit: null,
    refundUnusedRent: true,
    bankBin: '970436',
    bankAccount: '0011 0022 33',
    bankAccountName: 'nguyen van a',
    rulesText: 'Giữ yên lặng sau 22h.',
    contactPhone: '0901 234 567',
    ...overrides,
  });
  let building;

  test('buildings: create normalizes input and inherits billing defaults', async () => {
    const created = await call(cookie, 'POST', '/api/buildings', buildingBody());

    assert.equal(created.status, 201, JSON.stringify(created.body));
    building = created.body.data;
    assert.equal(building.code, `B${suffix}`);
    assert.equal(building.bankAccount, '0011002233');
    assert.equal(building.bankAccountName, 'NGUYEN VAN A');
    assert.equal(building.contactPhone, '0901234567');
    assert.equal(building.readingDay, null);
    assert.equal(building.issueDay, 2);
    assert.deepEqual(building.billing, {
      readingDay: 31,
      issueDay: 2,
      dueDay: 5,
      roundingUnit: 1000,
      refundUnusedRent: true,
    });
    assert.deepEqual(building.stats, { roomCount: 0, occupiedRoomCount: 0 });
    assert.equal(building.codeLocked, false);
    assert.equal(building.archivedAt, null);
    assert.equal(
      await auditCount({
        action: 'building.create',
        resourceType: 'building',
        resourceId: building.id,
      }),
      1,
    );
  });

  test('buildings: field errors for code, bank account, phone and billing days', async () => {
    assertFieldErrors(await call(cookie, 'POST', '/api/buildings', buildingBody()), ['code']);
    assertFieldErrors(
      await call(cookie, 'POST', '/api/buildings', buildingBody({ code: 'AB-1' })),
      ['code'],
    );
    assertFieldErrors(
      await call(cookie, 'POST', '/api/buildings', buildingBody({ code: 'ABCDEFG' })),
      ['code'],
    );

    const invalid = await call(
      cookie,
      'POST',
      '/api/buildings',
      buildingBody({
        code: `C${suffix}`,
        name: '',
        readingDay: 30,
        roundingUnit: 10,
        bankBin: '9704',
        bankAccount: null,
        bankAccountName: 'Nguyễn Văn A',
        contactPhone: '12345',
      }),
    );

    assertFieldErrors(invalid, [
      'name',
      'readingDay',
      'roundingUnit',
      'bankBin',
      'bankAccount',
      'bankAccountName',
      'contactPhone',
    ]);
    assertFieldErrors(
      await call(
        cookie,
        'POST',
        '/api/buildings',
        buildingBody({ code: `C${suffix}`, issueDay: 10, dueDay: null }),
      ),
      ['issueDay'],
    );
    assert.equal(await BuildingModel.count({ where: { code: `C${suffix}` } }), 0);
  });

  test('buildings: detail, list query and update with optimistic locking', async () => {
    const detail = await call(cookie, 'GET', `/api/buildings/${building.id}`);

    assert.equal(detail.status, 200);
    assert.equal(detail.body.data.rulesText, 'Giữ yên lặng sau 22h.');

    const list = await call(cookie, 'GET', `/api/buildings?q=${suffix}&pageSize=5`);

    assert.equal(list.status, 200);
    assert.deepEqual(
      list.body.data.map((item) => item.id),
      [building.id],
    );
    assert.equal(list.body.meta.total, 1);
    assert.equal(list.body.meta.pageSize, 5);

    const all = await call(cookie, 'GET', '/api/buildings?sortBy=name&sortOrder=desc&pageSize=100');

    assert.ok(all.body.data.some((item) => item.code === 'A'));
    assert.equal((await call(cookie, 'GET', '/api/buildings?status=gone')).status, 400);
    assert.equal((await call(cookie, 'GET', '/api/buildings?unknown=1')).status, 400);

    const body = buildingBody({ name: `Toà mới ${suffix}`, dueDay: 7, version: building.version });
    const updated = await call(cookie, 'PUT', `/api/buildings/${building.id}`, body);

    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.data.name, `Toà mới ${suffix}`);
    assert.equal(updated.body.data.billing.dueDay, 7);
    assert.equal(updated.body.data.version, building.version + 1);

    const stale = await call(cookie, 'PUT', `/api/buildings/${building.id}`, body);

    assert.equal(stale.status, 409);
    assert.equal(stale.body.code, 'version_conflict');
    assertFieldErrors(
      await call(cookie, 'PUT', `/api/buildings/${building.id}`, {
        ...body,
        code: 'A',
        version: updated.body.data.version,
      }),
      ['code'],
    );
    assert.equal((await call(cookie, 'GET', `/api/buildings/${randomUUID()}`)).status, 404);
    assert.equal(
      await auditCount({
        action: 'building.update',
        resourceType: 'building',
        resourceId: building.id,
      }),
      1,
    );
    building = updated.body.data;
  });

  test('prices: the latest override on or before the date, else the default', async () => {
    const electricity = service('electricity');
    const water = service('water');
    const path = `/api/buildings/${building.id}/prices`;
    const set = (body) => call(cookie, 'PUT', path, body);
    const priceOn = async (date, serviceId = electricity.id) => {
      const result = await call(cookie, 'GET', `${path}?date=${date}`);

      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.equal(result.body.data.date, date);
      return result.body.data.items.find((item) => item.serviceId === serviceId);
    };

    const initial = await call(cookie, 'GET', path);

    assert.equal(initial.status, 200);
    assert.match(initial.body.data.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(initial.body.data.items.length, services.length + 2);
    assert.deepEqual((await priceOn('2026-11-15')).price, electricity.defaultPrice);

    for (const [effectiveFrom, price] of [
      ['2027-01-01', 4500],
      ['2026-12-01', 4000],
      ['2027-03-01', null],
    ]) {
      const result = await set({ serviceId: electricity.id, effectiveFrom, price });

      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.equal(result.body.data.price, price);
    }
    assert.equal(
      (await set({ serviceId: water.id, effectiveFrom: '2026-12-15', price: 18000 })).status,
      200,
    );

    const expectations = [
      ['2026-11-30', 3500, 'default', null],
      ['2026-12-01', 4000, 'override', '2026-12-01'],
      ['2026-12-31', 4000, 'override', '2026-12-01'],
      ['2027-01-01', 4500, 'override', '2027-01-01'],
      ['2027-02-28', 4500, 'override', '2027-01-01'],
      ['2027-03-01', 3500, 'default', '2027-03-01'],
      ['2030-01-01', 3500, 'default', '2027-03-01'],
    ];

    for (const [date, price, source, effectiveFrom] of expectations) {
      const item = await priceOn(date);

      assert.deepEqual(
        { price: item.price, source: item.source, effectiveFrom: item.effectiveFrom },
        {
          price,
          source,
          effectiveFrom,
        },
        date,
      );
    }

    const december = await priceOn('2026-12-20', water.id);

    assert.equal(december.price, 18000);
    assert.equal((await priceOn('2026-12-14', water.id)).price, 20000);

    // Same date replaces the override (no invoice used it yet); history keeps one row per date.
    assert.equal(
      (await set({ serviceId: electricity.id, effectiveFrom: '2026-12-01', price: 4100 })).status,
      200,
    );

    const replaced = await priceOn('2026-12-10');

    assert.equal(replaced.price, 4100);
    assert.deepEqual(
      replaced.history.map((row) => [row.effectiveFrom, row.price]),
      [
        ['2027-03-01', null],
        ['2027-01-01', 4500],
        ['2026-12-01', 4100],
      ],
    );
    assert.equal(replaced.defaultPrice, 3500);

    // Building A keeps the default: overrides are per building.
    const other = await call(
      cookie,
      'GET',
      `/api/buildings/${buildingA.id}/prices?date=2026-12-10`,
    );

    assert.equal(
      other.body.data.items.find((item) => item.serviceId === electricity.id).price,
      3500,
    );

    assertFieldErrors(
      await set({ serviceId: electricity.id, effectiveFrom: '2026-02-30', price: 1 }),
      ['effectiveFrom'],
    );
    assertFieldErrors(
      await set({ serviceId: randomUUID(), effectiveFrom: '2026-12-01', price: -5 }),
      ['serviceId', 'price'],
    );
    assertFieldErrors(await set({ serviceId: electricity.id, effectiveFrom: '2026-12-01' }), [
      'price',
    ]);
    assertFieldErrors(await call(cookie, 'GET', `${path}?date=2026-13-01`), ['date']);
    assert.equal(
      await auditCount({
        action: 'building_price.update',
        resourceType: 'building_price',
        resourceId: building.id,
      }),
      5,
    );
  });

  test('managers only see their buildings; other buildings answer 404', async () => {
    const manager = await signIn(await createManager(building.id));
    const list = await call(manager, 'GET', '/api/buildings?status=all&pageSize=100');

    assert.equal(list.status, 200);
    assert.deepEqual(
      list.body.data.map((item) => item.id),
      [building.id],
    );
    assert.equal((await call(manager, 'GET', `/api/buildings/${building.id}`)).status, 200);
    assert.equal((await call(manager, 'GET', `/api/buildings/${building.id}/prices`)).status, 200);

    const hidden = await call(manager, 'GET', `/api/buildings/${buildingA.id}`);

    assert.equal(hidden.status, 404);
    assert.equal(hidden.body.code, 'not_found');
    assert.equal((await call(manager, 'GET', `/api/buildings/${buildingA.id}/prices`)).status, 404);

    // Writes and settings stay with the owner.
    assert.equal(
      (
        await call(
          manager,
          'PUT',
          `/api/buildings/${building.id}`,
          buildingBody({ version: building.version }),
        )
      ).status,
      403,
    );
    assert.equal(
      (await call(manager, 'POST', `/api/buildings/${building.id}/archive`)).status,
      403,
    );
    assert.equal((await call(manager, 'POST', '/api/buildings', buildingBody())).status, 403);
    assert.equal((await call(manager, 'GET', '/api/settings')).status, 403);
    assert.equal((await call(manager, 'GET', '/api/services')).status, 403);
  });

  test('archive hides the building and blocks further changes', async () => {
    const archived = await call(cookie, 'POST', `/api/buildings/${building.id}/archive`);

    assert.equal(archived.status, 200, JSON.stringify(archived.body));
    assert.ok(archived.body.data.archivedAt);
    assert.equal(
      await auditCount({
        action: 'building.archive',
        resourceType: 'building',
        resourceId: building.id,
      }),
      1,
    );

    const again = await call(cookie, 'POST', `/api/buildings/${building.id}/archive`);

    assert.equal(again.status, 409);
    assert.equal(again.body.code, 'building_archived');

    const update = await call(
      cookie,
      'PUT',
      `/api/buildings/${building.id}`,
      buildingBody({ version: archived.body.data.version }),
    );

    assert.equal(update.status, 409);
    assert.equal(
      (
        await call(cookie, 'PUT', `/api/buildings/${building.id}/prices`, {
          serviceId: service('water').id,
          effectiveFrom: '2027-06-01',
          price: 1,
        })
      ).status,
      409,
    );

    const active = await call(cookie, 'GET', `/api/buildings?q=${suffix}`);
    const archivedList = await call(cookie, 'GET', `/api/buildings?q=${suffix}&status=archived`);

    assert.equal(active.body.meta.total, 0);
    assert.deepEqual(
      archivedList.body.data.map((item) => item.id),
      [building.id],
    );
  });
});
