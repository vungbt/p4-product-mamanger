// ST-18: CI Postgres/API only. This suite never starts infrastructure.
// Uses its own new building (exact totals), new rooms and far-future contracts (2042).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 5).toUpperCase();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const BUCKETS = ['not_due', '1_7', '8_30', 'over_30'];

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

describe('ST-18 receivables', { skip: !base }, () => {
  let owner, managerIn, managerOut;
  let building, outside;
  let roomNumber = 0;
  let phone = 0;
  let users = 0;

  const receivables = async (query = '', cookie = owner) => {
    const result = await call(cookie, 'GET', `/buildings/${building.id}/receivables${query}`);

    assert.equal(result.status, 200, JSON.stringify(result.body));
    return result.body;
  };
  const rowOf = async (contractId) =>
    (await receivables('?pageSize=100')).data.find((row) => row.contractId === contractId);
  const pay = (invoiceId, amount) =>
    call(
      owner,
      'POST',
      `/invoices/${invoiceId}/payments`,
      { amount, method: 'cash', paidOn: today },
      { 'Idempotency-Key': randomUUID() },
    );
  /** Sum of `total − paid_total` of the building's unpaid invoices, straight from the table. */
  const tableTotals = async () => {
    const [row] = await sequelize.query(
      `SELECT COALESCE(SUM(total - paid_total), 0) AS remaining,
         COALESCE(SUM(total - paid_total) FILTER (WHERE due_on < CAST(:today AS date)), 0) AS overdue,
         COUNT(*) AS count
       FROM invoices
       WHERE building_id = :buildingId AND status IN ('issued', 'partially_paid')
         AND total > paid_total`,
      { replacements: { buildingId: building.id, today }, type: QueryTypes.SELECT },
    );
    return {
      remaining: Number(row.remaining),
      overdue: Number(row.overdue),
      count: Number(row.count),
    };
  };
  /** Moves an invoice's due date `days` before today (Asia/Ho_Chi_Minh). */
  const dueDaysAgo = (invoiceId, days) =>
    sequelize.query('UPDATE invoices SET due_on = CAST(:today AS date) - :days WHERE id = :id', {
      replacements: { id: invoiceId, today, days },
    });

  async function createUser(role, buildingId) {
    const id = randomUUID();
    users += 1;
    const email = `${role}-recv${users}-${suffix.toLowerCase()}@stay.local`;

    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST18',true,:role,'active');
       INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
      {
        replacements: {
          id,
          email,
          role,
          accountId: randomUUID(),
          hash: await bcrypt.hash('receivable-password-123', 10),
        },
      },
    );
    if (buildingId)
      await sequelize.query(
        'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
        { replacements: { id: randomUUID(), buildingId, userId: id } },
      );
    return signIn(email, 'receivable-password-123');
  }

  /** A new room with an active contract; its move-in invoice is issued unless `issue` is false. */
  async function contractInvoice({ issue = true, rent = 3000000 } = {}) {
    const room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `R${++roomNumber}`,
        floor: 1,
        listPrice: rent,
        maxOccupants: 2,
        initialElectric: 0,
        initialWater: 0,
      }),
      201,
    );
    phone += 1;
    const tenant = ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: building.id,
        fullName: `Receivable tenant ${suffix} ${phone}`,
        phone: `07${String(Date.now() % 1_000_000).padStart(6, '0')}${String(phone).padStart(2, '0')}`,
      }),
      201,
    );
    const draft = ok(
      await call(owner, 'POST', '/contracts', {
        roomId: room.id,
        startDate: '2042-03-01',
        endDate: '2043-12-31',
        rent,
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
    const [moveIn] = ok(
      await call(owner, 'GET', `/invoices?contractId=${contract.id}&kind=move_in`),
    );
    const invoice = issue
      ? ok(await call(owner, 'POST', '/invoices/issue', { ids: [moveIn.id] })).invoices[0]
      : moveIn;

    if (issue) assert.equal(invoice.status, 'issued');
    assert.ok(invoice.total >= 1000, JSON.stringify(invoice));
    return { room, tenant, contract, invoice };
  }

  /** `meta` equals the table sums and its buckets add up to the totals. */
  async function assertTotalsMatchTable() {
    const { meta, data } = await receivables('?pageSize=100');
    const expected = await tableTotals();

    assert.equal(meta.totalRemaining, expected.remaining);
    assert.equal(meta.overdueRemaining, expected.overdue);
    assert.equal(meta.invoiceCount, expected.count);
    assert.deepEqual(
      meta.buckets.map((row) => row.bucket),
      BUCKETS,
    );
    assert.equal(
      meta.buckets.reduce((sum, row) => sum + row.remaining, 0),
      expected.remaining,
    );
    assert.equal(
      meta.buckets.reduce((sum, row) => sum + row.count, 0),
      meta.total,
    );
    // Every row fits on this page: the rows add up to the same totals.
    assert.equal(data.length, meta.total);
    assert.equal(
      data.reduce((sum, row) => sum + row.remaining, 0),
      expected.remaining,
    );
    for (const row of data) {
      assert.equal(row.invoiceCount, row.invoices.length);
      assert.equal(
        row.remaining,
        row.invoices.reduce((sum, invoice) => sum + invoice.remaining, 0),
      );
      for (const invoice of row.invoices)
        assert.equal(invoice.remaining, invoice.total - invoice.paidTotal);
    }
    return meta;
  }

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `R${suffix}`,
        name: `Receivables ${suffix}`,
        readingDay: 31,
        issueDay: 1,
        dueDay: 5,
        roundingUnit: 1000,
        refundUnusedRent: false,
      }),
      201,
    );
    outside = ok(
      await call(owner, 'POST', '/buildings', { code: `Q${suffix}`, name: `Outside ${suffix}` }),
      201,
    );
    managerIn = await createUser('manager', building.id);
    managerOut = await createUser('manager', outside.id);
  });

  after(async () => {
    await sequelize.close();
  });

  test('signed out 401; manager of another building 404; assigned manager reads', async () => {
    const { contract } = await contractInvoice();

    failed(await call(undefined, 'GET', `/buildings/${building.id}/receivables`), 401);
    failed(await call(managerOut, 'GET', `/buildings/${building.id}/receivables`), 404);
    failed(await call(owner, 'GET', `/buildings/${randomUUID()}/receivables`), 404);
    failed(await call(owner, 'GET', `/buildings/${building.id}/receivables?bucket=late`), 400);
    failed(await call(owner, 'GET', `/buildings/${building.id}/receivables?sortBy=total`), 400);
    const row = (await receivables('?pageSize=100', managerIn)).data.find(
      (candidate) => candidate.contractId === contract.id,
    );

    assert.ok(row, 'the assigned manager sees the row');
    assert.match(row.representativePhone ?? '', /^0[0-9]{9}$/);
  });

  test('a row: contract, room, representative, unpaid invoices; drafts and void excluded', async () => {
    const issued = await contractInvoice();
    const draft = await contractInvoice({ issue: false });
    const voided = await contractInvoice();

    ok(await call(owner, 'POST', `/invoices/${voided.invoice.id}/void`, { reason: 'Lập lại' }));
    const row = await rowOf(issued.contract.id);

    assert.ok(row, 'issued invoice listed');
    assert.equal(row.contractCode, issued.contract.code);
    assert.equal(row.contractStatus, 'active');
    assert.equal(row.roomId, issued.room.id);
    assert.equal(row.roomCode, issued.room.code);
    assert.equal(row.representativeName, issued.tenant.fullName);
    assert.equal(row.representativePhone, issued.tenant.phone);
    assert.equal(row.invoiceCount, 1);
    assert.equal(row.remaining, issued.invoice.total);
    assert.equal(row.invoices[0].id, issued.invoice.id);
    assert.equal(row.invoices[0].code, issued.invoice.code);
    assert.equal(row.invoices[0].shareExpiresAt, null);
    assert.equal(await rowOf(draft.contract.id), undefined, 'drafts never count');
    assert.equal(await rowOf(voided.contract.id), undefined, 'void never counts');

    // Search by room code, contract code and person.
    for (const q of [issued.room.code, issued.contract.code, issued.tenant.fullName]) {
      const { data } = await receivables(`?pageSize=100&q=${encodeURIComponent(q)}`);

      assert.ok(
        data.some((candidate) => candidate.contractId === issued.contract.id),
        `q=${q}`,
      );
    }
    const none = await receivables(`?q=${encodeURIComponent(`nobody-${suffix}`)}`);

    assert.equal(none.data.length, 0);
    assert.equal(none.meta.totalRemaining, 0);
    assert.equal(none.meta.total, 0);

    // A shared invoice reports the active link's expiry.
    const link = ok(await call(owner, 'POST', `/invoices/${issued.invoice.id}/share`));

    assert.equal((await rowOf(issued.contract.id)).invoices[0].shareExpiresAt, link.expiresAt);
    await assertTotalsMatchTable();
  });

  test('a partial payment reduces the row and totals; paying in full removes it', async () => {
    const { contract, invoice } = await contractInvoice();
    const before = await assertTotalsMatchTable();
    const part = 1000;

    ok(await pay(invoice.id, part), 201);
    const row = await rowOf(contract.id);

    assert.equal(row.remaining, invoice.total - part);
    assert.equal(row.invoices[0].status, 'partially_paid');
    assert.equal(row.invoices[0].paidTotal, part);
    const partial = await assertTotalsMatchTable();

    assert.equal(partial.totalRemaining, before.totalRemaining - part);
    ok(await pay(invoice.id, invoice.total - part), 201);
    assert.equal(await rowOf(contract.id), undefined, 'a paid contract leaves the list');
    const paid = await assertTotalsMatchTable();

    assert.equal(paid.totalRemaining, before.totalRemaining - invoice.total);
    assert.equal(paid.total, before.total - 1);
  });

  test('buckets by the most overdue invoice: 0, 1, 7, 8, 30 and 31 days', async () => {
    const cases = [
      [0, 'not_due'],
      [1, '1_7'],
      [7, '1_7'],
      [8, '8_30'],
      [30, '8_30'],
      [31, 'over_30'],
    ];
    const created = [];

    for (const [days, bucket] of cases) {
      const fixture = await contractInvoice();

      await dueDaysAgo(fixture.invoice.id, days);
      created.push({ ...fixture, days, bucket });
    }
    for (const { contract, invoice, days, bucket } of created) {
      const row = await rowOf(contract.id);

      assert.equal(row.overdueDays, days, `${days} days`);
      assert.equal(row.bucket, bucket, `${days} days`);
      assert.equal(row.invoices[0].overdueDays, days);
      assert.equal(row.overdueRemaining, days > 0 ? invoice.total : 0);
    }
    const meta = await assertTotalsMatchTable();

    // The bucket filter narrows rows and totals; bucket counts ignore it.
    for (const bucket of BUCKETS) {
      const filtered = await receivables(`?pageSize=100&bucket=${bucket}`);
      const entry = meta.buckets.find((row) => row.bucket === bucket);

      assert.ok(filtered.data.every((row) => row.bucket === bucket));
      assert.equal(filtered.meta.total, entry.count);
      assert.equal(filtered.meta.totalRemaining, entry.remaining);
      assert.deepEqual(filtered.meta.buckets, meta.buckets);
      for (const { contract } of created.filter((row) => row.bucket === bucket))
        assert.ok(filtered.data.some((row) => row.contractId === contract.id));
    }

    // Two unpaid invoices: the row counts both, keeps the oldest due date and the max days.
    // (The second contract's invoice is attached to the first as its April monthly invoice.)
    const { contract, room, invoice } = created.find((row) => row.days === 8);
    const second = await contractInvoice();

    await sequelize.query(
      `UPDATE invoices SET contract_id = :contractId, room_id = :roomId, kind = 'monthly',
         period = '2042-04' WHERE id = :id`,
      { replacements: { contractId: contract.id, roomId: room.id, id: second.invoice.id } },
    );
    await dueDaysAgo(second.invoice.id, 40);
    const row = await rowOf(contract.id);

    assert.equal(row.invoiceCount, 2);
    assert.equal(row.remaining, invoice.total + second.invoice.total);
    assert.equal(row.overdueDays, 40);
    assert.equal(row.bucket, 'over_30');
    assert.equal(row.invoices[0].id, second.invoice.id, 'oldest due first');
    assert.equal(row.oldestDueOn, row.invoices[0].dueOn);
    await assertTotalsMatchTable();
  });

  test('sorting by remaining, overdue days and room code; pagination', async () => {
    for (const [sortBy, sortOrder, value, compare] of [
      ['remaining', 'desc', (row) => row.remaining, (a, b) => a >= b],
      ['remaining', 'asc', (row) => row.remaining, (a, b) => a <= b],
      ['overdueDays', 'desc', (row) => row.overdueDays, (a, b) => a >= b],
      ['overdueDays', 'asc', (row) => row.overdueDays, (a, b) => a <= b],
      ['roomCode', 'asc', (row) => row.roomCode, (a, b) => a.localeCompare(b, 'en') <= 0],
    ]) {
      const { data } = await receivables(`?pageSize=100&sortBy=${sortBy}&sortOrder=${sortOrder}`);

      assert.ok(data.length >= 6);
      for (let index = 1; index < data.length; index += 1)
        assert.ok(
          compare(value(data[index - 1]), value(data[index])),
          `${sortBy} ${sortOrder}: ${value(data[index - 1])} then ${value(data[index])}`,
        );
    }
    const all = await receivables('?pageSize=100&sortBy=overdueDays&sortOrder=desc');
    const first = await receivables('?page=1&pageSize=2&sortBy=overdueDays&sortOrder=desc');
    const second = await receivables('?page=2&pageSize=2&sortBy=overdueDays&sortOrder=desc');

    assert.equal(first.meta.total, all.meta.total);
    assert.equal(first.meta.totalRemaining, all.meta.totalRemaining);
    assert.deepEqual(
      [...first.data, ...second.data].map((row) => row.contractId),
      all.data.slice(0, 4).map((row) => row.contractId),
    );
  });
});
