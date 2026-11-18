// ST-15: CI Postgres/API only. This suite never starts infrastructure.
// Uses its own buildings, new rooms and far-future contracts (2042) so seed data does not interfere.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { AuditLogModel, PaymentModel, sequelize } from '../dist/sequelize/models/index.js';

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
}

describe('ST-15 payments and invoice status', { skip: !base }, () => {
  let owner, managerIn, managerOut, tenantCookie;
  let building, outside;
  let roomNumber = 0;
  let phone = 0;
  let users = 0;

  const pay = (invoiceId, body, key = randomUUID(), cookie = owner) =>
    call(cookie, 'POST', `/invoices/${invoiceId}/payments`, body, { 'Idempotency-Key': key });
  const cash = (amount, extra = {}) => ({ amount, method: 'cash', paidOn: today, ...extra });
  const detail = async (id, cookie = owner) => ok(await call(cookie, 'GET', `/invoices/${id}`));

  async function createUser(role, buildingId) {
    const id = randomUUID();
    users += 1;
    const email = `${role}-pay${users}-${suffix.toLowerCase()}@stay.local`;

    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST15',true,:role,'active');
       INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
      {
        replacements: {
          id,
          email,
          role,
          accountId: randomUUID(),
          hash: await bcrypt.hash('payment-password-123', 10),
        },
      },
    );
    if (buildingId)
      await sequelize.query(
        'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
        { replacements: { id: randomUUID(), buildingId, userId: id } },
      );
    return signIn(email, 'payment-password-123');
  }

  /** A new room with an active contract from `startDate`; activation creates the move-in draft. */
  async function moveInDraft(startDate = '2042-03-01') {
    const room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `P${++roomNumber}`,
        floor: 1,
        listPrice: 3000000,
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
        fullName: `Payment tenant ${suffix} ${phone}`,
        phone: `08${String(Date.now() % 1_000_000).padStart(6, '0')}${String(phone).padStart(2, '0')}`,
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
    const [invoice] = ok(
      await call(owner, 'GET', `/invoices?contractId=${contract.id}&kind=move_in`),
    );

    assert.equal(invoice.status, 'draft');
    return invoice;
  }

  async function issuedInvoice() {
    const draft = await moveInDraft();
    const [issued] = ok(await call(owner, 'POST', '/invoices/issue', { ids: [draft.id] })).invoices;

    assert.equal(issued.status, 'issued');
    assert.ok(issued.total >= 1000, JSON.stringify(issued));
    return issued;
  }

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `Y${suffix}`,
        name: `Payments ${suffix}`,
        readingDay: 31,
        issueDay: 1,
        dueDay: 5,
        roundingUnit: 1000,
        refundUnusedRent: false,
      }),
      201,
    );
    outside = ok(
      await call(owner, 'POST', '/buildings', { code: `Z${suffix}`, name: `Outside ${suffix}` }),
      201,
    );
    managerIn = await createUser('manager', building.id);
    managerOut = await createUser('manager', outside.id);
    tenantCookie = await createUser('tenant');
  });

  after(async () => {
    await sequelize.close();
  });

  test('signed out 401; tenant 403; manager of another building 404', async () => {
    const invoice = await issuedInvoice();
    const payment = ok(await pay(invoice.id, cash(1000)), 201).payment;

    for (const [method, path] of [
      ['GET', '/payments'],
      ['POST', `/invoices/${invoice.id}/payments`],
      ['POST', `/payments/${payment.id}/reverse`],
    ])
      assert.equal(
        (await call(undefined, method, path, method === 'GET' ? undefined : {})).status,
        401,
        `${method} ${path}`,
      );
    failed(await call(tenantCookie, 'GET', '/payments'), 403);
    failed(await pay(invoice.id, cash(1000), randomUUID(), tenantCookie), 403);
    failed(await pay(invoice.id, cash(1000), randomUUID(), managerOut), 404);
    failed(await call(managerOut, 'GET', `/payments?buildingId=${building.id}`), 404);
    assert.equal(
      ok(await call(managerOut, 'GET', `/payments?invoiceId=${invoice.id}`)).length,
      0,
      'a manager never lists payments of other buildings',
    );
    failed(await call(managerOut, 'GET', `/invoices/${invoice.id}`), 404);
    // Reversal is `void Payment`: owner only (managers 403 before any lookup).
    failed(await call(managerIn, 'POST', `/payments/${payment.id}/reverse`, { reason: 'x' }), 403);
    // The assigned manager records payments and reads the ledger of the building.
    ok(await pay(invoice.id, cash(1000), randomUUID(), managerIn), 201);
    assert.equal(
      ok(
        await call(managerIn, 'GET', `/payments?buildingId=${building.id}&invoiceId=${invoice.id}`),
      ).length,
      2,
    );
  });

  test('validation: key required, positive amount, method, date not in the future', async () => {
    const invoice = await issuedInvoice();

    failed(await call(owner, 'POST', `/invoices/${invoice.id}/payments`, cash(1000)), 400);
    failed(await pay(invoice.id, cash(1000), 'short'), 400);
    failed(await pay(invoice.id, cash(0)), 400);
    failed(await pay(invoice.id, { ...cash(1000), method: 'card' }), 400);
    failed(await pay(invoice.id, { ...cash(1000), paidOn: '2999-01-01' }), 400);
    failed(await pay(invoice.id, { ...cash(1000), paidOn: '2042-13-01' }), 400);
    failed(await pay(randomUUID(), cash(1000)), 404);
    failed(await call(owner, 'GET', '/payments?dateFrom=2042-02-01&dateTo=2042-01-01'), 400);
    failed(await call(owner, 'GET', '/payments?method=card'), 400);
  });

  test('the same key twice (also concurrently) records one payment', async () => {
    const invoice = await issuedInvoice();
    const key = randomUUID();
    const [first, second] = await Promise.all([
      pay(invoice.id, cash(2000), key),
      pay(invoice.id, cash(2000), key),
    ]);
    const a = ok(first, 201);
    const b = ok(second, 201);

    assert.equal(a.payment.id, b.payment.id);
    const third = ok(await pay(invoice.id, cash(2000), key), 201);

    assert.equal(third.payment.id, a.payment.id);
    assert.equal(await PaymentModel.count({ where: { invoiceId: invoice.id } }), 1);
    const current = await detail(invoice.id);

    assert.equal(current.paidTotal, 2000);
    assert.equal(current.status, 'partially_paid');
    // Same key, different body: 409.
    failed(await pay(invoice.id, cash(3000), key), 409, 'idempotency_conflict');
  });

  test('two concurrent payments never exceed the total', async () => {
    const invoice = await issuedInvoice();
    const part = Math.floor(invoice.total * 0.6);
    const results = await Promise.all([
      pay(invoice.id, cash(part)),
      pay(invoice.id, cash(part)),
      pay(invoice.id, cash(part)),
    ]);
    const statuses = results.map((result) => result.status).sort();

    assert.deepEqual(statuses, [201, 422, 422], JSON.stringify(results.map((r) => r.body)));
    for (const result of results.filter((r) => r.status === 422))
      assert.equal(result.body.code, 'payment_exceeds_remaining');
    const current = await detail(invoice.id);

    assert.equal(current.paidTotal, part);
    assert.ok(current.paidTotal <= current.total);
    assert.equal(current.payments.length, 1);
  });

  test('overpay 422; partial then full → paid; paid invoices take no more payments', async () => {
    const invoice = await issuedInvoice();
    const over = await pay(invoice.id, cash(invoice.total + 1));

    failed(over, 422, 'payment_exceeds_remaining');
    assert.equal(over.body.extensions.remaining, invoice.total);
    const partial = ok(
      await pay(invoice.id, {
        amount: 1000,
        method: 'bank_transfer',
        paidOn: today,
        reference: 'FT123',
        note: 'Chuyển khoản lần 1',
      }),
      201,
    );

    assert.equal(partial.invoice.status, 'partially_paid');
    assert.equal(partial.invoice.paidTotal, 1000);
    assert.equal(partial.invoice.remaining, invoice.total - 1000);
    assert.equal(partial.payment.status, 'recorded');
    assert.equal(partial.payment.reference, 'FT123');
    assert.equal(partial.payment.actorName !== null, true);
    failed(await pay(invoice.id, cash(invoice.total)), 422, 'payment_exceeds_remaining');
    const full = ok(await pay(invoice.id, cash(invoice.total - 1000)), 201);

    assert.equal(full.invoice.status, 'paid');
    assert.equal(full.invoice.remaining, 0);
    const current = await detail(invoice.id);

    assert.equal(current.status, 'paid');
    assert.equal(current.paidTotal, current.total);
    assert.equal(current.payments.length, 2);
    failed(await pay(invoice.id, cash(1000)), 409, 'invoice_already_paid');
    // A paid invoice is never voided (rules.md: correct with an adjustment next period).
    failed(
      await call(owner, 'POST', `/invoices/${invoice.id}/void`, { reason: 'x' }),
      409,
      'invoice_has_payments',
    );
    const audits = await AuditLogModel.findAll({
      where: { resourceType: 'payment', resourceId: partial.payment.id },
    });

    assert.deepEqual(
      audits.map((row) => row.action),
      ['payment.recorded'],
    );
    for (const row of audits) {
      const text = JSON.stringify(row.changes);

      assert.equal(text.includes('FT123'), false);
      assert.equal(text.includes('Chuyển khoản lần 1'), false);
    }
  });

  test('reverse: reason required, once only, status recomputed; void allowed after', async () => {
    const invoice = await issuedInvoice();
    const first = ok(await pay(invoice.id, cash(1000)), 201).payment;
    const second = ok(await pay(invoice.id, cash(invoice.total - 1000)), 201).payment;

    assert.equal((await detail(invoice.id)).status, 'paid');
    failed(await call(owner, 'POST', `/payments/${second.id}/reverse`, {}), 400);
    const reversed = ok(
      await call(owner, 'POST', `/payments/${second.id}/reverse`, { reason: 'Ghi nhầm số tiền' }),
    );

    assert.equal(reversed.payment.status, 'reversed');
    assert.equal(reversed.payment.reverseReason, 'Ghi nhầm số tiền');
    assert.ok(reversed.payment.reversedAt);
    assert.equal(reversed.invoice.status, 'partially_paid');
    assert.equal(reversed.invoice.paidTotal, 1000);
    failed(
      await call(owner, 'POST', `/payments/${second.id}/reverse`, { reason: 'again' }),
      409,
      'payment_already_reversed',
    );
    failed(await call(owner, 'POST', `/payments/${randomUUID()}/reverse`, { reason: 'x' }), 404);
    // With a non-reversed payment the invoice cannot be voided.
    failed(
      await call(owner, 'POST', `/invoices/${invoice.id}/void`, { reason: 'x' }),
      409,
      'invoice_has_payments',
    );
    ok(await call(owner, 'POST', `/payments/${first.id}/reverse`, { reason: 'Khách chưa trả' }));
    const current = await detail(invoice.id);

    assert.equal(current.status, 'issued');
    assert.equal(current.paidTotal, 0);
    assert.equal(current.payments.length, 2);
    assert.ok(current.payments.every((payment) => payment.status === 'reversed'));
    // rules.md: void needs "chưa có thanh toán"; every payment is reversed, so paidTotal = 0.
    const voided = ok(
      await call(owner, 'POST', `/invoices/${invoice.id}/void`, { reason: 'Lập lại' }),
    );

    assert.equal(voided.status, 'void');
    failed(await pay(invoice.id, cash(1000)), 409, 'invoice_void');
    const audits = await AuditLogModel.findAll({
      where: { resourceType: 'payment', resourceId: second.id },
      order: [['createdAt', 'ASC']],
    });

    assert.deepEqual(
      audits.map((row) => row.action),
      ['payment.recorded', 'payment.reversed'],
    );
    for (const row of audits) assert.equal(JSON.stringify(row.changes).includes('Ghi nhầm'), false);
  });

  test('draft invoices reject payments', async () => {
    const draft = await moveInDraft();

    failed(await pay(draft.id, cash(1000)), 409, 'invoice_not_issued');
    assert.equal(await PaymentModel.count({ where: { invoiceId: draft.id } }), 0);
  });

  test('list: filters, reversed rows on request, totals per method over the whole filter', async () => {
    const invoice = await issuedInvoice();
    const other = await issuedInvoice();

    ok(await pay(invoice.id, cash(1000)), 201);
    ok(await pay(invoice.id, { ...cash(2000), method: 'bank_transfer', reference: 'REF-A' }), 201);
    ok(await pay(other.id, { ...cash(4000), method: 'bank_transfer' }), 201);
    const dropped = ok(await pay(other.id, { ...cash(8000), method: 'other' }), 201).payment;

    ok(await call(owner, 'POST', `/payments/${dropped.id}/reverse`, { reason: 'Sai' }));
    const list = (query) => call(owner, 'GET', `/payments?buildingId=${building.id}&${query}`);
    const ours = `q=${encodeURIComponent(invoice.code)}`;
    const page = await list(`${ours}&pageSize=1`);

    ok(page);
    assert.equal(page.body.data.length, 1);
    assert.equal(page.body.meta.total, 2);
    const totals = Object.fromEntries(page.body.meta.totals.map((row) => [row.method, row]));

    assert.deepEqual(totals.cash, { method: 'cash', amount: 1000, count: 1 });
    assert.deepEqual(totals.bank_transfer, { method: 'bank_transfer', amount: 2000, count: 1 });
    assert.deepEqual(totals.other, { method: 'other', amount: 0, count: 0 });
    assert.equal(page.body.meta.totalAmount, 3000);

    const otherInvoice = await list(`invoiceId=${other.id}`);

    assert.equal(otherInvoice.body.data.length, 1);
    assert.equal(otherInvoice.body.meta.totalAmount, 4000);
    const withReversed = await list(`invoiceId=${other.id}&includeReversed=true`);

    assert.equal(withReversed.body.data.length, 2);
    assert.equal(withReversed.body.data.find((row) => row.id === dropped.id).status, 'reversed');
    // Reversed payments never count in the totals.
    assert.equal(withReversed.body.meta.totalAmount, 4000);
    const transfers = await list(`${ours}&method=bank_transfer`);

    assert.deepEqual(
      transfers.body.data.map((row) => [row.amount, row.reference, row.invoiceCode]),
      [[2000, 'REF-A', invoice.code]],
    );
    assert.equal((await list('q=REF-A')).body.data.length, 1);
    assert.equal((await list(`${ours}&dateFrom=${today}&dateTo=${today}`)).body.data.length, 2);
    assert.equal((await list(`${ours}&dateFrom=2999-01-01`)).body.data.length, 0);
    assert.equal((await list(`${ours}&dateTo=2000-01-01`)).body.meta.totalAmount, 0);
  });
});
