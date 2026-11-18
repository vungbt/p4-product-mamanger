// ST-14: CI Postgres/API only. This suite never starts infrastructure.
// Uses its own buildings and far-future periods (2041) so seed data does not interfere.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import {
  AuditLogModel,
  InvoiceModel,
  MeterReadingModel,
  sequelize,
} from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 5).toUpperCase();
const PERIOD = '2041-11';
const NEXT = '2041-12';

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

function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body.data;
}

function failed(result, status, code) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  if (code) assert.equal(result.body.code, code, JSON.stringify(result.body));
}

const sum = (lines) => lines.reduce((total, line) => total + line.amount, 0);

describe('ST-14 period invoices', { skip: !base }, () => {
  let owner, managerIn, managerOut, tenantCookie;
  let building, outside, services;
  const contracts = {};
  const rooms = {};
  let phone = 0;
  let roomNumber = 0;
  let users = 0;

  const drafts = (period, key, cookie = owner) =>
    call(cookie, 'POST', `/buildings/${building.id}/billing/${period}/drafts`, undefined, {
      'Idempotency-Key': key,
    });
  const preview = (period, cookie = owner) =>
    call(cookie, 'GET', `/buildings/${building.id}/billing/${period}/preview`);
  const rowOf = (data, name) => data.rows.find((row) => row.contractId === contracts[name].id);
  const monthly = async (name, period = PERIOD) =>
    InvoiceModel.findAll({
      where: { contractId: contracts[name].id, period, kind: 'monthly' },
      order: [['createdAt', 'ASC']],
    });
  const current = async (name, period = PERIOD) =>
    (await monthly(name, period)).find((row) => row.status !== 'void');
  const detail = async (id, cookie = owner) => ok(await call(cookie, 'GET', `/invoices/${id}`));

  async function newRoom(initialElectric, initialWater) {
    const room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `P${++roomNumber}`,
        floor: 1,
        listPrice: 3000000,
        maxOccupants: 3,
        initialElectric,
        initialWater,
      }),
      201,
    );
    const meters = ok(await call(owner, 'GET', `/rooms/${room.id}`)).meters;

    return {
      ...room,
      electricity: meters.find((m) => m.kind === 'electricity'),
      water: meters.find((m) => m.kind === 'water'),
    };
  }

  async function newTenant() {
    phone += 1;
    return ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: building.id,
        fullName: `Invoice tenant ${suffix} ${phone}`,
        phone: `09${String(Date.now() % 1_000_000).padStart(6, '0')}${String(phone).padStart(2, '0')}`,
      }),
      201,
    );
  }

  async function newContract(room, startDate, initialElectric, initialWater) {
    const first = await newTenant();
    const second = await newTenant();
    const vehicle = ok(
      await call(owner, 'POST', `/tenants/${first.id}/vehicles`, {
        plate: `29A${suffix}${phone}`,
        type: 'motorbike',
      }),
      201,
    );
    const draft = ok(
      await call(owner, 'POST', '/contracts', {
        roomId: room.id,
        startDate,
        endDate: '2043-12-31',
        rent: 3000000,
        depositAmount: 0,
        depositCollected: false,
        depositMethod: 'cash',
        initialElectric,
        initialWater,
        occupantIds: [first.id, second.id],
        primaryTenantId: first.id,
        serviceIds: services.all.map((s) => s.id),
        vehicleIds: [vehicle.id],
      }),
      201,
    );

    return ok(await call(owner, 'POST', `/contracts/${draft.id}/activate`));
  }

  async function saveReadings(rows) {
    const result = ok(
      await call(owner, 'PUT', `/buildings/${building.id}/readings`, {
        rows: rows.map(([meter, period, reading]) => ({
          meterId: meter.id,
          period,
          reading,
          readOn: `${period}-${period.endsWith('-09') || period.endsWith('-11') ? '30' : '31'}`,
          version: 0,
        })),
      }),
    );

    for (const row of result.results) assert.equal(row.error, null, JSON.stringify(row));
    return result.results.map((row) => row.data);
  }

  async function createUser(role, buildingId) {
    const id = randomUUID();
    users += 1;
    const email = `${role}-inv${users}-${suffix.toLowerCase()}@stay.local`;

    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST14',true,:role,'active');
       INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
      {
        replacements: {
          id,
          email,
          role,
          accountId: randomUUID(),
          hash: await bcrypt.hash('invoice-password-123', 10),
        },
      },
    );
    if (buildingId)
      await sequelize.query(
        'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
        { replacements: { id: randomUUID(), buildingId, userId: id } },
      );
    return signIn(email, 'invoice-password-123');
  }

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `I${suffix}`,
        name: `Invoices ${suffix}`,
        readingDay: 31,
        issueDay: 1,
        dueDay: 5,
        roundingUnit: 1000,
        refundUnusedRent: false,
      }),
      201,
    );
    outside = ok(
      await call(owner, 'POST', '/buildings', { code: `O${suffix}`, name: `Outside ${suffix}` }),
      201,
    );

    // rules.md "Toà mặc định" prices, pinned on the building so other suites cannot change them.
    const catalogue = ok(await call(owner, 'GET', '/services')).filter((s) => s.active);
    const pick = (kind, codes, count = 1) =>
      [
        ...codes.map((code) => catalogue.find((s) => s.code === code && s.kind === kind)),
        ...catalogue.filter((s) => s.kind === kind),
      ]
        .filter((s, index, all) => s && all.indexOf(s) === index)
        .slice(0, count);
    const [internet, garbage] = pick('per_room', ['internet', 'garbage'], 2);
    const [common] = pick('per_person', ['common_fee']);
    const [parking] = pick('per_vehicle', ['parking']);
    const [electricity] = pick('electricity', []);
    const [water] = pick('water', []);

    services = {
      electricity,
      water,
      all: [electricity, water, internet, garbage, common, parking],
    };
    for (const [service, price] of [
      [electricity, 3500],
      [water, 20000],
      [internet, 100000],
      [garbage, 30000],
      [common, 50000],
      [parking, 100000],
    ])
      ok(
        await call(owner, 'PUT', `/buildings/${building.id}/prices`, {
          serviceId: service.id,
          effectiveFrom: '2020-01-01',
          price,
        }),
      );

    // A1–A3: the rules.md full-month example. C: missing closing reading. B: move-in 20/11.
    for (const name of ['A1', 'A2', 'A3', 'C']) {
      rooms[name] = await newRoom(1000, 70);
      contracts[name] = await newContract(rooms[name], '2041-09-01', 1000, 70);
    }
    rooms.B = await newRoom(500, 50);
    contracts.B = await newContract(rooms.B, '2041-11-20', 500, 50);
    // F moves from F to G on 15/10: the old-room segment is billed separately in 2041-11.
    rooms.F = await newRoom(100, 10);
    rooms.G = await newRoom(700, 40);
    contracts.F = await newContract(rooms.F, '2041-09-01', 100, 10);

    const rows = [];

    for (const name of ['A1', 'A2', 'A3', 'C'])
      rows.push([rooms[name].electricity, '2041-09', 1130], [rooms[name].water, '2041-09', 80]);
    for (const name of ['A1', 'A2', 'A3'])
      rows.push([rooms[name].electricity, '2041-10', 1250], [rooms[name].water, '2041-10', 88]);
    rows.push([rooms.F.electricity, '2041-09', 250], [rooms.F.water, '2041-09', 15]);
    await saveReadings(rows);
    contracts.F = ok(
      await call(owner, 'POST', `/contracts/${contracts.F.id}/room-change`, {
        version: contracts.F.version,
        effectiveDate: '2041-10-15',
        roomId: rooms.G.id,
        rent: 3000000,
        closingElectric: 300,
        closingWater: 20,
        initialElectric: 700,
        initialWater: 40,
      }),
    ).contract;
    await saveReadings([
      [rooms.G.electricity, '2041-10', 720],
      [rooms.G.water, '2041-10', 42],
      [rooms.B.electricity, '2041-11', 520],
      [rooms.B.water, '2041-11', 52],
    ]);

    managerIn = await createUser('manager', building.id);
    managerOut = await createUser('manager', outside.id);
    tenantCookie = await createUser('tenant');
  });

  after(async () => {
    await sequelize.close();
  });

  test('signed out 401; tenant 403 on writes; manager of another building 404', async () => {
    for (const [method, path] of [
      ['GET', `/buildings/${building.id}/billing/${PERIOD}/preview`],
      ['POST', `/buildings/${building.id}/billing/${PERIOD}/drafts`],
      ['GET', '/invoices'],
      ['GET', `/invoices/${randomUUID()}`],
      ['POST', `/invoices/${randomUUID()}/lines`],
      ['DELETE', `/invoices/${randomUUID()}/lines/${randomUUID()}`],
      ['POST', '/invoices/issue'],
      ['POST', `/invoices/${randomUUID()}/void`],
      ['POST', `/contracts/${contracts.A1.id}/move-in-invoice`],
    ])
      assert.equal(
        (await call(undefined, method, path, method === 'GET' ? undefined : {})).status,
        401,
        `${method} ${path}`,
      );
    failed(await drafts(PERIOD, randomUUID(), tenantCookie), 403);
    failed(await call(tenantCookie, 'POST', '/invoices/issue', { ids: [randomUUID()] }), 403);
    assert.deepEqual(ok(await call(tenantCookie, 'GET', '/invoices')), []);
    failed(await preview(PERIOD, managerOut), 404);
    failed(await drafts(PERIOD, randomUUID(), managerOut), 404);
    failed(await call(managerOut, 'GET', `/invoices?buildingId=${building.id}`), 404);
    failed(await call(managerOut, 'POST', `/contracts/${contracts.A1.id}/move-in-invoice`), 404);
    ok(await preview(PERIOD, managerIn));
    failed(await drafts(PERIOD, 'short'), 400);
    failed(await call(owner, 'POST', `/buildings/${building.id}/billing/2041-13/drafts`), 400);
  });

  test('activation creates the rules.md move-in draft (20/11: 11/30, no utilities)', async () => {
    const list = ok(
      await call(owner, 'GET', `/invoices?contractId=${contracts.B.id}&kind=move_in`),
    );

    assert.equal(list.length, 1);
    const invoice = await detail(list[0].id);

    assert.equal(invoice.status, 'draft');
    assert.equal(invoice.code, null);
    assert.equal(invoice.period, PERIOD);
    assert.equal(invoice.total, 1221000);
    assert.equal(invoice.rounding, -1);
    assert.equal(sum(invoice.lines), invoice.total);
    assert.deepEqual(
      invoice.lines.filter((l) => l.type !== 'rounding').map((l) => [l.ratioNum, l.ratioDen]),
      Array(5).fill([11, 30]),
    );
    assert.equal(
      invoice.lines.some((l) => l.type === 'electricity' || l.type === 'water'),
      false,
    );
    failed(
      await call(owner, 'POST', `/contracts/${contracts.B.id}/move-in-invoice`),
      409,
      'move_in_invoice_exists',
    );
  });

  test('preview: eligible totals, missing reading and move-in exclusions', async () => {
    const data = ok(await preview(PERIOD));

    assert.equal(data.utilityPeriod, '2041-10');
    assert.equal(data.issueDate, '2041-11-01');
    assert.equal(data.dueDate, '2041-11-05');
    for (const name of ['A1', 'A2', 'A3']) {
      const row = rowOf(data, name);

      assert.equal(row.eligible, true, JSON.stringify(row));
      assert.equal(row.total, 3910000);
      assert.equal(row.roomCode, rooms[name].code);
    }
    assert.equal(rowOf(data, 'F').total, 3715000);
    assert.deepEqual(
      { reason: rowOf(data, 'C').reason, eligible: rowOf(data, 'C').eligible },
      { reason: 'missing_reading', eligible: false },
    );
    assert.equal(rowOf(data, 'C').reasonDetail.period, '2041-10');
    assert.equal(rowOf(data, 'B').reason, 'move_in_invoice');
    assert.equal(data.eligibleCount, 4);
    assert.equal(data.expectedTotal, 3 * 3910000 + 3715000);
    assert.equal(
      await InvoiceModel.count({
        where: { buildingId: building.id, period: PERIOD, kind: 'monthly' },
      }),
      0,
    );
  });

  test('drafts: the same key twice (also concurrently) never duplicates', async () => {
    const key = randomUUID();
    const first = ok(await drafts(PERIOD, key));

    assert.deepEqual([first.created, first.refreshed, first.replayed], [4, 0, false]);
    const again = ok(await drafts(PERIOD, key));

    assert.deepEqual([again.created, again.refreshed, again.replayed], [4, 0, true]);
    const parallelKey = randomUUID();
    const parallel = (
      await Promise.all([drafts(PERIOD, parallelKey), drafts(PERIOD, parallelKey)])
    ).map((result) => ok(result));

    assert.deepEqual(parallel.map((r) => r.replayed).sort(), [false, true]);
    assert.deepEqual(
      parallel.map((r) => r.refreshed),
      [4, 4],
    );
    for (const name of ['A1', 'A2', 'A3', 'F']) assert.equal((await monthly(name)).length, 1);
    assert.equal((await monthly('C')).length, 0);
    assert.equal((await monthly('B')).length, 0);
    assert.ok(rowOf(again, 'A1').invoiceId);
  });

  test('rules.md full-month example: 3.910.000đ with readings snapshot; sum(lines) = total', async () => {
    const invoice = await detail((await current('A1')).id);

    assert.equal(invoice.kind, 'monthly');
    assert.equal(invoice.total, 3910000);
    assert.equal(invoice.rounding, 0);
    assert.equal(sum(invoice.lines), invoice.total);
    assert.deepEqual(
      invoice.lines.map((l) => l.type),
      ['rent', 'service', 'service', 'service', 'service', 'electricity', 'water'],
    );
    assert.deepEqual(
      invoice.lines
        .filter((l) => l.type === 'service')
        .map((l) => l.amount)
        .sort((a, b) => a - b),
      [30000, 100000, 100000, 100000],
    );
    assert.deepEqual(
      invoice.lines.filter((l) => l.type !== 'service').map((l) => l.amount),
      [3000000, 420000, 160000],
    );
    const power = invoice.lines.find((l) => l.type === 'electricity');

    assert.deepEqual(
      [
        power.period,
        power.quantity,
        power.unitPrice,
        power.meta.startReading,
        power.meta.endReading,
      ],
      ['2041-10', 120, 3500, 1130, 1250],
    );
    assert.equal(invoice.lines.find((l) => l.type === 'rent').ratioDen, 30);
  });

  test('room change: the old room segment is a separate line in the next period', async () => {
    const invoice = await detail((await current('F')).id);
    const power = invoice.lines.filter((l) => l.type === 'electricity');
    const water = invoice.lines.filter((l) => l.type === 'water');

    assert.equal(invoice.roomId, rooms.G.id);
    assert.deepEqual(
      power.map((l) => [l.quantity, l.amount, l.meta.roomId ?? null]),
      [
        [50, 175000, rooms.F.id],
        [20, 70000, null],
      ],
    );
    assert.ok(power[0].meta.sourceEventId);
    assert.deepEqual(
      water.map((l) => [l.quantity, l.amount]),
      [
        [5, 100000],
        [2, 40000],
      ],
    );
    assert.equal(invoice.total, 3715000);
    assert.equal(sum(invoice.lines), invoice.total);
  });

  test('manual surcharge/discount on drafts only; kept across refresh', async () => {
    const draft = await current('F');
    const added = ok(
      await call(owner, 'POST', `/invoices/${draft.id}/lines`, {
        type: 'surcharge',
        amount: 1234,
        reason: 'Đền ghế hỏng',
      }),
      201,
    );

    assert.equal(added.total, 3716000);
    assert.equal(added.rounding, -234);
    assert.equal(sum(added.lines), added.total);
    const manual = added.lines.find((l) => l.manual);

    assert.equal(manual.amount, 1234);
    failed(
      await call(owner, 'POST', `/invoices/${draft.id}/lines`, {
        type: 'discount',
        amount: 0,
        reason: 'x',
      }),
      400,
    );
    failed(
      await call(owner, 'POST', `/invoices/${draft.id}/lines`, {
        type: 'discount',
        amount: 1000,
        reason: 'Giảm',
        version: added.version - 1,
      }),
      409,
      'version_conflict',
    );
    const refreshed = ok(await drafts(PERIOD, randomUUID()));

    assert.equal(rowOf(refreshed, 'F').total, 3716000);
    const kept = await detail(draft.id);

    assert.equal(kept.lines.filter((l) => l.manual).length, 1);
    assert.equal(kept.total, 3716000);
    assert.equal(sum(kept.lines), kept.total);
    failed(
      await call(owner, 'DELETE', `/invoices/${draft.id}/lines/${kept.lines[0].id}`),
      409,
      'invoice_line_not_manual',
    );
    const removed = ok(
      await call(
        owner,
        'DELETE',
        `/invoices/${draft.id}/lines/${kept.lines.find((l) => l.manual).id}`,
      ),
    );

    assert.equal(removed.total, 3715000);
    assert.equal(sum(removed.lines), removed.total);
    const discounted = ok(
      await call(managerIn, 'POST', `/invoices/${draft.id}/lines`, {
        type: 'discount',
        amount: 15000,
        reason: 'Giảm tháng đầu',
      }),
      201,
    );

    assert.equal(discounted.total, 3700000);
    assert.equal(discounted.lines.find((l) => l.manual).amount, -15000);
  });

  test('concurrent issue assigns unique codes and locks the readings', async () => {
    const ids = await Promise.all(['A1', 'A2', 'A3'].map(async (name) => (await current(name)).id));
    const results = await Promise.all(
      ids.map((id) => call(owner, 'POST', '/invoices/issue', { ids: [id] })),
    );
    const codes = results.map((result) => ok(result).invoices[0].code);

    assert.equal(new Set(codes).size, 3);
    assert.deepEqual(codes.map((code) => code.replace(`${building.code}-204111-`, '')).sort(), [
      '001',
      '002',
      '003',
    ]);
    const issued = await detail(ids[0]);

    assert.equal(issued.status, 'issued');
    assert.equal(issued.issuedOn, '2041-11-01');
    assert.equal(issued.dueOn, '2041-11-05');
    assert.equal(issued.remaining, issued.total);
    failed(
      await call(owner, 'POST', '/invoices/issue', { ids: [ids[0]] }),
      409,
      'invoice_not_draft',
    );
    failed(
      await call(owner, 'POST', `/invoices/${ids[0]}/lines`, {
        type: 'surcharge',
        amount: 1000,
        reason: 'late',
      }),
      409,
      'invoice_not_draft',
    );
    const locked = await MeterReadingModel.findAll({
      where: { meterId: [rooms.A1.electricity.id, rooms.A1.water.id] },
    });

    assert.equal(locked.length, 4);
    assert.ok(locked.every((reading) => reading.status === 'locked'));
    const closing = locked.find(
      (r) => r.period === '2041-10' && r.meterId === rooms.A1.electricity.id,
    );

    failed(
      await call(owner, 'PUT', `/readings/${closing.id}`, {
        meterId: rooms.A1.electricity.id,
        period: '2041-10',
        reading: 1260,
        readOn: '2041-10-31',
        version: closing.version,
      }),
      409,
    );
    const again = ok(await preview(PERIOD));

    assert.equal(rowOf(again, 'A1').reason, 'already_issued');
    assert.equal(rowOf(again, 'A1').total, 3910000);
    const refreshed = ok(await drafts(PERIOD, randomUUID()));

    assert.equal(refreshed.refreshed, 1);
    assert.equal((await detail(ids[0])).version, issued.version);
    const listed = ok(
      await call(
        owner,
        'GET',
        `/invoices?buildingId=${building.id}&period=${PERIOD}&status=issued`,
      ),
    );

    assert.equal(listed.length, 3);
    for (const row of ok(
      await call(owner, 'GET', `/invoices?buildingId=${building.id}&pageSize=100`),
    ))
      assert.equal(sum((await detail(row.id)).lines), row.total, row.id);
  });

  test('move-in invoice codes use the issue date period and are due on the start date', async () => {
    const [moveIn] = ok(
      await call(owner, 'GET', `/invoices?contractId=${contracts.B.id}&kind=move_in`),
    );
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(
      new Date(),
    );
    const [issued] = ok(
      await call(managerIn, 'POST', '/invoices/issue', { ids: [moveIn.id] }),
    ).invoices;

    assert.equal(issued.issuedOn, today);
    assert.equal(issued.dueOn, '2041-11-20');
    assert.match(
      issued.code,
      new RegExp(`^${building.code}-${today.slice(0, 4)}${today.slice(5, 7)}-\\d{3}$`),
    );
    const next = ok(await preview(NEXT));
    const row = rowOf(next, 'B');

    // Utilities 20–30/11 are billed in 2041-12 from the move-in readings.
    assert.equal(row.eligible, true, JSON.stringify(row));
    assert.equal(row.total, 3000000 + 330000 + 20 * 3500 + 2 * 20000);
  });

  test('void: owner only, reason required, unlocks readings and frees the period', async () => {
    const issued = await current('A1');

    failed(await call(managerIn, 'POST', `/invoices/${issued.id}/void`, { reason: 'x' }), 403);
    failed(await call(managerOut, 'GET', `/invoices/${issued.id}`), 404);
    failed(await call(owner, 'POST', `/invoices/${issued.id}/void`, {}), 400);
    const voided = ok(
      await call(owner, 'POST', `/invoices/${issued.id}/void`, { reason: 'Sai chỉ số' }),
    );

    assert.equal(voided.status, 'void');
    assert.equal(voided.voidReason, 'Sai chỉ số');
    failed(
      await call(owner, 'POST', `/invoices/${issued.id}/void`, { reason: 'again' }),
      409,
      'invoice_already_void',
    );
    const readings = await MeterReadingModel.findAll({
      where: { meterId: [rooms.A1.electricity.id, rooms.A1.water.id], period: '2041-10' },
    });

    assert.ok(readings.every((reading) => reading.status === 'draft'));
    assert.equal(rowOf(ok(await preview(PERIOD)), 'A1').eligible, true);
    const result = ok(await drafts(PERIOD, randomUUID()));

    assert.equal(result.created, 1);
    const fresh = await current('A1');

    assert.notEqual(fresh.id, issued.id);
    assert.equal(fresh.status, 'draft');
    assert.equal((await monthly('A1')).length, 2);
    const audits = await AuditLogModel.findAll({ where: { resourceId: issued.id } });

    assert.ok(audits.some((row) => row.action === 'invoice.voided'));
    for (const row of audits)
      assert.equal(JSON.stringify(row.changes).includes('Sai chỉ số'), false);
  });

  test('a voided move-in draft can be recreated for an active contract', async () => {
    const [moveIn] = ok(
      await call(owner, 'GET', `/invoices?contractId=${contracts.A3.id}&kind=move_in`),
    );

    ok(await call(owner, 'POST', `/invoices/${moveIn.id}/void`, { reason: 'Nhập lại' }));
    const created = ok(
      await call(owner, 'POST', `/contracts/${contracts.A3.id}/move-in-invoice`),
      201,
    );

    assert.equal(created.kind, 'move_in');
    assert.equal(created.period, '2041-09');
    assert.equal(created.status, 'draft');
    assert.equal(sum(created.lines), created.total);
  });

  test('a building price change after issue leaves the issued invoice unchanged', async () => {
    const issued = await current('A2');
    const before = await detail(issued.id);
    const setPrice = (effectiveFrom) =>
      call(owner, 'PUT', `/buildings/${building.id}/prices`, {
        serviceId: services.electricity.id,
        effectiveFrom,
        price: 4000,
      });

    // A price dated on/before an issued invoice would rewrite what it snapshotted.
    failed(await setPrice('2041-11-01'), 409, 'price_history_locked');
    ok(await setPrice('2041-11-02'));
    const after = await detail(issued.id);

    assert.deepEqual(after, before);
    assert.equal(after.lines.find((l) => l.type === 'electricity').unitPrice, 3500);
    assert.equal(rowOf(ok(await preview(PERIOD)), 'A2').total, 3910000);
    // Later invoices use the new price (B, 2041-12: 20 kWh × 4.000đ).
    assert.equal(
      rowOf(ok(await preview(NEXT)), 'B').total,
      3000000 + 330000 + 20 * 4000 + 2 * 20000,
    );
  });
});
