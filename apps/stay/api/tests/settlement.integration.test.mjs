// ST-17: CI Postgres/API only. This suite never starts infrastructure.
// Each scenario uses its own building (monthly drafts are per building) and new rooms. Settlement
// needs a move-out date not after today, so contracts run in 2025; the rooms' meters are moved
// back to 2020 so that past readings can be recorded.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import {
  AuditLogModel,
  DepositEntryModel,
  InvoiceModel,
  MeterReadingModel,
  PaymentModel,
  sequelize,
} from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 5).toUpperCase();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

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
  return result.body;
}

const sum = (lines) => lines.reduce((total, line) => total + line.amount, 0);
/** `[type, amount]` of each line, in a stable order (service sort order is configurable). */
const amounts = (lines) =>
  lines.map((line) => [line.type, line.amount]).sort((a, b) => a[0].localeCompare(b[0]));
const lastDay = (period) => {
  const [year, month] = period.split('-').map(Number);

  return `${period}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, '0')}`;
};
/** The numbers settle must reproduce from the preview. */
const NUMBERS = ['depositApplied', 'depositRefunded', 'remainingDue', 'ownerRefunds', 'tenantPays'];

describe('ST-17 move-out notice and settlement', { skip: !base }, () => {
  let owner, managerIn, managerOut, tenantCookie;
  let catalogue;
  let roomNumber = 0;
  let phone = 0;
  let users = 0;
  let letters = 0;
  const shared = {};

  const preview = (contract, body, cookie = owner) =>
    call(cookie, 'POST', `/contracts/${contract.id}/settlement-preview`, body);
  const settle = (contract, body, key = randomUUID(), cookie = owner) =>
    call(cookie, 'POST', `/contracts/${contract.id}/settle`, body, { 'Idempotency-Key': key });
  const detail = async (path) => ok(await call(owner, 'GET', path));

  async function createUser(role, buildingId) {
    const id = randomUUID();
    users += 1;
    const email = `${role}-settle${users}-${suffix.toLowerCase()}@stay.local`;

    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST17',true,:role,'active');
       INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
      {
        replacements: {
          id,
          email,
          role,
          accountId: randomUUID(),
          hash: await bcrypt.hash('settle-password-123', 10),
        },
      },
    );
    if (buildingId)
      await sequelize.query(
        'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
        { replacements: { id: randomUUID(), buildingId, userId: id } },
      );
    return signIn(email, 'settle-password-123');
  }

  /**
   * A building with the rules.md default prices pinned (other suites cannot change them). The
   * move-out fee is off unless `options` says otherwise (`{}` follows the system setting).
   */
  async function newBuilding(refundUnusedRent = false, options = { moveOutFee: 0 }) {
    const letter = 'QRSTUVWXJKLMNEFG'[letters++];
    const building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `${letter}${suffix}`,
        name: `Settlement ${letter} ${suffix}`,
        readingDay: 31,
        issueDay: 1,
        dueDay: 5,
        roundingUnit: 1000,
        refundUnusedRent,
        ...options,
      }),
      201,
    );

    for (const [service, price] of [
      [catalogue.electricity, 3500],
      [catalogue.water, 20000],
      [catalogue.internet, 100000],
      [catalogue.garbage, 30000],
      [catalogue.common, 50000],
      [catalogue.parking, 100000],
    ])
      ok(
        await call(owner, 'PUT', `/buildings/${building.id}/prices`, {
          serviceId: service.id,
          effectiveFrom: '2020-01-01',
          price,
        }),
      );
    return building;
  }

  /**
   * Active contract from `startDate` with 2 occupants, 1 vehicle, every service and a collected
   * deposit; the move-in invoice is issued (a draft would block the settlement).
   */
  async function newContract(building, startDate, deposit, { issueMoveIn = true } = {}) {
    const room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `S${++roomNumber}`,
        floor: 1,
        listPrice: 3000000,
        maxOccupants: 3,
        initialElectric: 1000,
        initialWater: 70,
      }),
      201,
    );

    await sequelize.query("UPDATE meters SET installed_on='2020-01-01' WHERE room_id=:id", {
      replacements: { id: room.id },
    });
    const meters = ok(await call(owner, 'GET', `/rooms/${room.id}`)).meters;
    const tenants = [];

    for (let index = 0; index < 2; index += 1) {
      phone += 1;
      tenants.push(
        ok(
          await call(owner, 'POST', '/tenants', {
            buildingId: building.id,
            fullName: `Settlement tenant ${suffix} ${phone}`,
            phone: `07${String(Date.now() % 1_000_000).padStart(6, '0')}${String(phone).padStart(2, '0')}`,
          }),
          201,
        ),
      );
    }
    const vehicle = ok(
      await call(owner, 'POST', `/tenants/${tenants[0].id}/vehicles`, {
        plate: `30S${suffix}${phone}`,
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
        depositAmount: deposit,
        depositCollected: deposit > 0,
        depositMethod: 'cash',
        depositDate: deposit > 0 ? startDate : null,
        initialElectric: 1000,
        initialWater: 70,
        occupantIds: tenants.map((tenant) => tenant.id),
        primaryTenantId: tenants[0].id,
        serviceIds: catalogue.all.map((service) => service.id),
        vehicleIds: [vehicle.id],
      }),
      201,
    );
    const contract = ok(await call(owner, 'POST', `/contracts/${draft.id}/activate`));
    const [moveIn] = ok(
      await call(owner, 'GET', `/invoices?contractId=${contract.id}&kind=move_in`),
    );

    if (issueMoveIn) ok(await call(owner, 'POST', '/invoices/issue', { ids: [moveIn.id] }));
    return {
      building,
      room,
      tenants,
      contract,
      moveIn,
      electricity: meters.find((m) => m.kind === 'electricity'),
      water: meters.find((m) => m.kind === 'water'),
    };
  }

  async function closing(setup, period, electricity, water) {
    const result = ok(
      await call(owner, 'PUT', `/buildings/${setup.building.id}/readings`, {
        rows: [
          [setup.electricity, electricity],
          [setup.water, water],
        ].map(([meter, reading]) => ({
          meterId: meter.id,
          period,
          reading,
          readOn: lastDay(period),
          version: 0,
          confirmHighConsumption: true,
        })),
      }),
    );

    for (const row of result.results) assert.equal(row.error, null, JSON.stringify(row));
  }

  /** Drafts and issues the monthly invoice of `period` for the building's contracts. */
  async function monthly(setup, period) {
    ok(
      await call(
        owner,
        'POST',
        `/buildings/${setup.building.id}/billing/${period}/drafts`,
        undefined,
        {
          'Idempotency-Key': randomUUID(),
        },
      ),
    );
    const [draft] = ok(
      await call(
        owner,
        'GET',
        `/invoices?contractId=${setup.contract.id}&kind=monthly&period=${period}`,
      ),
    );

    assert.ok(draft, `monthly ${period}`);
    const [issued] = ok(await call(owner, 'POST', '/invoices/issue', { ids: [draft.id] })).invoices;

    return issued;
  }

  async function payInFull(invoiceId) {
    const invoice = await detail(`/invoices/${invoiceId}`);

    if (invoice.remaining > 0)
      ok(
        await call(
          owner,
          'POST',
          `/invoices/${invoiceId}/payments`,
          { amount: invoice.remaining, method: 'cash', paidOn: today },
          { 'Idempotency-Key': randomUUID() },
        ),
        201,
      );
  }

  /** Preview, settle with the same body, and check settle reproduced every preview number. */
  async function previewAndSettle(setup, body, key = randomUUID()) {
    const computed = ok(await preview(setup.contract, body));
    const current = await detail(`/contracts/${setup.contract.id}`);
    const result = ok(await settle(setup.contract, { ...body, version: current.version }, key));

    for (const field of NUMBERS) assert.equal(result[field], computed[field], field);
    assert.equal(result.invoice.kind, 'settlement');
    assert.equal(result.invoice.status === 'draft', false);
    assert.equal(result.invoice.total, computed.total);
    assert.equal(result.invoice.subtotal, computed.subtotal);
    assert.equal(result.invoice.rounding, computed.rounding);
    assert.deepEqual(
      result.invoice.lines.map((line) => [line.type, line.amount]),
      computed.lines.map((line) => [line.type, line.amount]),
    );
    assert.equal(sum(result.invoice.lines), result.invoice.total);
    assert.equal(result.contract.status, 'ended');
    assert.equal(result.contract.movedOutAt, body.moveOutDate);
    assert.equal(result.contract.settlementInvoiceId, result.invoice.id);
    assert.equal(result.replayed, false);
    // Net: ownerRefunds − tenantPays = deposit held − amount due (rules.md step 6).
    assert.equal(
      computed.ownerRefunds - computed.tenantPays,
      computed.depositHeld - computed.amountDue,
    );
    return { computed, result };
  }

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    const services = ok(await call(owner, 'GET', '/services')).filter((s) => s.active);
    const pick = (kind, codes, count = 1) =>
      [
        ...codes.map((code) => services.find((s) => s.code === code && s.kind === kind)),
        ...services.filter((s) => s.kind === kind),
      ]
        .filter((s, index, all) => s && all.indexOf(s) === index)
        .slice(0, count);
    const [internet, garbage] = pick('per_room', ['internet', 'garbage'], 2);
    const [common] = pick('per_person', ['common_fee']);
    const [parking] = pick('per_vehicle', ['parking']);
    const [electricity] = pick('electricity', []);
    const [water] = pick('water', []);

    catalogue = {
      electricity,
      water,
      internet,
      garbage,
      common,
      parking,
      all: [electricity, water, internet, garbage, common, parking],
    };
    shared.building = await newBuilding(false);
    shared.outside = await newBuilding(false);
    managerIn = await createUser('manager', shared.building.id);
    managerOut = await createUser('manager', shared.outside.id);
    tenantCookie = await createUser('tenant');
  });

  after(async () => {
    await sequelize.close();
  });

  test('signed out 401; tenant 403; manager of another building 404; settle is owner only', async () => {
    const setup = await newContract(shared.building, '2025-01-01', 1000000);
    const { contract } = setup;
    const body = { moveOutDate: '2025-01-31', finalElectric: 1010, finalWater: 71 };

    for (const path of ['notice', 'cancel-notice', 'settlement-preview', 'settle'])
      failed(await call(undefined, 'POST', `/contracts/${contract.id}/${path}`, {}), 401);
    failed(await preview(contract, body, tenantCookie), 404);
    failed(await settle(contract, { ...body, version: 1 }, randomUUID(), tenantCookie), 403);
    failed(await preview(contract, body, managerOut), 404);
    failed(
      await call(managerOut, 'POST', `/contracts/${contract.id}/notice`, {
        version: contract.version,
        expectedMoveOutDate: today,
      }),
      404,
    );
    // `settle` stays with the owner (CASL kit): even the building's manager gets 403.
    failed(
      await settle(contract, { ...body, version: contract.version }, randomUUID(), managerIn),
      403,
    );
    failed(
      await settle(contract, { ...body, version: contract.version }, randomUUID(), managerOut),
      403,
    );
    // The assigned manager previews the same numbers as the owner.
    assert.deepEqual(
      ok(await preview(contract, body, managerIn)),
      ok(await preview(contract, body)),
    );
    failed(await settle(contract, { ...body, version: contract.version }, ''), 400);
  });

  test('notice: date rules, active → ending, cancel and renew back to active, events + audit', async () => {
    const setup = await newContract(shared.building, '2025-02-01', 0);
    let contract = setup.contract;
    const notice = (body) => call(owner, 'POST', `/contracts/${contract.id}/notice`, body);

    failed(await notice({ version: contract.version, expectedMoveOutDate: '2025-01-01' }), 400);
    failed(await notice({ version: contract.version, expectedMoveOutDate: '2044-01-01' }), 400);
    failed(await notice({ version: contract.version, expectedMoveOutDate: 'tomorrow' }), 400);
    failed(
      await call(owner, 'POST', `/contracts/${contract.id}/cancel-notice`, {
        version: contract.version,
      }),
      409,
      'contract_not_ending',
    );
    contract = ok(
      await notice({ version: contract.version, expectedMoveOutDate: today, note: 'Chuyển nhà' }),
    );
    assert.equal(contract.status, 'ending');
    assert.equal(contract.noticeDate, today);
    assert.equal(contract.events[0].type, 'notice');
    assert.equal(contract.events[0].payload.expectedMoveOutDate, today);
    failed(
      await notice({ version: contract.version - 1, expectedMoveOutDate: today }),
      409,
      'version_conflict',
    );
    const audit = await AuditLogModel.findOne({
      where: { action: 'contract.notice', resourceId: contract.id },
    });

    assert.ok(audit);
    assert.equal(
      JSON.stringify(audit.changes).includes('Chuyển nhà'),
      false,
      'no free text in audit',
    );
    contract = ok(
      await call(owner, 'POST', `/contracts/${contract.id}/cancel-notice`, {
        version: contract.version,
      }),
    );
    assert.equal(contract.status, 'active');
    assert.equal(contract.noticeDate, null);
    contract = ok(await notice({ version: contract.version, expectedMoveOutDate: today }));
    contract = ok(
      await call(owner, 'POST', `/contracts/${contract.id}/renew`, {
        version: contract.version,
        effectiveDate: today,
        endDate: '2044-12-31',
      }),
    ).contract;
    assert.equal(contract.status, 'active');
    assert.equal(contract.noticeDate, null);
  });

  test('move-out at month end: final utilities only; deposit larger → owner refunds X', async () => {
    const building = await newBuilding(false);
    const setup = await newContract(building, '2025-01-01', 5000000);

    await closing(setup, '2025-01', 1100, 75);
    const february = await monthly(setup, '2025-02');

    await payInFull(setup.moveIn.id);
    await payInFull(february.id);
    const body = { moveOutDate: '2025-02-28', finalElectric: 1150, finalWater: 78 };
    const { computed, result } = await previewAndSettle(setup, body);

    // (1150 − 1100) × 3.500 + (78 − 75) × 20.000; February rent was prepaid, nothing refunded.
    assert.deepEqual(amounts(computed.lines), [
      ['electricity', 175000],
      ['water', 60000],
    ]);
    assert.deepEqual(
      computed.readings
        .map((r) => [r.kind, r.startReading, r.endReading])
        .sort((a, b) => a[0].localeCompare(b[0])),
      [
        ['electricity', 1100, 1150],
        ['water', 75, 78],
      ],
    );
    assert.equal(computed.total, 235000);
    assert.equal(computed.outstandingTotal, 0);
    assert.equal(computed.depositHeld, 5000000);
    assert.equal(computed.depositApplied, 235000);
    assert.equal(computed.depositRefunded, 4765000);
    assert.equal(computed.ownerRefunds, 4765000);
    assert.equal(computed.tenantPays, 0);
    assert.equal(result.invoice.status, 'paid');
    assert.equal(result.invoice.payments[0].method, 'deposit');
    // Settlement codes use the period of the issue date (today).
    assert.match(
      result.invoice.code,
      new RegExp(`^${building.code}-${today.slice(0, 7).replace('-', '')}-\\d{3}$`),
    );
    const entries = await DepositEntryModel.findAll({ where: { contractId: setup.contract.id } });

    assert.deepEqual(
      entries
        .map((entry) => [entry.type, entry.amount, entry.invoiceId])
        .sort((a, b) => a[0].localeCompare(b[0])),
      [
        ['applied', 235000, result.invoice.id],
        ['received', 5000000, null],
        ['refunded', 4765000, null],
      ],
    );
    assert.equal(
      ok(await call(owner, 'GET', `/contracts/${setup.contract.id}/deposits`)).balance.held,
      0,
    );
    // The final utilities start from the January closing, which stays locked.
    const january = await MeterReadingModel.findAll({
      where: { meterId: [setup.electricity.id, setup.water.id], period: '2025-01' },
    });

    assert.ok(january.every((reading) => reading.status === 'locked'));
    shared.monthEnd = { setup, body, result };
  });

  test('after settling: room vacant, tenants have no current room, registrations end on D + 1', async () => {
    const { setup, result } = shared.monthEnd;
    const room = await detail(`/rooms/${setup.room.id}`);

    assert.equal(room.status, 'vacant');
    assert.equal(room.contract, null);
    for (const tenant of setup.tenants) {
      const profile = await detail(`/tenants/${tenant.id}`);

      assert.equal(profile.status, 'left');
      assert.equal(profile.currentRoom, null);
    }
    const contract = await detail(`/contracts/${setup.contract.id}`);

    assert.equal(contract.status, 'ended');
    assert.ok(contract.occupants.every((o) => o.toDate === '2025-03-01'));
    assert.ok(contract.services.every((s) => s.toDate === '2025-03-01'));
    assert.ok(contract.vehicles.every((v) => v.toDate === '2025-03-01'));
    assert.equal(contract.events[0].type, 'ended');
    assert.equal(contract.events[0].payload.invoiceId, result.invoice.id);
    assert.ok(
      await AuditLogModel.findOne({
        where: { action: 'contract.settled', resourceId: contract.id },
      }),
    );
    // Ended contracts are final.
    failed(await preview(setup.contract, shared.monthEnd.body), 409, 'contract_not_active');
    failed(
      await call(owner, 'POST', `/contracts/${contract.id}/notice`, {
        version: contract.version,
        expectedMoveOutDate: today,
      }),
      409,
      'contract_not_active',
    );
    // A settlement invoice and its deposit payments are never reopened.
    failed(
      await call(owner, 'POST', `/invoices/${result.invoice.id}/void`, { reason: 'Sai' }),
      409,
      'settlement_invoice_not_voidable',
    );
    failed(
      await call(owner, 'POST', `/payments/${result.invoice.payments[0].id}/reverse`, {
        reason: 'Sai',
      }),
      409,
      'deposit_payment_not_reversible',
    );
  });

  test('idempotent retry: the same key replays; another body with it is a conflict', async () => {
    const { setup, body, result } = shared.monthEnd;
    const building = await newBuilding(false);
    const fresh = await newContract(building, '2025-01-01', 1000000);

    await closing(fresh, '2025-01', 1100, 75);
    await payInFull(fresh.moveIn.id);
    const key = randomUUID();
    const input = {
      moveOutDate: '2025-01-31',
      finalElectric: 1100,
      finalWater: 75,
      version: fresh.contract.version,
    };
    const [first, second] = await Promise.all([
      settle(fresh.contract, input, key),
      settle(fresh.contract, input, key),
    ]);
    const firstData = ok(first);
    const secondData = ok(second);

    assert.equal(firstData.invoice.id, secondData.invoice.id);
    assert.deepEqual(
      [firstData.replayed, secondData.replayed].sort(),
      [false, true],
      'one run, one replay',
    );
    const third = ok(await settle(fresh.contract, input, key));

    assert.equal(third.replayed, true);
    assert.equal(third.ownerRefunds, firstData.ownerRefunds);
    assert.equal(
      await InvoiceModel.count({ where: { contractId: fresh.contract.id, kind: 'settlement' } }),
      1,
    );
    assert.equal(
      await DepositEntryModel.count({ where: { contractId: fresh.contract.id, type: 'refunded' } }),
      1,
    );
    failed(
      await settle(fresh.contract, { ...input, finalWater: 76 }, key),
      409,
      'idempotency_conflict',
    );
    // The month-end contract is already ended: a new key is refused, not settled twice.
    failed(
      await settle(setup.contract, { ...body, version: result.contract.version }, randomUUID()),
      409,
      'contract_not_active',
    );
  });

  test('mid-month without unused-rent refund: utilities + surcharge, nothing refunded', async () => {
    const building = await newBuilding(false);
    const setup = await newContract(building, '2025-03-01', 3000000);

    await closing(setup, '2025-03', 1100, 75);
    const april = await monthly(setup, '2025-04');

    await payInFull(setup.moveIn.id);
    await payInFull(april.id);
    const body = {
      moveOutDate: '2025-04-20',
      finalElectric: 1140,
      finalWater: 77,
      surcharges: [{ amount: 150000, reason: 'Dọn dẹp phòng' }],
    };
    const { computed, result } = await previewAndSettle(setup, body);

    assert.equal(computed.refundUnusedRent, false);
    assert.deepEqual(amounts(computed.lines), [
      ['electricity', 140000],
      ['surcharge', 150000],
      ['water', 40000],
    ]);
    assert.equal(computed.refundTotal, 0);
    assert.equal(computed.surchargeTotal, 150000);
    assert.equal(computed.total, 330000);
    assert.equal(computed.ownerRefunds, 2670000);
    assert.equal(
      result.invoice.lines.find((l) => l.type === 'surcharge').meta.reason,
      'Dọn dẹp phòng',
    );
  });

  test('mid-month with unused-rent refund: 21–30/04 (10/30) of every prepaid line', async () => {
    const building = await newBuilding(true);
    const setup = await newContract(building, '2025-03-01', 3000000);

    await closing(setup, '2025-03', 1100, 75);
    const april = await monthly(setup, '2025-04');

    await payInFull(setup.moveIn.id);
    await payInFull(april.id);
    const { computed, result } = await previewAndSettle(setup, {
      moveOutDate: '2025-04-20',
      finalElectric: 1140,
      finalWater: 77,
    });
    const refunds = computed.lines.filter((line) => line.type === 'refund');

    assert.equal(computed.refundUnusedRent, true);
    assert.equal(refunds.length, 5, 'rent + 4 services');
    assert.ok(refunds.every((line) => line.ratioNum === 10 && line.ratioDen === 30));
    assert.ok(refunds.every((line) => line.meta.sourceInvoiceId === april.id));
    assert.equal(
      refunds.find((line) => line.description.key === 'invoiceLine.refundRent').amount,
      -1000000,
    );
    assert.equal(computed.refundTotal, sum(refunds));
    assert.equal(computed.utilitiesTotal, 180000);
    // Refunds exceed the charges: a negative invoice, the whole deposit goes back plus the credit.
    assert.ok(computed.total < 0);
    assert.equal(Math.abs(computed.total % 1000), 0);
    assert.equal(computed.depositApplied, 0);
    assert.equal(computed.depositRefunded, 3000000);
    assert.equal(computed.ownerRefunds, 3000000 - computed.total);
    assert.equal(result.invoice.status, 'paid');
    assert.equal(result.invoice.paidTotal, 0);
  });

  test('deposit smaller than the amount due: tenant pays Y, left due on the settlement invoice', async () => {
    const building = await newBuilding(false);
    const setup = await newContract(building, '2025-05-01', 100000);

    await closing(setup, '2025-05', 1100, 75);
    const june = await monthly(setup, '2025-06');

    await payInFull(setup.moveIn.id);
    await payInFull(june.id);
    const { computed, result } = await previewAndSettle(setup, {
      moveOutDate: '2025-06-30',
      finalElectric: 1200,
      finalWater: 80,
      surcharges: [
        { amount: 500000, reason: 'Sơn lại tường' },
        { amount: 100000, reason: 'Dọn dẹp' },
      ],
    });

    // 100 × 3.500 + 5 × 20.000 + 600.000
    assert.equal(computed.total, 1050000);
    assert.equal(computed.depositApplied, 100000);
    assert.equal(computed.settlementDepositApplied, 100000);
    assert.equal(computed.depositRefunded, 0);
    assert.equal(computed.tenantPays, 950000);
    assert.equal(computed.remainingDue, 950000);
    assert.equal(result.invoice.status, 'partially_paid');
    assert.equal(result.invoice.paidTotal, 100000);
    assert.equal(result.invoice.remaining, 950000);
    assert.equal(
      await DepositEntryModel.count({ where: { contractId: setup.contract.id, type: 'refunded' } }),
      0,
    );
  });

  test('two unpaid previous periods: payments land on the original invoices', async () => {
    const building = await newBuilding(false);
    const setup = await newContract(building, '2025-07-01', 10000000);

    await closing(setup, '2025-07', 1100, 75);
    const august = await monthly(setup, '2025-08');
    const july = await detail(`/invoices/${setup.moveIn.id}`);
    const { computed, result } = await previewAndSettle(setup, {
      moveOutDate: '2025-08-31',
      finalElectric: 1130,
      finalWater: 76,
    });

    assert.deepEqual(
      computed.outstandingInvoices.map((item) => [
        item.invoiceId,
        item.remaining,
        item.depositApplied,
      ]),
      [
        [july.id, july.total, july.total],
        [august.id, august.total, august.total],
      ],
    );
    assert.equal(computed.outstandingTotal, july.total + august.total);
    assert.equal(computed.amountDue, computed.total + july.total + august.total);
    assert.equal(computed.depositApplied, computed.amountDue);
    assert.equal(computed.ownerRefunds, 10000000 - computed.amountDue);
    // Each earlier invoice is paid by its own `deposit` payment; nothing is added as a line.
    for (const invoice of [july, august]) {
      const after = await detail(`/invoices/${invoice.id}`);

      assert.equal(after.status, 'paid');
      assert.deepEqual(
        after.payments.map((p) => [p.method, p.amount, p.paidOn]),
        [['deposit', invoice.total, today]],
      );
    }
    assert.equal(
      result.invoice.lines.some((line) => line.type === 'adjustment'),
      false,
    );
    const applied = await DepositEntryModel.findAll({
      where: { contractId: setup.contract.id, type: 'applied' },
    });

    assert.deepEqual(
      applied.map((entry) => entry.invoiceId).sort(),
      [july.id, august.id, result.invoice.id].sort(),
    );
    assert.equal(
      await PaymentModel.count({ where: { invoiceId: result.invoice.id, method: 'deposit' } }),
      1,
    );
  });

  test('a draft invoice blocks preview and settle (409 with the drafts)', async () => {
    const building = await newBuilding(false);
    const setup = await newContract(building, '2025-09-01', 1000000, { issueMoveIn: false });
    const body = { moveOutDate: '2025-09-30', finalElectric: 1010, finalWater: 71 };
    const refused = failed(await preview(setup.contract, body), 409, 'contract_has_draft_invoices');

    assert.deepEqual(refused.extensions.invoices, [
      { invoiceId: setup.moveIn.id, kind: 'move_in', period: '2025-09' },
    ]);
    failed(
      await settle(setup.contract, { ...body, version: setup.contract.version }),
      409,
      'contract_has_draft_invoices',
    );
    assert.equal((await detail(`/contracts/${setup.contract.id}`)).status, 'active');
  });

  test('move-out fee: system default, building override, 0 off, editable/removable, deposit offset', async () => {
    const system = ok(await call(owner, 'GET', '/settings'));

    assert.equal(system.moveOutFee, 300000, 'migration default');
    const defaulted = await newBuilding(false, {});
    const overridden = await newBuilding(false, { moveOutFee: 450000 });
    const disabled = await newBuilding(false, { moveOutFee: 0 });

    assert.equal(defaulted.moveOutFee, null);
    assert.equal((await detail(`/buildings/${defaulted.id}`)).billing.moveOutFee, 300000);
    assert.equal((await detail(`/buildings/${overridden.id}`)).billing.moveOutFee, 450000);
    failed(
      await call(owner, 'POST', '/buildings', {
        code: `Z${suffix}`,
        name: `Settlement fee ${suffix}`,
        moveOutFee: -1,
      }),
      400,
    );

    const setup = await newContract(defaulted, '2025-01-01', 5000000);

    await closing(setup, '2025-01', 1100, 75);
    const february = await monthly(setup, '2025-02');

    await payInFull(setup.moveIn.id);
    await payInFull(february.id);
    const body = { moveOutDate: '2025-02-28', finalElectric: 1150, finalWater: 78 };
    const fee = (preview) => preview.lines.filter((line) => line.type === 'surcharge');

    // Removed by the owner: an explicit empty list adds nothing.
    const removed = ok(await preview(setup.contract, { ...body, surcharges: [] }));

    assert.deepEqual(fee(removed), []);
    assert.equal(removed.moveOutFee, 300000);
    // Edited by the owner: the amount and reason sent are used as is.
    const edited = ok(
      await preview(setup.contract, {
        ...body,
        surcharges: [{ amount: 200000, reason: 'Khấu hao (đã giảm)' }],
      }),
    );

    assert.deepEqual(
      fee(edited).map((line) => [line.amount, line.meta.reason]),
      [[200000, 'Khấu hao (đã giảm)']],
    );

    // Omitted: the system default (300.000đ) is added and offset against the deposit.
    const { computed, result } = await previewAndSettle(setup, body);

    assert.deepEqual(
      fee(computed).map((line) => [line.amount, line.meta.reason, line.description.params.reason]),
      [[300000, 'Khấu hao cơ sở vật chất', 'Khấu hao cơ sở vật chất']],
    );
    assert.equal(computed.surchargeTotal, 300000);
    // 175.000 electricity + 60.000 water + 300.000 depreciation.
    assert.equal(computed.total, 535000);
    assert.equal(computed.depositApplied, 535000);
    assert.equal(computed.depositRefunded, 4465000);
    assert.equal(computed.ownerRefunds, 4465000);
    assert.equal(result.invoice.status, 'paid');
    // Snapshot: changing the system default later does not touch the issued line.
    const settings = ok(await call(owner, 'GET', '/settings'));

    ok(await call(owner, 'PUT', '/settings', { ...settings, moveOutFee: 123000 }));
    try {
      const stored = await detail(`/invoices/${result.invoice.id}`);

      assert.deepEqual(
        stored.lines.filter((line) => line.type === 'surcharge').map((line) => line.amount),
        [300000],
      );
    } finally {
      const current = ok(await call(owner, 'GET', '/settings'));

      ok(await call(owner, 'PUT', '/settings', { ...current, moveOutFee: settings.moveOutFee }));
    }

    // Building override, and 0 disables the line.
    const other = await newContract(overridden, '2025-10-01', 0);
    const overrideBody = { moveOutDate: '2025-10-31', finalElectric: 1010, finalWater: 71 };
    const fromOverride = ok(await preview(other.contract, overrideBody));

    assert.equal(fromOverride.moveOutFee, 450000);
    assert.deepEqual(
      fee(fromOverride).map((line) => line.amount),
      [450000],
    );
    assert.equal(fromOverride.tenantPays, fromOverride.amountDue);
    const off = await newContract(disabled, '2025-10-01', 0);
    const fromDisabled = ok(await preview(off.contract, overrideBody));

    assert.equal(fromDisabled.moveOutFee, 0);
    assert.deepEqual(fee(fromDisabled), []);
    assert.equal(fromDisabled.surchargeTotal, 0);
  });

  test('validation: future move-out, before start, missing or lower readings, surcharge reason', async () => {
    const building = await newBuilding(false);
    const setup = await newContract(building, '2025-10-01', 0);
    const check = async (body, field) => {
      const error = failed(await preview(setup.contract, body), 400);

      assert.ok(error.extensions?.[field], `${field}: ${JSON.stringify(error)}`);
    };
    const base = { moveOutDate: '2025-10-31', finalElectric: 1010, finalWater: 71 };

    await check({ ...base, moveOutDate: '2099-01-01' }, 'moveOutDate');
    await check({ ...base, moveOutDate: '2025-09-30' }, 'moveOutDate');
    await check({ ...base, finalElectric: null }, 'finalElectric');
    await check({ ...base, finalWater: 69 }, 'finalWater');
    await check({ ...base, surcharges: [{ amount: 1000, reason: ' ' }] }, 'surcharges.0.reason');
    await check({ ...base, surcharges: [{ amount: 0, reason: 'x' }] }, 'surcharges.0.amount');
    // Unbilled days (October was invoiced by the move-in, November is not): charged by the day.
    const late = ok(await preview(setup.contract, { ...base, moveOutDate: '2025-11-03' }));
    const rent = late.lines.find((line) => line.type === 'rent');

    assert.equal(rent.period, '2025-11');
    assert.deepEqual([rent.ratioNum, rent.ratioDen, rent.amount], [3, 30, 300000]);
    assert.equal(late.unbilledTotal > 300000, true);
  });
});
