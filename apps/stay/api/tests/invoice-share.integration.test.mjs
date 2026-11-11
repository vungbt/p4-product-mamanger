// ST-16: CI Postgres/API only. This suite never starts infrastructure.
// Uses its own buildings, new rooms and far-future contracts (2042) so seed data does not interfere.
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { crc16Ccitt, toTransferText } from '@stay/shared';
import bcrypt from 'bcryptjs';
import { AuditLogModel, InvoiceModel, sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 5).toUpperCase();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const BANK = { bankBin: '970436', bankAccount: '0123456789', bankAccountName: 'NGUYEN VAN CHU' };

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

/** Splits an EMVCo string into `{ id: value }` (one level). */
function parseTlv(payload) {
  const fields = {};
  let index = 0;

  while (index < payload.length) {
    const id = payload.slice(index, index + 2);
    const length = Number(payload.slice(index + 2, index + 4));

    fields[id] = payload.slice(index + 4, index + 4 + length);
    index += 4 + length;
  }
  assert.equal(index, payload.length, 'lengths add up to the payload');
  return fields;
}

/** Every object key of a JSON value, at any depth. */
function keysOf(value, keys = new Set()) {
  if (Array.isArray(value)) for (const item of value) keysOf(item, keys);
  else if (value && typeof value === 'object')
    for (const [key, item] of Object.entries(value)) {
      keys.add(key);
      keysOf(item, keys);
    }
  return keys;
}

const tokenOf = (link) => link.path.slice('/i/'.length);
/** Signed-out GET of the public invoice (no cookie, no origin). */
async function publicGet(token) {
  const response = await fetch(`${base}/api/public/invoices/${token}`);

  return { status: response.status, body: await response.json() };
}

describe('ST-16 invoice share links and VietQR', { skip: !base }, () => {
  let owner, managerIn, managerOut, tenantCookie;
  let building, outside;
  let roomNumber = 0;
  let users = 0;

  const share = (id, cookie = owner) => call(cookie, 'POST', `/invoices/${id}/share`);
  const revoke = (id, cookie = owner) => call(cookie, 'DELETE', `/invoices/${id}/share`);
  const pay = (invoiceId, amount) =>
    call(
      owner,
      'POST',
      `/invoices/${invoiceId}/payments`,
      { amount, method: 'bank_transfer', paidOn: today },
      { 'Idempotency-Key': randomUUID() },
    );

  async function createUser(role, buildingId) {
    const id = randomUUID();
    users += 1;
    const email = `${role}-share${users}-${suffix.toLowerCase()}@stay.local`;

    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST16',true,:role,'active');
       INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
      {
        replacements: {
          id,
          email,
          role,
          accountId: randomUUID(),
          hash: await bcrypt.hash('share-password-123', 10),
        },
      },
    );
    if (buildingId)
      await sequelize.query(
        'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
        { replacements: { id: randomUUID(), buildingId, userId: id } },
      );
    return signIn(email, 'share-password-123');
  }

  /** A new room with an active contract from `startDate`; returns its move-in draft. */
  async function moveInDraft(startDate = '2042-03-01') {
    roomNumber += 1;
    const room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `S${roomNumber}`,
        floor: 1,
        listPrice: 3000000,
        maxOccupants: 2,
        initialElectric: 0,
        initialWater: 0,
      }),
      201,
    );
    const phone = `09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
    const idNumber = `0${String(randomInt(0, 100_000_000_000)).padStart(11, '0')}`;
    const tenant = ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: building.id,
        fullName: 'Nguyễn Văn An',
        phone,
        idNumber,
        note: `Ghi chú nội bộ ${suffix}`,
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
    return { invoice, room, tenant, contract, phone, idNumber };
  }

  async function issuedInvoice(startDate) {
    const created = await moveInDraft(startDate);
    const [issued] = ok(
      await call(owner, 'POST', '/invoices/issue', { ids: [created.invoice.id] }),
    ).invoices;

    assert.equal(issued.status, 'issued');
    assert.ok(issued.total >= 2000, JSON.stringify(issued));
    return { ...created, invoice: issued };
  }

  async function expectedContent(code) {
    const { transferContentTemplate: template } = ok(await call(owner, 'GET', '/settings'));
    const text = template.includes('{invoiceCode}')
      ? template.replaceAll('{invoiceCode}', code)
      : `${template} ${code}`;

    return toTransferText(text).slice(0, 50).trim();
  }

  function assertQr(payload, amount, content) {
    assert.equal(payload.slice(-4), crc16Ccitt(payload.slice(0, -4)), 'valid CRC');
    const fields = parseTlv(payload);

    assert.equal(fields['01'], '12', 'dynamic QR');
    assert.equal(fields['53'], '704');
    assert.equal(fields['54'], String(amount));
    assert.equal(fields['58'], 'VN');
    assert.equal(parseTlv(fields['62'])['08'], content);
    const beneficiary = parseTlv(parseTlv(fields['38'])['01']);

    assert.equal(beneficiary['00'], BANK.bankBin);
    assert.equal(beneficiary['01'], BANK.bankAccount);
  }

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `X${suffix}`,
        name: `Share ${suffix}`,
        address: `12 Đường Chia Sẻ ${suffix}`,
        ...BANK,
      }),
      201,
    );
    outside = ok(
      await call(owner, 'POST', '/buildings', { code: `W${suffix}`, name: `Other ${suffix}` }),
      201,
    );
    managerIn = await createUser('manager', building.id);
    managerOut = await createUser('manager', outside.id);
    tenantCookie = await createUser('tenant');
  });

  after(async () => {
    await sequelize.close();
  });

  test('signed out 401, tenant 403, manager of another building 404', async () => {
    const { invoice } = await issuedInvoice();

    for (const [method, path] of [
      ['POST', `/invoices/${invoice.id}/share`],
      ['DELETE', `/invoices/${invoice.id}/share`],
      ['POST', `/buildings/${building.id}/billing/2042-03/shares`],
    ])
      assert.equal(
        (await call(undefined, method, path, undefined, { 'Idempotency-Key': randomUUID() }))
          .status,
        401,
        `${method} ${path}`,
      );
    failed(await share(invoice.id, tenantCookie), 403);
    failed(await share(invoice.id, managerOut), 404);
    failed(await revoke(invoice.id, managerOut), 404);
    failed(
      await call(
        managerOut,
        'POST',
        `/buildings/${building.id}/billing/2042-03/shares`,
        undefined,
        {
          'Idempotency-Key': randomUUID(),
        },
      ),
      404,
    );
    // The assigned manager shares invoices of the building.
    const link = ok(await share(invoice.id, managerIn));

    assert.equal((await publicGet(tokenOf(link))).status, 200);
  });

  test('share → the public invoice works signed out and leaks no personal data', async () => {
    const { invoice, room, tenant, contract, phone, idNumber } = await issuedInvoice();
    const link = ok(await share(invoice.id));
    const token = tokenOf(link);

    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(link.url, `${origin}/i/${token}`);
    assert.equal(link.invoiceId, invoice.id);
    const days = (new Date(link.expiresAt).getTime() - Date.now()) / 86_400_000;

    assert.ok(days > 59.9 && days <= 60, link.expiresAt);
    // Only the hash is stored.
    const stored = await InvoiceModel.findByPk(invoice.id);

    assert.notEqual(stored.shareTokenHash, token);
    assert.match(stored.shareTokenHash, /^[0-9a-f]{64}$/);

    const result = await publicGet(token);
    const data = ok(result);
    const raw = JSON.stringify(result.body);

    assert.equal(data.code, invoice.code);
    assert.equal(data.roomCode, room.code);
    assert.equal(data.buildingName, building.name);
    assert.equal(data.buildingAddress, building.address);
    assert.equal(data.kind, 'move_in');
    assert.equal(data.status, 'issued');
    assert.equal(data.total, invoice.total);
    assert.equal(data.paidTotal, 0);
    assert.equal(data.remaining, invoice.total);
    assert.equal(data.representative, 'N. V. An');
    assert.equal(
      data.lines.reduce((sum, line) => sum + line.amount, 0),
      invoice.total,
    );
    assert.ok(data.lines.every((line) => typeof line.description.key === 'string'));
    assert.deepEqual(data.payee, {
      bankBin: BANK.bankBin,
      bankShortName: 'Vietcombank',
      bankName: data.payee.bankName,
      accountNumber: BANK.bankAccount,
      accountName: BANK.bankAccountName,
    });
    assert.ok(data.payee.bankName);
    for (const secret of [
      phone,
      idNumber,
      'Nguyễn Văn An',
      `Ghi chú nội bộ ${suffix}`,
      tenant.id,
      contract.id,
      invoice.id,
      building.id,
      room.id,
    ])
      assert.ok(!raw.includes(secret), `public invoice must not contain ${secret}`);
    for (const key of [
      'id',
      'invoiceId',
      'contractId',
      'tenantId',
      'roomId',
      'buildingId',
      'phone',
    ])
      assert.ok(!keysOf(data).has(key), `no ${key}`);

    const content = await expectedContent(invoice.code);

    assert.equal(data.transferContent, content);
    assertQr(data.vietQrPayload, invoice.total, content);

    // The detail and list show the active link's expiry, never the token.
    const detail = ok(await call(owner, 'GET', `/invoices/${invoice.id}`));

    assert.equal(detail.shareExpiresAt, link.expiresAt);
    assert.ok(!JSON.stringify(detail).includes(token));
    // Audit rows of the share never contain the token or its hash.
    const audits = await AuditLogModel.findAll({ where: { resourceId: invoice.id } });
    const audited = JSON.stringify(audits.map((row) => row.toJSON()));

    assert.ok(audited.includes('invoice.share_created'));
    assert.ok(!audited.includes(token) && !audited.includes(stored.shareTokenHash));
    // Unknown and malformed tokens.
    failed(await publicGet('x'.repeat(43)), 404);
    failed(await publicGet('short'), 404);
  });

  test('payments: the QR asks for the remaining amount; fully paid → no QR, status paid', async () => {
    const { invoice } = await issuedInvoice();
    const token = tokenOf(ok(await share(invoice.id)));
    const content = await expectedContent(invoice.code);

    ok(await pay(invoice.id, 1000), 201);
    let data = ok(await publicGet(token));

    assert.equal(data.status, 'partially_paid');
    assert.equal(data.paidTotal, 1000);
    assert.equal(data.remaining, invoice.total - 1000);
    assertQr(data.vietQrPayload, invoice.total - 1000, content);

    ok(await pay(invoice.id, invoice.total - 1000), 201);
    data = ok(await publicGet(token));
    assert.equal(data.status, 'paid');
    assert.equal(data.remaining, 0);
    assert.equal(data.vietQrPayload, null);
    // A paid invoice can still be shared (receipt).
    assert.equal((await publicGet(tokenOf(ok(await share(invoice.id))))).status, 200);
  });

  test('refresh invalidates the old link; revoke → 404 (idempotent)', async () => {
    const { invoice } = await issuedInvoice();
    const first = tokenOf(ok(await share(invoice.id)));
    const second = tokenOf(ok(await share(invoice.id)));

    assert.notEqual(first, second);
    failed(await publicGet(first), 404);
    ok(await publicGet(second));

    assert.deepEqual(ok(await revoke(invoice.id)), { invoiceId: invoice.id, revoked: true });
    failed(await publicGet(second), 404);
    assert.equal(ok(await call(owner, 'GET', `/invoices/${invoice.id}`)).shareExpiresAt, null);
    assert.deepEqual(ok(await revoke(invoice.id)), { invoiceId: invoice.id, revoked: false });
  });

  test('expired, void and draft invoices', async () => {
    const { invoice } = await issuedInvoice();
    const token = tokenOf(ok(await share(invoice.id)));

    await InvoiceModel.update(
      { shareExpiresAt: new Date(Date.now() - 60_000) },
      { where: { id: invoice.id } },
    );
    failed(await publicGet(token), 404);
    assert.equal(ok(await call(owner, 'GET', `/invoices/${invoice.id}`)).shareExpiresAt, null);

    // Void: the link (refreshed) stops working and a void invoice cannot be shared again.
    const fresh = tokenOf(ok(await share(invoice.id)));

    ok(await publicGet(fresh));
    const current = ok(await call(owner, 'GET', `/invoices/${invoice.id}`));

    ok(await call(owner, 'POST', `/invoices/${invoice.id}/void`, { reason: 'Sai tiền phòng' }));
    failed(await publicGet(fresh), 404);
    failed(await share(invoice.id), 409, 'invoice_not_shareable');
    assert.equal(current.status, 'issued');

    const { invoice: draft } = await moveInDraft();

    failed(await share(draft.id), 409, 'invoice_not_shareable');
    failed(await share(randomUUID()), 404);
  });

  test('bulk: links for every issued invoice of the period, replayed with the same key', async () => {
    const period = '2042-07';
    const issued = [
      (await issuedInvoice(`${period}-01`)).invoice,
      (await issuedInvoice(`${period}-02`)).invoice,
    ];
    const { invoice: draft } = await moveInDraft(`${period}-03`);
    const path = `/buildings/${building.id}/billing/${period}/shares`;
    const key = randomUUID();

    failed(await call(owner, 'POST', path), 400);
    const result = ok(await call(owner, 'POST', path, undefined, { 'Idempotency-Key': key }));

    assert.equal(result.replayed, false);
    assert.equal(result.count, 2);
    assert.deepEqual(
      result.links.map((link) => link.invoiceId).sort(),
      issued.map((invoice) => invoice.id).sort(),
    );
    assert.ok(!result.links.some((link) => link.invoiceId === draft.id));
    for (const link of result.links) {
      const invoice = issued.find((candidate) => candidate.id === link.invoiceId);

      assert.equal(link.code, invoice.code);
      assert.equal(link.total, invoice.total);
      assert.equal(link.remaining, invoice.total);
      assert.equal(link.url, `${origin}${link.path}`);
      assert.equal(ok(await publicGet(tokenOf(link))).code, invoice.code);
    }

    // Same key: the same links, nothing refreshed.
    const replay = ok(await call(owner, 'POST', path, undefined, { 'Idempotency-Key': key }));

    assert.equal(replay.replayed, true);
    assert.deepEqual(
      replay.links.map((link) => link.url).sort(),
      result.links.map((link) => link.url).sort(),
    );
    // Managers of the building share too; a new key refreshes every link.
    const again = ok(
      await call(managerIn, 'POST', path, undefined, { 'Idempotency-Key': randomUUID() }),
    );

    assert.equal(again.count, 2);
    for (const link of result.links) failed(await publicGet(tokenOf(link)), 404);
    for (const link of again.links) ok(await publicGet(tokenOf(link)));
    // A replay of the first key no longer returns links that were refreshed since.
    assert.equal(
      ok(await call(owner, 'POST', path, undefined, { 'Idempotency-Key': key })).count,
      0,
    );
    const audits = await AuditLogModel.findAll({ where: { resourceId: issued[0].id } });

    assert.ok(!JSON.stringify(audits.map((row) => row.toJSON())).includes(tokenOf(again.links[0])));
  });
});
