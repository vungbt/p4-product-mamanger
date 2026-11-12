// Billing calendar (rules.md "Lịch thu"): reading day mode, grace period and their validation.
// CI Postgres/API only; own buildings, rooms and far-future contracts (2042). System settings
// are changed once and restored.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();
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

function fieldErrors(result, fields) {
  assert.equal(result.status, 400, JSON.stringify(result.body));
  assert.equal(result.body.code, 'input_valid_error');
  for (const field of fields)
    assert.ok(result.body.extensions?.[field]?.[0], `${field}: ${JSON.stringify(result.body)}`);
}

describe('billing calendar: reading day mode and grace period', { skip: !base }, () => {
  let owner, next, same, settings;
  let phone = 0;

  /** Owner cycle: readings 05 of the next month, issue 06, due 10, overdue after 5 days. */
  const ownerCycle = { readingDay: 5, readingDayMonth: 'next', issueDay: 6, dueDay: 10 };

  async function contract(building) {
    const room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `R${++phone}`,
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
        fullName: `Calendar tenant ${suffix} ${phone}`,
        phone: `06${String(Date.now() % 1_000_000).padStart(6, '0')}${String(phone).padStart(2, '0')}`,
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
        serviceIds: [],
        vehicleIds: [],
      }),
      201,
    );
    const active = ok(await call(owner, 'POST', `/contracts/${draft.id}/activate`));
    const [moveIn] = ok(await call(owner, 'GET', `/invoices?contractId=${active.id}&kind=move_in`));
    const invoice = ok(await call(owner, 'POST', '/invoices/issue', { ids: [moveIn.id] }))
      .invoices[0];
    const { meters } = ok(await call(owner, 'GET', `/rooms/${room.id}`));

    return { room, contract: active, invoice, meters };
  }

  const reading = (building, meter, period, readOn) =>
    call(owner, 'PUT', `/buildings/${building.id}/readings`, {
      rows: [{ meterId: meter.id, period, reading: 10, readOn, version: 0 }],
    }).then((result) => ok(result).results[0]);

  /** Moves an invoice's due date `days` before today (Asia/Ho_Chi_Minh). */
  const dueDaysAgo = (invoiceId, days) =>
    sequelize.query('UPDATE invoices SET due_on = CAST(:today AS date) - :days WHERE id = :id', {
      replacements: { id: invoiceId, today, days },
    });

  const updateBuilding = async (building, changes) => {
    const current = ok(await call(owner, 'GET', `/buildings/${building.id}`));
    const fields = [
      'code',
      'name',
      'address',
      'readingDay',
      'readingDayMonth',
      'issueDay',
      'dueDay',
      'graceDays',
      'roundingUnit',
      'refundUnusedRent',
      'bankBin',
      'bankAccount',
      'bankAccountName',
      'rulesText',
      'contactPhone',
      'version',
    ];

    return call(owner, 'PUT', `/buildings/${building.id}`, {
      ...Object.fromEntries(fields.map((field) => [field, current[field]])),
      ...changes,
    });
  };

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    settings = ok(await call(owner, 'GET', '/settings'));
    next = ok(
      await call(owner, 'POST', '/buildings', {
        code: `N${suffix}`,
        name: `Calendar next ${suffix}`,
        ...ownerCycle,
        graceDays: 5,
      }),
      201,
    );
    same = ok(
      await call(owner, 'POST', '/buildings', { code: `S${suffix}`, name: `Calendar ${suffix}` }),
      201,
    );
  });
  after(async () => {
    const current = ok(await call(owner, 'GET', '/settings'));

    ok(await call(owner, 'PUT', '/settings', { ...settings, version: current.version }));
    await sequelize.close();
  });

  test('building detail reports the effective cycle', async () => {
    assert.equal(next.readingDayMonth, 'next');
    assert.equal(next.graceDays, 5);
    assert.deepEqual(
      {
        readingDay: next.billing.readingDay,
        readingDayMonth: next.billing.readingDayMonth,
        issueDay: next.billing.issueDay,
        dueDay: next.billing.dueDay,
        graceDays: next.billing.graceDays,
      },
      { ...ownerCycle, graceDays: 5 },
    );
    assert.equal(same.readingDayMonth, null);
    assert.equal(same.graceDays, null);
    assert.equal(same.billing.readingDayMonth, settings.readingDayMonth);
    assert.equal(same.billing.graceDays, settings.graceDays);
  });

  test('readings dated 05/12 close November in next mode only; window ends on the reading day', async () => {
    const inNext = await contract(next);
    const inSame = await contract(same);
    const [electricNext, waterNext] = ['electricity', 'water'].map((kind) =>
      inNext.meters.find((meter) => meter.kind === kind),
    );
    const electricSame = inSame.meters.find((meter) => meter.kind === 'electricity');

    const grid = ok(await call(owner, 'GET', `/buildings/${next.id}/readings?period=2042-11`));

    assert.equal(grid.readingDayMonth, 'next');
    assert.equal(grid.readingOn, '2042-12-05');
    assert.equal(grid.readOnFrom, '2042-11-01');
    assert.equal(grid.readOnTo, '2042-12-05');

    const accepted = await reading(next, electricNext, '2042-11', '2042-12-05');

    assert.equal(accepted.error, null, JSON.stringify(accepted));
    assert.equal(accepted.data.readOn, '2042-12-05');

    const late = await reading(next, waterNext, '2042-11', '2042-12-06');

    assert.equal(late.data, null);
    assert.equal(late.error.code, 'input_valid_error');
    assert.match(late.error.message, /01\/11\/2042 đến 05\/12\/2042/);

    const early = await reading(next, waterNext, '2042-11', '2042-10-31');

    assert.equal(early.error?.code, 'input_valid_error');

    const sameGrid = ok(await call(owner, 'GET', `/buildings/${same.id}/readings?period=2042-11`));

    assert.equal(sameGrid.readOnTo, '2042-11-30');

    const rejected = await reading(same, electricSame, '2042-11', '2042-12-05');

    assert.equal(rejected.error?.code, 'input_valid_error');
    assert.equal((await reading(same, electricSame, '2042-11', '2042-11-30')).error, null);
  });

  test('overdue respects the grace period in receivables, the invoice list and the overview', async () => {
    const { invoice, contract: held } = await contract(next);
    const overdueList = async (overdue) =>
      ok(
        await call(owner, 'GET', `/invoices?buildingId=${next.id}&overdue=${overdue}&pageSize=100`),
      ).map((row) => row.id);
    const receivable = async () => {
      const result = await call(owner, 'GET', `/buildings/${next.id}/receivables?pageSize=100`);

      assert.equal(result.status, 200, JSON.stringify(result.body));
      return {
        meta: result.body.meta,
        row: result.body.data.find((row) => row.contractId === held.id),
      };
    };
    const overview = async () =>
      ok(await call(owner, 'GET', `/buildings/${next.id}/overview?period=2042-12`));

    // Due five days ago with five days of grace: still not overdue.
    await dueDaysAgo(invoice.id, 5);
    let summary = ok(await call(owner, 'GET', `/invoices/${invoice.id}`));

    assert.equal(summary.overdue, false);
    assert.equal(summary.overdueFrom > today, true);
    assert.ok(!(await overdueList(true)).includes(invoice.id));
    assert.ok((await overdueList(false)).includes(invoice.id));
    let { meta, row } = await receivable();

    assert.equal(row.bucket, 'not_due');
    assert.equal(row.overdueDays, 0);
    assert.equal(row.invoices[0].overdueDays, 0);
    assert.equal(meta.overdueRemaining, 0);
    let view = await overview();

    assert.equal(view.receivables.graceDays, 5);
    assert.equal(view.receivables.overdueInvoiceCount, 0);
    assert.equal(view.todos.find((todo) => todo.kind === 'overdue_invoices').count, 0);

    // One day past the grace period: overdue for one day.
    await dueDaysAgo(invoice.id, 6);
    summary = ok(await call(owner, 'GET', `/invoices/${invoice.id}`));
    assert.equal(summary.overdue, true);
    assert.equal(summary.overdueFrom, today);
    assert.ok((await overdueList(true)).includes(invoice.id));
    assert.ok(!(await overdueList(false)).includes(invoice.id));
    ({ meta, row } = await receivable());
    assert.equal(row.bucket, '1_7');
    assert.equal(row.overdueDays, 1);
    assert.equal(meta.overdueRemaining, row.remaining);
    view = await overview();
    assert.equal(view.receivables.overdueInvoiceCount, 1);
    assert.equal(view.receivables.overdueRemaining, row.remaining);
    assert.equal(view.todos.find((todo) => todo.kind === 'overdue_invoices').count, 1);

    // Without grace the same invoice is six days overdue.
    ok(await updateBuilding(next, { graceDays: 0 }));
    ({ row } = await receivable());
    assert.equal(row.overdueDays, 6);
    ok(await updateBuilding(next, { graceDays: 5 }));
  });

  test('overview to-dos carry the reading and issue dates of the cycle', async () => {
    const view = ok(await call(owner, 'GET', `/buildings/${next.id}/overview?period=2042-12`));
    const readings = view.todos.find((todo) => todo.kind === 'readings');
    const toCreate = view.todos.find((todo) => todo.kind === 'invoices_to_create');

    assert.deepEqual(readings.link, { path: '/readings', query: { period: '2042-11' } });
    assert.equal(readings.dueOn, '2042-12-05');
    assert.equal(toCreate.dueOn, '2042-12-06');
    assert.equal(view.todos.find((todo) => todo.kind === 'overdue_invoices').dueOn, null);

    const sameView = ok(await call(owner, 'GET', `/buildings/${same.id}/overview?period=2042-12`));

    assert.equal(sameView.todos.find((todo) => todo.kind === 'readings').dueOn, '2042-11-30');
  });

  test('settings validation: reading day ≤ issue day in next mode, due ≥ issue, grace 0–31', async () => {
    const body = { ...settings };

    fieldErrors(await call(owner, 'PUT', '/settings', { ...body, ...ownerCycle, readingDay: 7 }), [
      'readingDay',
    ]);
    fieldErrors(await call(owner, 'PUT', '/settings', { ...body, ...ownerCycle, dueDay: 5 }), [
      'dueDay',
    ]);
    fieldErrors(await call(owner, 'PUT', '/settings', { ...body, graceDays: 32 }), ['graceDays']);
    fieldErrors(await call(owner, 'PUT', '/settings', { ...body, graceDays: -1 }), ['graceDays']);
    fieldErrors(await call(owner, 'PUT', '/settings', { ...body, graceDays: 1.5 }), ['graceDays']);
    fieldErrors(await call(owner, 'PUT', '/settings', { ...body, readingDayMonth: 'later' }), [
      'readingDayMonth',
    ]);
    // `same` mode: the reading day belongs to the consumption month, any day is valid.
    const sameMode = ok(
      await call(owner, 'PUT', '/settings', { ...body, readingDayMonth: 'same', readingDay: 31 }),
    );

    assert.equal(sameMode.readingDayMonth, 'same');
    const updated = ok(
      await call(owner, 'PUT', '/settings', {
        ...body,
        ...ownerCycle,
        graceDays: 31,
        version: sameMode.version,
      }),
    );

    assert.deepEqual(
      {
        readingDay: updated.readingDay,
        readingDayMonth: updated.readingDayMonth,
        issueDay: updated.issueDay,
        dueDay: updated.dueDay,
        graceDays: updated.graceDays,
      },
      { ...ownerCycle, graceDays: 31 },
    );
    // The system values now apply to buildings without overrides.
    const inherited = ok(await call(owner, 'GET', `/buildings/${same.id}`));

    assert.equal(inherited.billing.readingDayMonth, 'next');
    assert.equal(inherited.billing.graceDays, 31);
    ok(
      await call(owner, 'PUT', '/settings', {
        ...settings,
        version: updated.version,
      }),
    );

    // Buildings: rules on the effective cycle; the error sits on the field the request sets.
    fieldErrors(
      await call(owner, 'POST', '/buildings', {
        code: `X${suffix}`,
        name: 'Invalid calendar',
        ...ownerCycle,
        readingDay: 7,
      }),
      ['readingDay'],
    );
    fieldErrors(
      await call(owner, 'POST', '/buildings', {
        code: `X${suffix}`,
        name: 'Invalid calendar',
        readingDayMonth: 'next',
        readingDay: 10,
        issueDay: 6,
        dueDay: 10,
      }),
      ['readingDay'],
    );
    fieldErrors(await updateBuilding(next, { graceDays: 32 }), ['graceDays']);
    fieldErrors(await updateBuilding(next, { issueDay: 4 }), ['readingDay']);
  });
});
