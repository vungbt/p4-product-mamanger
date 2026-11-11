// ST-19: CI Postgres/API only. This suite never starts infrastructure.
// Uses its own new building (exact numbers), new rooms, far-future contracts (2042) and one
// contract starting today (occupancy and cash-basis collection).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 5).toUpperCase();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const thisMonth = today.slice(0, 7);
const TODO_KINDS = [
  'readings',
  'invoices_to_create',
  'draft_invoices',
  'unshared_invoices',
  'overdue_invoices',
  'expiring_contracts',
  'ending_contracts',
];

const shiftMonth = (period, months) => {
  const index = Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1 + months;

  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
};
const lastDay = (period) =>
  new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0))
    .toISOString()
    .slice(0, 10);
const addDays = (date, days) => {
  const value = new Date(`${date}T00:00:00Z`);

  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

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

function failed(result, status) {
  assert.equal(result.status, status, JSON.stringify(result.body));
}

describe('ST-19 overview', { skip: !base }, () => {
  let owner, managerIn, managerOut;
  let building, outside;
  let roomNumber = 0;
  let phone = 0;
  let users = 0;
  /** Far-future fixtures: issued, draft, voided and partially paid move-in invoices. */
  let issued, draft, voided, partial, current;
  /** Period of the 2042 move-in invoices. */
  let period;

  const overview = async (query = '', cookie = owner) =>
    ok(await call(cookie, 'GET', `/buildings/${building.id}/overview${query}`));
  const todo = (data, kind) => data.todos.find((item) => item.kind === kind);
  const pay = (invoiceId, amount) =>
    call(
      owner,
      'POST',
      `/invoices/${invoiceId}/payments`,
      { amount, method: 'cash', paidOn: today },
      { 'Idempotency-Key': randomUUID() },
    );

  async function createUser(role, buildingId) {
    const id = randomUUID();
    users += 1;
    const email = `${role}-overview${users}-${suffix.toLowerCase()}@stay.local`;

    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST19',true,:role,'active');
       INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
      {
        replacements: {
          id,
          email,
          role,
          accountId: randomUUID(),
          hash: await bcrypt.hash('overview-password-123', 10),
        },
      },
    );
    if (buildingId)
      await sequelize.query(
        'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
        { replacements: { id: randomUUID(), buildingId, userId: id } },
      );
    return signIn(email, 'overview-password-123');
  }

  async function createRoom() {
    return ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `O${++roomNumber}`,
        floor: 1,
        listPrice: 3000000,
        maxOccupants: 2,
        initialElectric: 0,
        initialWater: 0,
      }),
      201,
    );
  }

  /** A new room with an active contract; its move-in invoice is issued unless `issue` is false. */
  async function contractInvoice({ issue = true, startDate = '2042-03-01' } = {}) {
    const room = await createRoom();
    phone += 1;
    const tenant = ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: building.id,
        fullName: `Overview tenant ${suffix} ${phone}`,
        phone: `08${String(Date.now() % 1_000_000).padStart(6, '0')}${String(phone).padStart(2, '0')}`,
      }),
      201,
    );
    const contractDraft = ok(
      await call(owner, 'POST', '/contracts', {
        roomId: room.id,
        startDate,
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
    const contract = ok(await call(owner, 'POST', `/contracts/${contractDraft.id}/activate`));
    const [moveIn] = ok(
      await call(owner, 'GET', `/invoices?contractId=${contract.id}&kind=move_in`),
    );
    const invoice = issue
      ? ok(await call(owner, 'POST', '/invoices/issue', { ids: [moveIn.id] })).invoices[0]
      : moveIn;

    assert.ok(invoice.total >= 1000, JSON.stringify(invoice));
    return { room, contract, invoice };
  }

  /** Billed/collected of a period from the invoice list (issued, partially paid, paid). */
  async function listedAmounts(listPeriod) {
    const rows = ok(
      await call(
        owner,
        'GET',
        `/invoices?buildingId=${building.id}&period=${listPeriod}&pageSize=100`,
      ),
    ).filter((row) => ['issued', 'partially_paid', 'paid'].includes(row.status));

    return {
      billed: rows.reduce((sum, row) => sum + row.total, 0),
      collected: rows.reduce((sum, row) => sum + row.paidTotal, 0),
      invoiceCount: rows.length,
    };
  }

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `V${suffix}`,
        name: `Overview ${suffix}`,
        readingDay: 31,
        issueDay: 1,
        dueDay: 5,
        roundingUnit: 1000,
        refundUnusedRent: false,
      }),
      201,
    );
    outside = ok(
      await call(owner, 'POST', '/buildings', { code: `W${suffix}`, name: `Outside ${suffix}` }),
      201,
    );
    managerIn = await createUser('manager', building.id);
    managerOut = await createUser('manager', outside.id);

    issued = await contractInvoice();
    draft = await contractInvoice({ issue: false });
    voided = await contractInvoice();
    partial = await contractInvoice();
    current = await contractInvoice({ startDate: today });
    period = issued.invoice.period;
    ok(await call(owner, 'POST', `/invoices/${voided.invoice.id}/void`, { reason: 'Lập lại' }));
    ok(await pay(partial.invoice.id, 2000), 201);
    // A reversed payment never counts.
    const reversed = ok(await pay(partial.invoice.id, 1000), 201);

    ok(
      await call(owner, 'POST', `/payments/${reversed.payment.id}/reverse`, {
        reason: 'Ghi nhầm',
      }),
    );
    ok(await pay(current.invoice.id, 1000), 201);
  });

  after(async () => {
    await sequelize.close();
  });

  test('signed out 401; manager of another building 404; period validation', async () => {
    const path = `/buildings/${building.id}/overview`;

    failed(await call(undefined, 'GET', path), 401);
    failed(await call(managerOut, 'GET', path), 404);
    failed(await call(owner, 'GET', `/buildings/${randomUUID()}/overview`), 404);
    failed(await call(owner, 'GET', `${path}?period=2042-13`), 400);
    failed(await call(owner, 'GET', `${path}?period=2042-1`), 400);
    failed(await call(owner, 'GET', `${path}?period=abc`), 400);
    failed(await call(owner, 'GET', `${path}?period=1999-12`), 422);
    assert.equal((await overview(`?period=${period}`, managerIn)).buildingId, building.id);
  });

  test('defaults to the current billing period; series and to-dos in order', async () => {
    const data = await overview();

    // Issue day 1: always the current month (a run across midnight of a month end aside).
    assert.ok([thisMonth, shiftMonth(thisMonth, 1)].includes(data.period), data.period);
    assert.equal(data.previousPeriod, shiftMonth(data.period, -1));
    assert.deepEqual(
      data.series.map((point) => point.period),
      [-5, -4, -3, -2, -1, 0].map((offset) => shiftMonth(data.period, offset)),
    );
    assert.deepEqual(
      data.todos.map((item) => item.kind),
      TODO_KINDS,
    );
  });

  test('billed, collected and remaining equal the invoice list; drafts, void and reversals excluded', async () => {
    const data = await overview(`?period=${period}`);
    const listed = await listedAmounts(period);
    const expectedBilled = issued.invoice.total + partial.invoice.total;

    assert.equal(data.period, period);
    assert.equal(data.current.billed, listed.billed);
    assert.equal(data.current.billed, expectedBilled, 'draft and void excluded');
    assert.equal(data.current.collected, listed.collected);
    assert.equal(data.current.collected, 2000, 'the reversed payment is excluded');
    assert.equal(data.current.remaining, expectedBilled - 2000);
    assert.equal(data.current.invoiceCount, 2);
    const all = ok(
      await call(owner, 'GET', `/invoices?buildingId=${building.id}&period=${period}&pageSize=100`),
    );

    assert.equal(all.find((row) => row.id === draft.invoice.id)?.status, 'draft');
    assert.equal(all.find((row) => row.id === voided.invoice.id)?.status, 'void');
    assert.deepEqual(data.series.at(-1), data.current);
    assert.deepEqual(data.series.at(-2), data.previous);
    assert.equal(data.previous.period, shiftMonth(period, -1));

    // The current month: the move-in invoice of the contract starting today.
    const month = await overview(`?period=${current.invoice.period}`);
    const listedMonth = await listedAmounts(current.invoice.period);

    assert.equal(month.current.billed, listedMonth.billed);
    assert.equal(month.current.collected, listedMonth.collected);

    // Cash basis: payments recorded in the calendar month, as the payment ledger totals them.
    const ledger = await call(
      owner,
      'GET',
      `/payments?buildingId=${building.id}&dateFrom=${thisMonth}-01&dateTo=${lastDay(thisMonth)}`,
    );

    assert.equal(ledger.status, 200, JSON.stringify(ledger.body));
    const cash = await overview(`?period=${thisMonth}`);

    assert.equal(cash.collectedInMonth, ledger.body.meta.totalAmount);
    assert.equal(cash.collectedInMonth, 3000);
  });

  test('receivable totals equal the receivables screen; overdue invoices to-do', async () => {
    const path = `/buildings/${building.id}/receivables?pageSize=100`;
    const before = await overview(`?period=${period}`);
    const receivables = await call(owner, 'GET', path);

    assert.equal(before.receivables.totalRemaining, receivables.body.meta.totalRemaining);
    assert.equal(before.receivables.overdueRemaining, receivables.body.meta.overdueRemaining);

    await sequelize.query('UPDATE invoices SET due_on = CAST(:today AS date) - 10 WHERE id = :id', {
      replacements: { id: issued.invoice.id, today },
    });
    const after = await overview(`?period=${period}`);
    const overdue = await call(owner, 'GET', path);
    const item = todo(after, 'overdue_invoices');

    assert.equal(after.receivables.totalRemaining, overdue.body.meta.totalRemaining);
    assert.equal(after.receivables.overdueRemaining, overdue.body.meta.overdueRemaining);
    assert.equal(after.receivables.overdueRemaining, issued.invoice.total);
    assert.equal(after.receivables.overdueInvoiceCount, 1);
    assert.equal(item.count, 1);
    assert.equal(item.amount, issued.invoice.total);
    assert.deepEqual(item.link, { path: '/receivables', query: { bucket: '8_30' } });
  });

  test('invoice to-dos: to create, drafts, without a share link', async () => {
    const data = await overview(`?period=${period}`);

    // The voided contract and today's contract (its move-in invoice is of this month).
    assert.deepEqual(todo(data, 'invoices_to_create'), {
      kind: 'invoices_to_create',
      count: 2,
      total: null,
      amount: null,
      link: { path: '/invoices/run', query: { period } },
    });
    assert.equal(todo(data, 'draft_invoices').count, 1);
    assert.deepEqual(todo(data, 'draft_invoices').link, {
      path: '/invoices',
      query: { period, status: 'draft' },
    });
    const unshared = todo(data, 'unshared_invoices');

    assert.equal(unshared.count, 2);
    assert.deepEqual(unshared.link, { path: '/invoices/share', query: { period } });
    ok(await call(owner, 'POST', `/invoices/${issued.invoice.id}/share`));
    assert.equal(todo(await overview(`?period=${period}`), 'unshared_invoices').count, 1);

    // The next period: no monthly invoice yet for any of the five contracts.
    const next = await overview(`?period=${shiftMonth(period, 1)}`);

    assert.equal(todo(next, 'invoices_to_create').count, 5);
    assert.equal(todo(next, 'draft_invoices').count, 0);
  });

  test('readings to-do counts rooms without both readings of M−1', async () => {
    const readingPeriod = period;
    const nextPeriod = shiftMonth(period, 1);
    const before = todo(await overview(`?period=${nextPeriod}`), 'readings');

    assert.deepEqual(before.link, { path: '/readings', query: { period: readingPeriod } });
    // Every contract started by the end of M−1: the four 2042 ones and today's.
    assert.equal(before.total, 5);
    assert.equal(before.count, 5);

    const grid = ok(
      await call(owner, 'GET', `/buildings/${building.id}/readings?period=${readingPeriod}`),
    );
    const room = grid.rooms.find((candidate) => candidate.roomId === issued.room.id);
    const [electricity, water] = room.meters;
    const input = (meter) => ({
      meterId: meter.meterId,
      period: readingPeriod,
      reading: 150,
      readOn: lastDay(readingPeriod),
      version: 0,
    });
    const saved = ok(
      await call(owner, 'PUT', `/buildings/${building.id}/readings`, {
        rows: [input(electricity)],
      }),
    );

    assert.ok(saved.results[0].data, JSON.stringify(saved));
    assert.equal(
      todo(await overview(`?period=${nextPeriod}`), 'readings').count,
      5,
      'one meter of two is not enough',
    );
    const second = ok(
      await call(owner, 'PUT', `/buildings/${building.id}/readings`, { rows: [input(water)] }),
    );

    assert.ok(second.results[0].data, JSON.stringify(second));
    const after = todo(await overview(`?period=${nextPeriod}`), 'readings');

    assert.equal(after.count, 4);
    assert.equal(after.total, 5);
  });

  test('contracts ending within 30 days and move-out notices', async () => {
    const start = await overview(`?period=${period}`);

    assert.deepEqual(todo(start, 'expiring_contracts').link, {
      path: '/contracts',
      query: { expiring: 'true' },
    });
    assert.deepEqual(todo(start, 'ending_contracts').link, {
      path: '/contracts',
      query: { status: 'ending' },
    });
    assert.equal(todo(start, 'expiring_contracts').count, 0);
    assert.equal(todo(start, 'ending_contracts').count, 0);

    await sequelize.query('UPDATE contracts SET end_date = :endDate WHERE id = :id', {
      replacements: { id: current.contract.id, endDate: addDays(today, 10) },
    });
    await sequelize.query(
      "UPDATE contracts SET status = 'ending', notice_date = :today WHERE id = :id",
      { replacements: { id: partial.contract.id, today } },
    );
    const data = await overview(`?period=${period}`);
    const expiring = ok(
      await call(owner, 'GET', `/contracts?buildingId=${building.id}&expiring=true`),
    );
    const ending = ok(
      await call(owner, 'GET', `/contracts?buildingId=${building.id}&status=ending`),
    );

    assert.equal(todo(data, 'expiring_contracts').count, 1);
    assert.equal(todo(data, 'expiring_contracts').count, expiring.length);
    assert.equal(todo(data, 'ending_contracts').count, 1);
    assert.equal(todo(data, 'ending_contracts').count, ending.length);
  });

  test('rooms by status equal the room map summary; occupancy rate', async () => {
    await createRoom();
    const maintenance = await createRoom();

    ok(
      await call(owner, 'POST', `/rooms/${maintenance.id}/maintenance`, {
        maintenance: true,
        reason: 'Sơn lại',
        version: maintenance.version,
      }),
    );
    const data = await overview(`?period=${thisMonth}`);
    const summary = ok(await call(owner, 'GET', `/buildings/${building.id}/rooms/summary`));

    assert.deepEqual(
      {
        vacant: data.rooms.vacant,
        reserved: data.rooms.reserved,
        occupied: data.rooms.occupied,
        maintenance: data.rooms.maintenance,
      },
      summary.counts,
    );
    assert.deepEqual(data.rooms, {
      vacant: 1,
      reserved: 4,
      occupied: 1,
      maintenance: 1,
      total: 7,
    });
    assert.equal(data.occupancy.date, today);
    assert.equal(data.occupancy.occupied, 1);
    assert.equal(data.occupancy.total, 7);
    assert.equal(data.occupancy.rate, 0.1429);
    // Before today's contract started nothing was occupied.
    assert.equal(data.previousOccupancy.date, lastDay(shiftMonth(thisMonth, -1)));
    assert.equal(data.previousOccupancy.occupied, 0);
  });
});
