// ST-25 part B: CI Postgres/API only. This suite never starts infrastructure.
// Uses its own buildings, new rooms and far-future contracts (2042) so seed data does not interfere.
// Portal sessions go through the real link + 4 digits flow; the CI script raises portal limits.
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import {
  AnnouncementModel,
  AuditLogModel,
  PaymentModel,
  sequelize,
} from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const COOKIE = 'stay_portal_session';
// 1×1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

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

/** GET never sends a body. */
async function call(cookie, method, path, body, headers = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      origin,
      ...(cookie ? { cookie } : {}),
      ...(body === undefined || method === 'GET' ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    body: body === undefined || method === 'GET' ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json(), headers: response.headers };
}

function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body.data;
}

function failed(result, status, code) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  if (code) assert.equal(result.body.code, code, JSON.stringify(result.body));
}

const randomPhone = () => `09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
const last4 = (phone) => phone.slice(-4);
const tokenOf = (created) => created.path.slice('/p/'.length);

describe('ST-25 tenant portal requests (part B)', { skip: !base }, () => {
  let owner, managerIn, managerOut;
  let building, outside;
  let roomNumber = 0;
  let users = 0;

  async function createUser(role, buildingId) {
    const id = randomUUID();
    users += 1;
    const email = `${role}-requests${users}-${suffix.toLowerCase()}@stay.local`;

    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST25B',true,:role,'active');
       INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
      {
        replacements: {
          id,
          email,
          role,
          accountId: randomUUID(),
          hash: await bcrypt.hash('requests-password-123', 10),
        },
      },
    );
    if (buildingId)
      await sequelize.query(
        'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
        { replacements: { id: randomUUID(), buildingId, userId: id } },
      );
    return signIn(email, 'requests-password-123');
  }

  /** A new room with an active 2042 contract, its issued move-in invoice and a portal session. */
  async function tenantPortal(names = ['Nguyễn Văn An']) {
    roomNumber += 1;
    const room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `R${roomNumber}`,
        floor: 1,
        listPrice: 3000000,
        maxOccupants: 4,
        initialElectric: 0,
        initialWater: 0,
      }),
      201,
    );
    const tenants = [];

    for (const fullName of names) {
      const phone = randomPhone();
      const tenant = ok(
        await call(owner, 'POST', '/tenants', { buildingId: building.id, fullName, phone }),
        201,
      );
      tenants.push({ ...tenant, phone });
    }
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
        occupantIds: tenants.map((tenant) => tenant.id),
        primaryTenantId: tenants[0].id,
        serviceIds: [],
        vehicleIds: [],
      }),
      201,
    );
    const contract = ok(await call(owner, 'POST', `/contracts/${draft.id}/activate`));
    const [moveIn] = ok(
      await call(owner, 'GET', `/invoices?contractId=${contract.id}&kind=move_in`),
    );
    const [invoice] = ok(
      await call(owner, 'POST', '/invoices/issue', { ids: [moveIn.id] }),
    ).invoices;
    const created = ok(
      await call(owner, 'POST', `/contracts/${contract.id}/portal-links`, {
        tenantId: tenants[0].id,
      }),
      201,
    );
    // The real entry flow: lookup, then the last 4 digits of the occupant's phone.
    ok(await call(undefined, 'POST', '/portal/links/lookup', { token: tokenOf(created) }));
    const session = await call(undefined, 'POST', '/portal/sessions', {
      token: tokenOf(created),
      phoneLast4: last4(tenants[0].phone),
    });

    assert.equal(session.status, 201, JSON.stringify(session.body));
    const cookie = session.headers
      .getSetCookie()
      .find((c) => c.startsWith(`${COOKIE}=`))
      ?.split(';')[0];

    assert.ok(cookie);
    return { room, tenants, contract, invoice, cookie };
  }

  /** A portal upload (ticket → stub storage → complete) of a 1×1 PNG. */
  async function portalUpload(cookie, purpose) {
    const ticket = ok(await call(cookie, 'POST', '/portal/uploads', { purpose }), 201);
    const form = new FormData();

    form.append('file', new Blob([PNG], { type: 'image/png' }), 'photo.png');
    const stored = await fetch(new URL(ticket.uploadUrl, base), { method: 'POST', body: form });

    assert.equal(stored.status, 200, await stored.clone().text());
    const completed = ok(await call(cookie, 'POST', `/portal/uploads/${ticket.id}/complete`));

    assert.ok(completed.fileId);
    return completed.fileId;
  }

  const inbox = (cookie, query) =>
    call(cookie, 'GET', `/requests?${new URLSearchParams({ buildingId: building.id, ...query })}`);

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `Q${suffix}`,
        name: `Requests ${suffix}`,
        address: `26 Đường Yêu Cầu ${suffix}`,
        contactPhone: '0901234567',
        bankBin: '970436',
        bankAccount: '0123456789',
        bankAccountName: 'NGUYEN VAN CHU',
      }),
      201,
    );
    outside = ok(
      await call(owner, 'POST', '/buildings', { code: `W${suffix}`, name: `Other ${suffix}` }),
      201,
    );
    managerIn = await createUser('manager', building.id);
    managerOut = await createUser('manager', outside.id);
  });

  after(async () => {
    await sequelize.close();
  });

  test('payment claim → confirm creates exactly one payment (retry safe), invoice paid', async () => {
    const { invoice, cookie, contract } = await tenantPortal();
    const receiptFileId = await portalUpload(cookie, 'payment_receipt');
    const key = `claim-${randomUUID()}`;
    const body = {
      amount: invoice.total,
      paidOn: today,
      receiptFileId,
      reference: 'FT123',
      note: 'Chuyển qua app',
    };
    const claim = ok(
      await call(cookie, 'POST', `/portal/invoices/${invoice.id}/payment-claims`, body, {
        'Idempotency-Key': key,
      }),
      201,
    );

    assert.equal(claim.status, 'pending');
    assert.equal(claim.isOwn, true);
    // Same key and body → the same claim; another body with the key → 409.
    const replay = ok(
      await call(cookie, 'POST', `/portal/invoices/${invoice.id}/payment-claims`, body, {
        'Idempotency-Key': key,
      }),
      201,
    );

    assert.equal(replay.id, claim.id);
    failed(
      await call(
        cookie,
        'POST',
        `/portal/invoices/${invoice.id}/payment-claims`,
        { ...body, amount: 1000 },
        { 'Idempotency-Key': key },
      ),
      409,
      'idempotency_conflict',
    );
    // One pending claim per invoice.
    failed(
      await call(cookie, 'POST', `/portal/invoices/${invoice.id}/payment-claims`, {
        amount: 1000,
        paidOn: today,
      }),
      409,
      'payment_claim_pending',
    );
    // The tenant sees "đang chờ xác nhận"; the ledger is untouched.
    const view = ok(await call(cookie, 'GET', `/portal/invoices/${invoice.id}`));

    assert.equal(view.claims[0].status, 'pending');
    assert.equal(view.paidTotal, 0);
    assert.equal(ok(await call(cookie, 'GET', '/portal/me')).openRequests.paymentClaims, 1);

    // Staff inbox: the claim with its receipt image.
    const listed = await inbox(owner, { kind: 'payment_claim', q: invoice.code });
    const item = ok(listed).find((row) => row.id === claim.id);

    assert.ok(item);
    assert.equal(item.status, 'pending');
    assert.equal(item.claim.amount, invoice.total);
    assert.equal(item.claim.invoiceRemaining, invoice.total);
    assert.ok(item.claim.receipt?.url, 'signed receipt URL');
    assert.ok(listed.body.meta.counts.some((row) => row.status === 'pending' && row.count >= 1));
    // The receipt image is served through the signed URL.
    const image = await fetch(new URL(item.claim.receipt.url, base));

    assert.equal(image.status, 200);

    // Confirm twice (retry/double click) and concurrently: exactly one payment.
    const [first, second] = await Promise.all([
      call(owner, 'POST', `/payment-claims/${claim.id}/confirm`, {}),
      call(owner, 'POST', `/payment-claims/${claim.id}/confirm`, {}),
    ]);
    const confirmed = ok(first);

    assert.equal(ok(second).claim.paymentId, confirmed.claim.paymentId);
    assert.equal(
      ok(await call(owner, 'POST', `/payment-claims/${claim.id}/confirm`, {})).claim.paymentId,
      confirmed.claim.paymentId,
    );
    assert.equal(confirmed.status, 'done');
    const payments = await PaymentModel.findAll({ where: { invoiceId: invoice.id } });

    assert.equal(payments.length, 1);
    assert.equal(payments[0].id, confirmed.claim.paymentId);
    assert.equal(payments[0].method, 'bank_transfer');
    assert.equal(payments[0].reference, 'FT123');
    assert.equal(payments[0].amount, invoice.total);
    const after = ok(await call(owner, 'GET', `/invoices/${invoice.id}`));

    assert.equal(after.status, 'paid');
    const tenantView = ok(await call(cookie, 'GET', `/portal/invoices/${invoice.id}`));

    assert.equal(tenantView.remaining, 0);
    assert.equal(tenantView.claims[0].status, 'confirmed');
    assert.equal(tenantView.payments.length, 1);
    // A confirmed claim cannot be rejected or cancelled.
    failed(
      await call(owner, 'POST', `/payment-claims/${claim.id}/reject`, { reason: 'Sai' }),
      409,
      'request_not_pending',
    );
    failed(
      await call(cookie, 'POST', `/portal/payment-claims/${claim.id}/cancel`, {}),
      409,
      'request_not_pending',
    );

    // Audit rows: ids and money only, never the reference or note.
    const audits = await AuditLogModel.findAll({
      where: { resourceType: 'payment_claim', resourceId: claim.id },
    });
    const text = JSON.stringify(audits.map((row) => row.toJSON()));

    assert.ok(audits.some((row) => row.action === 'payment_claim.created' && !row.actorId));
    assert.ok(audits.some((row) => row.action === 'payment_claim.confirmed' && row.actorId));
    assert.ok(!text.includes('FT123') && !text.includes('Chuyển qua app'));
    assert.ok(contract.id);
  });

  test('claim above the remaining amount is refused; reject keeps the invoice', async () => {
    const { invoice, cookie } = await tenantPortal();

    failed(
      await call(cookie, 'POST', `/portal/invoices/${invoice.id}/payment-claims`, {
        amount: invoice.total + 1,
        paidOn: today,
      }),
      422,
      'payment_exceeds_remaining',
    );
    failed(
      await call(cookie, 'POST', `/portal/invoices/${invoice.id}/payment-claims`, {
        amount: 1000,
        paidOn: '2099-01-01',
      }),
      400,
    );
    const claim = ok(
      await call(cookie, 'POST', `/portal/invoices/${invoice.id}/payment-claims`, {
        amount: 1000,
        paidOn: today,
      }),
      201,
    );

    failed(await call(owner, 'POST', `/payment-claims/${claim.id}/reject`, {}), 400);
    const rejected = ok(
      await call(owner, 'POST', `/payment-claims/${claim.id}/reject`, {
        reason: 'Không thấy tiền về',
      }),
    );

    assert.equal(rejected.status, 'rejected');
    const after = ok(await call(owner, 'GET', `/invoices/${invoice.id}`));

    assert.equal(after.status, 'issued');
    assert.equal(after.paidTotal, 0);
    assert.equal(await PaymentModel.count({ where: { invoiceId: invoice.id } }), 0);
    const view = ok(await call(cookie, 'GET', `/portal/invoices/${invoice.id}`));

    assert.equal(view.claims[0].status, 'rejected');
    assert.equal(view.claims[0].rejectReason, 'Không thấy tiền về');
    // A new claim is possible after the rejection; the sender may cancel it.
    const next = ok(
      await call(cookie, 'POST', `/portal/invoices/${invoice.id}/payment-claims`, {
        amount: 2000,
        paidOn: today,
      }),
      201,
    );

    assert.equal(
      ok(await call(cookie, 'POST', `/portal/payment-claims/${next.id}/cancel`, {})).status,
      'cancelled',
    );
  });

  test('maintenance: create with photos, list, reply, accept, reject, cancel', async () => {
    const { cookie, room } = await tenantPortal();
    const photo = await portalUpload(cookie, 'maintenance_photo');
    const report = ok(
      await call(cookie, 'POST', '/portal/maintenance', {
        title: 'Vòi nước rò',
        description: 'Vòi trong nhà tắm rò nước cả đêm',
        category: 'water',
        severity: 'urgent',
        photoFileIds: [photo],
      }),
      201,
    );

    assert.equal(report.status, 'new');
    assert.equal(report.photos.length, 1);
    failed(
      await call(cookie, 'POST', '/portal/maintenance', {
        title: 'Thiếu hạng mục',
        category: 'roof',
      }),
      400,
    );
    // A photo of another upload purpose is not attachable.
    const receipt = await portalUpload(cookie, 'payment_receipt');

    failed(
      await call(cookie, 'POST', '/portal/maintenance', {
        title: 'Ảnh sai',
        category: 'other',
        photoFileIds: [receipt],
      }),
      400,
    );
    let list = ok(await call(cookie, 'GET', '/portal/maintenance'));

    assert.deepEqual(
      list.map((row) => row.id),
      [report.id],
    );

    const items = ok(await inbox(owner, { kind: 'maintenance', q: room.code }));
    const item = items.find((row) => row.id === report.id);

    assert.equal(item.maintenance.title, 'Vòi nước rò');
    assert.equal(item.roomCode, room.code);
    assert.equal(item.tenantName, 'Nguyễn Văn An');
    assert.ok(item.maintenance.photos[0].url);

    ok(await call(owner, 'POST', `/requests/${report.id}/reply`, { message: 'Chiều nay thợ tới' }));
    list = ok(await call(cookie, 'GET', '/portal/maintenance'));
    assert.equal(list[0].reply, 'Chiều nay thợ tới');
    assert.equal(list[0].status, 'new');
    const accepted = ok(await call(owner, 'POST', `/requests/${report.id}/accept`, {}));

    assert.equal(accepted.status, 'in_progress');
    // Taken by staff: the tenant can no longer cancel it.
    failed(
      await call(cookie, 'POST', `/portal/maintenance/${report.id}/cancel`, {}),
      409,
      'request_not_pending',
    );
    const done = ok(await call(owner, 'POST', `/requests/${report.id}/accept`, { done: true }));

    assert.equal(done.maintenance.status, 'done');

    // Rejected with a reason: the tenant sees it as the reply.
    const second = ok(
      await call(cookie, 'POST', '/portal/maintenance', {
        title: 'Bóng đèn',
        category: 'electricity',
        severity: 'normal',
      }),
      201,
    );

    failed(await call(owner, 'POST', `/requests/${second.id}/reject`, { reason: '' }), 400);
    ok(
      await call(owner, 'POST', `/requests/${second.id}/reject`, {
        reason: 'Người thuê tự thay bóng',
      }),
    );
    list = ok(await call(cookie, 'GET', '/portal/maintenance'));
    const rejected = list.find((row) => row.id === second.id);

    assert.equal(rejected.status, 'rejected');
    assert.equal(rejected.reply, 'Người thuê tự thay bóng');

    // Cancel a new one.
    const third = ok(
      await call(cookie, 'POST', '/portal/maintenance', { title: 'Cửa kêu', category: 'other' }),
      201,
    );

    assert.equal(
      ok(await call(cookie, 'POST', `/portal/maintenance/${third.id}/cancel`, {})).status,
      'cancelled',
    );
    const audits = await AuditLogModel.findAll({ where: { resourceId: report.id } });
    const text = JSON.stringify(audits.map((row) => row.toJSON()));

    assert.ok(audits.some((row) => row.action === 'maintenance_request.created'));
    assert.ok(audits.some((row) => row.action === 'maintenance_request.accepted'));
    assert.ok(!text.includes('Vòi nước rò') && !text.includes('Chiều nay thợ tới'));
  });

  test('add-occupant request accepted → occupant from the effective date (ST-12)', async () => {
    const { cookie, contract } = await tenantPortal();

    failed(
      await call(cookie, 'POST', '/portal/requests', {
        type: 'add_occupant',
        payload: { fullName: 'Trần Thị Bình', phone: '123', fromDate: '2042-05-01' },
      }),
      400,
    );
    failed(
      await call(cookie, 'POST', '/portal/requests', {
        type: 'add_occupant',
        payload: { fullName: 'Trần Thị Bình', phone: randomPhone(), fromDate: '2041-01-01' },
      }),
      400,
    );
    const phone = randomPhone();
    const request = ok(
      await call(cookie, 'POST', '/portal/requests', {
        type: 'add_occupant',
        payload: { fullName: 'Trần Thị Bình', phone, fromDate: '2042-05-01' },
      }),
      201,
    );

    assert.equal(request.status, 'new');
    assert.equal(ok(await call(cookie, 'GET', '/portal/me')).openRequests.requests, 1);
    // Proposal only: the contract is unchanged.
    let staff = ok(await call(owner, 'GET', `/contracts/${contract.id}`));

    assert.equal(staff.occupants.length, 1);
    const accepted = ok(
      await call(owner, 'POST', `/requests/${request.id}/accept`, { reply: 'Đã thêm' }),
    );

    assert.equal(accepted.status, 'done');
    assert.ok(accepted.request.result.tenantId);
    staff = ok(await call(owner, 'GET', `/contracts/${contract.id}`));
    const added = staff.occupants.find((row) => row.fullName === 'Trần Thị Bình');

    assert.equal(added.fromDate, '2042-05-01');
    assert.equal(added.toDate, null);
    assert.equal(added.tenantId, accepted.request.result.tenantId);
    // The ST-12 history has the same `occupants` change.
    const mine = ok(await call(cookie, 'GET', '/portal/requests'));

    assert.equal(mine[0].status, 'accepted');
    assert.equal(mine[0].reply, 'Đã thêm');
    failed(
      await call(owner, 'POST', `/requests/${request.id}/accept`, {}),
      409,
      'request_not_pending',
    );
    // Audit: no name or phone.
    const audits = await AuditLogModel.findAll({ where: { resourceId: request.id } });
    const text = JSON.stringify(audits.map((row) => row.toJSON()));

    assert.ok(audits.some((row) => row.action === 'tenant_request.accepted'));
    assert.ok(!text.includes(phone) && !text.includes('Trần Thị Bình'));
  });

  test('move-out request accepted → contract ending; rejected and cancelled requests', async () => {
    const { cookie, contract } = await tenantPortal();
    const request = ok(
      await call(cookie, 'POST', '/portal/requests', {
        type: 'move_out',
        payload: { expectedMoveOutDate: '2042-08-31', reason: 'Chuyển công tác' },
      }),
      201,
    );
    const accepted = ok(await call(owner, 'POST', `/requests/${request.id}/accept`, {}));

    assert.equal(accepted.request.status, 'accepted');
    const staff = ok(await call(owner, 'GET', `/contracts/${contract.id}`));

    assert.equal(staff.status, 'ending');
    assert.equal(staff.noticeDate, '2042-08-31');

    const other = ok(
      await call(cookie, 'POST', '/portal/requests', {
        type: 'other',
        payload: { message: 'Xin lắp thêm kệ' },
      }),
      201,
    );

    ok(await call(owner, 'POST', `/requests/${other.id}/reject`, { reason: 'Không hỗ trợ' }));
    const vehicle = ok(
      await call(cookie, 'POST', '/portal/requests', {
        type: 'add_vehicle',
        payload: { plate: '59x1-234.56', vehicleType: 'motorbike', fromDate: '2042-04-01' },
      }),
      201,
    );

    assert.equal(vehicle.payload.plate, '59X1-234.56');
    assert.equal(
      ok(await call(cookie, 'POST', `/portal/requests/${vehicle.id}/cancel`, {})).status,
      'cancelled',
    );
    const mine = ok(await call(cookie, 'GET', '/portal/requests'));
    const rejected = mine.find((row) => row.id === other.id);

    assert.equal(rejected.status, 'rejected');
    assert.equal(rejected.reply, 'Không hỗ trợ');
    // The contract tab of the inbox lists them all.
    const byContract = ok(
      await call(owner, 'GET', `/requests?contractId=${contract.id}&kind=tenant_request`),
    );

    assert.deepEqual(
      new Set(byContract.map((row) => row.id)),
      new Set([request.id, other.id, vehicle.id]),
    );
  });

  test('tenants never reach another contract; cookies do not cross', async () => {
    const a = await tenantPortal();
    const b = await tenantPortal(['Phạm Văn Dũng']);
    const report = ok(
      await call(b.cookie, 'POST', '/portal/maintenance', {
        title: 'Ổ điện',
        category: 'electricity',
      }),
      201,
    );
    const request = ok(
      await call(b.cookie, 'POST', '/portal/requests', {
        type: 'other',
        payload: { message: 'Riêng B' },
      }),
      201,
    );
    const claim = ok(
      await call(b.cookie, 'POST', `/portal/invoices/${b.invoice.id}/payment-claims`, {
        amount: 1000,
        paidOn: today,
      }),
      201,
    );

    // A's session: B's items are invisible and every write by id is 404.
    assert.ok(
      !ok(await call(a.cookie, 'GET', '/portal/maintenance')).some((r) => r.id === report.id),
    );
    assert.ok(
      !ok(await call(a.cookie, 'GET', '/portal/requests')).some((r) => r.id === request.id),
    );
    failed(
      await call(a.cookie, 'POST', `/portal/invoices/${b.invoice.id}/payment-claims`, {
        amount: 1000,
        paidOn: today,
      }),
      404,
    );
    failed(await call(a.cookie, 'POST', `/portal/maintenance/${report.id}/cancel`, {}), 404);
    failed(await call(a.cookie, 'POST', `/portal/requests/${request.id}/cancel`, {}), 404);
    failed(await call(a.cookie, 'POST', `/portal/payment-claims/${claim.id}/cancel`, {}), 404);
    // A's uploads cannot be attached by B.
    const fileOfA = await portalUpload(a.cookie, 'maintenance_photo');

    failed(
      await call(b.cookie, 'POST', '/portal/maintenance', {
        title: 'Ảnh của người khác',
        category: 'other',
        photoFileIds: [fileOfA],
      }),
      400,
    );

    // The staff cookie is not a portal session; the portal cookie is not a staff session.
    for (const [method, path, body] of [
      ['POST', `/portal/invoices/${a.invoice.id}/payment-claims`, { amount: 1000, paidOn: today }],
      ['POST', '/portal/maintenance', { title: 'X', category: 'other' }],
      ['POST', '/portal/requests', { type: 'other', payload: { message: 'X' } }],
      ['POST', '/portal/uploads', { purpose: 'maintenance_photo' }],
      ['GET', '/portal/maintenance'],
    ])
      failed(await call(owner, method, path, body), 401, 'portal_session_invalid');
    for (const [method, path, body] of [
      ['GET', `/requests?buildingId=${building.id}`],
      ['POST', `/requests/${report.id}/accept`, {}],
      ['POST', `/payment-claims/${claim.id}/confirm`, {}],
      ['GET', `/announcements?buildingId=${building.id}`],
    ])
      failed(await call(a.cookie, method, path, body), 401);
  });

  test('staff scope: signed out 401, manager of another building 404, assigned manager ok', async () => {
    const { cookie, invoice } = await tenantPortal();
    const report = ok(
      await call(cookie, 'POST', '/portal/maintenance', {
        title: 'Quạt hỏng',
        category: 'appliance',
      }),
      201,
    );
    const claim = ok(
      await call(cookie, 'POST', `/portal/invoices/${invoice.id}/payment-claims`, {
        amount: 1000,
        paidOn: today,
      }),
      201,
    );
    const announcement = ok(
      await call(owner, 'POST', '/announcements', {
        buildingId: building.id,
        title: 'Cắt điện',
        body: 'Thứ bảy cắt điện 8h-10h',
      }),
      201,
    );

    for (const [method, path, body] of [
      ['GET', `/requests?buildingId=${building.id}`],
      ['POST', `/requests/${report.id}/accept`, {}],
      ['POST', `/requests/${report.id}/reject`, { reason: 'X' }],
      ['POST', `/requests/${report.id}/reply`, { message: 'X' }],
      ['POST', `/payment-claims/${claim.id}/confirm`, {}],
      ['POST', `/payment-claims/${claim.id}/reject`, { reason: 'X' }],
      ['GET', `/announcements?buildingId=${building.id}`],
      ['POST', '/announcements', { buildingId: building.id, title: 'X', body: 'Y' }],
      [
        'PUT',
        `/announcements/${announcement.id}`,
        { buildingId: building.id, title: 'X', body: 'Y', version: announcement.version },
      ],
      ['POST', `/announcements/${announcement.id}/archive`, {}],
      ['DELETE', `/announcements/${announcement.id}`],
    ]) {
      failed(await call(undefined, method, path, body), 401);
      failed(await call(managerOut, method, path, body), 404);
    }
    // The other building's manager does not see these items without a filter either.
    assert.ok(!ok(await call(managerOut, 'GET', '/requests')).some((row) => row.id === report.id));

    // The assigned manager handles them.
    const listed = ok(await inbox(managerIn, { q: invoice.code }));

    assert.ok(listed.some((row) => row.id === claim.id));
    ok(await call(managerIn, 'POST', `/requests/${report.id}/reply`, { message: 'Đã nhận' }));
    ok(await call(managerIn, 'POST', `/payment-claims/${claim.id}/reject`, { reason: 'Sai số' }));
    ok(await call(managerIn, 'POST', `/announcements/${announcement.id}/archive`, {}));
  });

  test('announcements: targeted rooms only, pinned, hidden after expiry', async () => {
    const a = await tenantPortal();
    const b = await tenantPortal(['Hoàng Thị Em']);
    const forA = ok(
      await call(owner, 'POST', '/announcements', {
        buildingId: building.id,
        title: `Phòng A ${suffix}`,
        body: 'Sửa ống nước phòng bạn',
        roomIds: [a.room.id],
        pinned: true,
        expiresOn: '2099-12-31',
      }),
      201,
    );
    const everyone = ok(
      await call(owner, 'POST', '/announcements', {
        buildingId: building.id,
        title: `Cả toà ${suffix}`,
        body: 'Họp tổ dân phố',
      }),
      201,
    );

    assert.deepEqual(forA.roomCodes, [a.room.code]);
    assert.equal(forA.pinned, true);
    // Rooms of another building or a past expiry are refused.
    const otherRoom = ok(
      await call(owner, 'POST', `/buildings/${outside.id}/rooms`, {
        code: `X${roomNumber}`,
        floor: 1,
        listPrice: 1000000,
        maxOccupants: 2,
      }),
      201,
    );

    failed(
      await call(owner, 'POST', '/announcements', {
        buildingId: building.id,
        title: 'Sai phòng',
        body: 'X',
        roomIds: [otherRoom.id],
      }),
      400,
    );
    failed(
      await call(owner, 'POST', '/announcements', {
        buildingId: building.id,
        title: 'Hết hạn',
        body: 'X',
        expiresOn: '2020-01-01',
      }),
      400,
    );

    const notices = (cookie) => call(cookie, 'GET', '/portal/notices');
    const titles = async (cookie) =>
      ok(await notices(cookie)).announcements.map((row) => row.title);

    assert.ok((await titles(a.cookie)).includes(forA.title));
    assert.ok((await titles(a.cookie)).includes(everyone.title));
    assert.ok(!(await titles(b.cookie)).includes(forA.title));
    assert.ok((await titles(b.cookie)).includes(everyone.title));
    const home = ok(await call(a.cookie, 'GET', '/portal/me'));

    assert.ok(home.pinnedNotices.some((row) => row.id === forA.id));
    assert.ok(!home.pinnedNotices.some((row) => row.id === everyone.id));

    // Update with the version (409 on a stale one), then archive hides it at once.
    const updated = ok(
      await call(owner, 'PUT', `/announcements/${everyone.id}`, {
        buildingId: building.id,
        title: `Cả toà sửa ${suffix}`,
        body: 'Họp lúc 19h',
        version: everyone.version,
      }),
    );

    assert.equal(updated.version, everyone.version + 1);
    failed(
      await call(owner, 'PUT', `/announcements/${everyone.id}`, {
        buildingId: building.id,
        title: 'Cũ',
        body: 'Cũ',
        version: everyone.version,
      }),
      409,
      'version_conflict',
    );
    const archived = ok(await call(owner, 'POST', `/announcements/${everyone.id}/archive`, {}));

    assert.equal(archived.expired, true);
    assert.ok(!(await titles(b.cookie)).includes(updated.title));
    // An expiry in the past hides it too (as when its last day has passed).
    await AnnouncementModel.update(
      { expiresAt: new Date(Date.now() - 60_000) },
      { where: { id: forA.id } },
    );
    assert.ok(!(await titles(a.cookie)).includes(forA.title));
    assert.ok(
      !ok(await call(a.cookie, 'GET', '/portal/me')).pinnedNotices.some((r) => r.id === forA.id),
    );
    const expired = ok(
      await call(owner, 'GET', `/announcements?buildingId=${building.id}&status=expired`),
    );

    assert.ok(expired.some((row) => row.id === forA.id));
    assert.ok(expired.some((row) => row.id === everyone.id));
    ok(await call(owner, 'DELETE', `/announcements/${forA.id}`));
    assert.equal(await AnnouncementModel.count({ where: { id: forA.id } }), 0);
    // Audit without the title or body.
    const audits = await AuditLogModel.findAll({
      where: { resourceType: 'announcement', resourceId: [forA.id, everyone.id] },
    });
    const text = JSON.stringify(audits.map((row) => row.toJSON()));

    assert.ok(audits.length >= 4);
    assert.ok(!text.includes('Sửa ống nước') && !text.includes('Họp'));
  });
});
