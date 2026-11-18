// ST-25 part A: CI Postgres/API only. This suite never starts infrastructure.
// Uses its own buildings, new rooms and far-future contracts (2042) so seed data does not interfere.
// Portal session rate limits are raised by scripts/test-stay-api-integration.sh.
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { addDays } from '@stay/shared';
import bcrypt from 'bcryptjs';
import {
  AnnouncementModel,
  AuditLogModel,
  sequelize,
  TenantPortalLinkModel,
  TenantPortalSessionModel,
} from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 5).toUpperCase();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const BANK = { bankBin: '970436', bankAccount: '0123456789', bankAccountName: 'NGUYEN VAN CHU' };
const COOKIE = 'stay_portal_session';

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
  return fields;
}

const randomPhone = () => `09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
const last4 = (phone) => phone.slice(-4);
const wrong4 = (phone) => String((Number(last4(phone)) + 1) % 10_000).padStart(4, '0');
const tokenOf = (created) => created.path.slice('/p/'.length);

/** `POST /portal/sessions`; returns the portal cookie (`name=value`) on success. */
async function portalSignIn(token, phoneLast4, headers = {}) {
  const result = await call(undefined, 'POST', '/portal/sessions', { token, phoneLast4 }, headers);
  const setCookie = result.headers.getSetCookie().find((c) => c.startsWith(`${COOKIE}=`));

  return { ...result, setCookie, cookie: setCookie?.split(';')[0] };
}

describe('ST-25 tenant portal (part A)', { skip: !base }, () => {
  let owner, managerIn, managerOut;
  let building, outside;
  let roomNumber = 0;
  let users = 0;

  async function createUser(role, buildingId) {
    const id = randomUUID();
    users += 1;
    const email = `${role}-portal${users}-${suffix.toLowerCase()}@stay.local`;

    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST25',true,:role,'active');
       INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
      {
        replacements: {
          id,
          email,
          role,
          accountId: randomUUID(),
          hash: await bcrypt.hash('portal-password-123', 10),
        },
      },
    );
    if (buildingId)
      await sequelize.query(
        'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
        { replacements: { id: randomUUID(), buildingId, userId: id } },
      );
    return signIn(email, 'portal-password-123');
  }

  /**
   * A new room with an active contract (2042) for `names` occupants (the first is primary) and
   * its issued move-in invoice.
   */
  async function rentedRoom(names = ['Nguyễn Văn An']) {
    roomNumber += 1;
    const room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `P${roomNumber}`,
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
        await call(owner, 'POST', '/tenants', {
          buildingId: building.id,
          fullName,
          phone,
          idNumber: `0${String(randomInt(0, 100_000_000_000)).padStart(11, '0')}`,
          note: `Ghi chú nội bộ ${suffix}`,
        }),
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

    assert.equal(invoice.status, 'issued');
    return { room, tenants, contract, invoice };
  }

  const createLink = (contractId, tenantId, cookie = owner) =>
    call(cookie, 'POST', `/contracts/${contractId}/portal-links`, { tenantId });

  /** A rented room, a link for its first occupant and a signed-in portal cookie. */
  async function signedInTenant(names) {
    const rented = await rentedRoom(names);
    const created = ok(await createLink(rented.contract.id, rented.tenants[0].id), 201);
    const session = await portalSignIn(tokenOf(created), last4(rented.tenants[0].phone));

    assert.equal(session.status, 201, JSON.stringify(session.body));
    return { ...rented, created, cookie: session.cookie };
  }

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `Y${suffix}`,
        name: `Portal ${suffix}`,
        address: `25 Đường Cổng ${suffix}`,
        contactPhone: '0901234567',
        rulesText: `Giữ trật tự sau 22h ${suffix}`,
        ...BANK,
      }),
      201,
    );
    outside = ok(
      await call(owner, 'POST', '/buildings', { code: `V${suffix}`, name: `Other ${suffix}` }),
      201,
    );
    managerIn = await createUser('manager', building.id);
    managerOut = await createUser('manager', outside.id);
  });

  after(async () => {
    await sequelize.close();
  });

  test('link endpoints: signed out 401, manager of another building 404', async () => {
    const { contract, tenants } = await rentedRoom();
    const created = ok(await createLink(contract.id, tenants[0].id), 201);

    for (const [method, path, body] of [
      ['GET', `/contracts/${contract.id}/portal-links`],
      ['POST', `/contracts/${contract.id}/portal-links`, { tenantId: tenants[0].id }],
      ['DELETE', `/portal-links/${created.link.id}`],
    ]) {
      failed(await call(undefined, method, path, body), 401);
      failed(await call(managerOut, method, path, body), 404);
    }
    // The assigned manager manages the links of the building.
    const byManager = ok(await createLink(contract.id, tenants[0].id, managerIn), 201);

    assert.equal(byManager.replacedLinkId, created.link.id);
    ok(await call(managerIn, 'DELETE', `/portal-links/${byManager.link.id}`));
  });

  test('create, list, regenerate and revoke links; only the hash is stored', async () => {
    const { contract, tenants, room } = await rentedRoom(['Nguyễn Văn An', 'Trần Thị Bình']);
    const first = ok(await createLink(contract.id, tenants[0].id), 201);
    const token = tokenOf(first);

    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(first.token, token);
    assert.equal(first.url, `${origin}/p/${token}`);
    assert.equal(first.replacedLinkId, null);
    assert.equal(first.link.status, 'active');
    assert.equal(first.link.tenantId, tenants[0].id);
    assert.equal(first.link.lastOpenedAt, null);
    const stored = await TenantPortalLinkModel.findByPk(first.link.id);

    assert.equal(stored.tokenHash, createHash('sha256').update(token).digest('hex'));

    // One link per occupant: a second occupant gets their own link.
    const second = ok(await createLink(contract.id, tenants[1].id), 201);
    let list = ok(await call(owner, 'GET', `/contracts/${contract.id}/portal-links`));

    assert.deepEqual(
      new Set(list.map((link) => link.id)),
      new Set([first.link.id, second.link.id]),
    );
    assert.ok(list.every((link) => link.status === 'active'));
    const raw = JSON.stringify(list);

    assert.ok(!raw.includes(token) && !raw.includes(stored.tokenHash), 'never the token or hash');
    assert.ok(!('token' in list[0]));

    // Regenerating revokes the previous link of that occupant and signs its devices out.
    const session = await portalSignIn(token, last4(tenants[0].phone));

    assert.equal(session.status, 201);
    const regenerated = ok(await createLink(contract.id, tenants[0].id), 201);

    assert.equal(regenerated.replacedLinkId, first.link.id);
    assert.notEqual(tokenOf(regenerated), token);
    failed(await call(session.cookie, 'GET', '/portal/me'), 401, 'portal_session_invalid');
    failed(await portalSignIn(token, last4(tenants[0].phone)), 401, 'portal_verification_failed');
    list = ok(await call(owner, 'GET', `/contracts/${contract.id}/portal-links`));
    assert.equal(list.find((link) => link.id === first.link.id).status, 'revoked');
    assert.equal(list.find((link) => link.id === regenerated.link.id).status, 'active');

    // Not an occupant of this contract → 422; a draft/other contract is checked too.
    const stranger = await rentedRoom(['Lê Văn Cường']);

    failed(
      await createLink(contract.id, stranger.tenants[0].id),
      422,
      'portal_tenant_not_occupant',
    );
    failed(await createLink(contract.id, 'not-a-uuid'), 400);

    // Revoke is idempotent.
    const revoked = ok(await call(owner, 'DELETE', `/portal-links/${second.link.id}`));

    assert.equal(revoked.revoked, true);
    assert.equal(revoked.link.status, 'revoked');
    assert.equal(ok(await call(owner, 'DELETE', `/portal-links/${second.link.id}`)).revoked, false);

    // Audit rows hold ids only.
    const audits = await AuditLogModel.findAll({
      where: { resourceType: 'tenant_portal_link', resourceId: [first.link.id, second.link.id] },
    });
    const auditText = JSON.stringify(audits.map((row) => row.toJSON()));

    assert.ok(audits.some((row) => row.action === 'tenant_portal_link.created'));
    assert.ok(audits.some((row) => row.action === 'tenant_portal_link.revoked'));
    for (const secret of [token, stored.tokenHash, tenants[0].phone, 'Nguyễn Văn An'])
      assert.ok(!auditText.includes(secret), 'audit without secrets or personal data');
    assert.ok(room.code);
  });

  test('wrong digits → generic error; five wrong attempts lock the link; lookup', async () => {
    const { contract, tenants, room } = await rentedRoom();
    const created = ok(await createLink(contract.id, tenants[0].id), 201);
    const token = tokenOf(created);
    const phone = tenants[0].phone;

    // Unknown token and wrong digits: the same status, code and message.
    const unknown = await portalSignIn(randomBytes(32).toString('base64url'), last4(phone));
    const wrong = await portalSignIn(token, wrong4(phone));

    failed(unknown, 401, 'portal_verification_failed');
    failed(wrong, 401, 'portal_verification_failed');
    assert.equal(unknown.body.message, wrong.body.message);
    assert.equal(wrong.setCookie, undefined);
    failed(await portalSignIn('short', last4(phone)), 401, 'portal_verification_failed');
    failed(await call(undefined, 'POST', '/portal/sessions', { token, phoneLast4: '12a4' }), 400);

    // Lookup: room and building only; signed out → signedIn false; invalid link → 404.
    const lookup = ok(await call(undefined, 'POST', '/portal/links/lookup', { token }));

    assert.deepEqual(lookup, { roomCode: room.code, buildingName: building.name, signedIn: false });
    failed(
      await call(undefined, 'POST', '/portal/links/lookup', {
        token: randomBytes(32).toString('base64url'),
      }),
      404,
    );

    // Four more wrong attempts (five in a row) → locked; even the right digits are refused.
    for (let attempt = 2; attempt <= 4; attempt += 1)
      failed(await portalSignIn(token, wrong4(phone)), 401, 'portal_verification_failed');
    const locking = await portalSignIn(token, wrong4(phone));

    failed(locking, 429, 'portal_link_locked');
    assert.ok(Number(locking.headers.get('retry-after')) > 14 * 60);
    failed(await portalSignIn(token, last4(phone)), 429, 'portal_link_locked');
    let stored = await TenantPortalLinkModel.findByPk(created.link.id);
    const minutes = (stored.lockedUntil.getTime() - Date.now()) / 60_000;

    assert.ok(minutes > 14 && minutes <= 15, String(minutes));
    let list = ok(await call(owner, 'GET', `/contracts/${contract.id}/portal-links`));

    assert.equal(list[0].status, 'locked');

    // After the lock (simulated expiry), the right digits work and reset the counter.
    await TenantPortalLinkModel.update(
      { lockedUntil: new Date(Date.now() - 1000) },
      { where: { id: created.link.id } },
    );
    const session = await portalSignIn(token, last4(phone));

    assert.equal(session.status, 201, JSON.stringify(session.body));
    assert.match(session.setCookie, /HttpOnly/i);
    assert.match(session.setCookie, /SameSite=Lax/i);
    assert.match(session.setCookie, /Path=\/api\/portal/);
    const days = (new Date(session.body.data.expiresAt).getTime() - Date.now()) / 86_400_000;

    assert.ok(days > 89.9 && days <= 90, String(days));
    stored = await TenantPortalLinkModel.findByPk(created.link.id);
    assert.equal(stored.failedAttempts, 0);
    assert.ok(stored.lastOpenedAt);
    // Only the hash of the session id is stored.
    const value = session.cookie.slice(`${COOKIE}=`.length);
    const sessions = await TenantPortalSessionModel.findAll({ where: { linkId: created.link.id } });

    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].sessionHash, createHash('sha256').update(value).digest('hex'));
    assert.equal(
      ok(await call(session.cookie, 'POST', '/portal/links/lookup', { token })).signedIn,
      true,
    );
    list = ok(await call(owner, 'GET', `/contracts/${contract.id}/portal-links`));
    assert.equal(list[0].status, 'active');
    assert.equal(list[0].activeSessions, 1);
    assert.ok(list[0].lastOpenedAt);

    // Failed attempts are audited without the digits or the token.
    const failures = await AuditLogModel.findAll({
      where: { action: 'tenant_portal.verification_failed', resourceId: created.link.id },
    });

    assert.equal(failures.length, 5);
    assert.ok(!JSON.stringify(failures.map((row) => row.toJSON())).includes(token));
  });

  test('portal data is limited to the own contract; VietQR amount = remaining', async () => {
    const mine = await signedInTenant(['Phạm Minh Đức', 'Hoàng Thị Bình']);
    const other = await rentedRoom(['Võ Văn Khánh']);
    const cookie = mine.cookie;

    const me = ok(await call(cookie, 'GET', '/portal/me'));

    assert.equal(me.tenantName, 'Phạm Minh Đức');
    assert.equal(me.roomCode, mine.room.code);
    assert.equal(me.buildingName, building.name);
    assert.equal(me.contactPhone, '0901234567');
    assert.equal(me.contractCode, mine.contract.code);
    assert.equal(me.currentInvoice.id, mine.invoice.id);
    assert.equal(me.currentInvoice.code, mine.invoice.code);
    assert.equal(me.totalDebt, mine.invoice.total);
    assert.equal(me.previousDebt, 0);

    const invoices = ok(await call(cookie, 'GET', '/portal/invoices'));

    assert.deepEqual(
      invoices.map((invoice) => invoice.id),
      [mine.invoice.id],
    );
    // Another contract's invoice, an unknown id and a malformed id are never readable.
    failed(await call(cookie, 'GET', `/portal/invoices/${other.invoice.id}`), 404);
    failed(await call(cookie, 'GET', `/portal/invoices/${randomUUID()}`), 404);
    failed(await call(cookie, 'GET', '/portal/invoices/abc'), 400);

    // Every portal endpoint: nothing of the other contract, no phones, ID numbers or notes.
    const otherSecrets = [
      other.invoice.id,
      other.invoice.code,
      other.contract.code,
      other.tenants[0].phone,
      'Võ Văn Khánh',
      mine.tenants[1].phone,
      'Hoàng Thị Bình',
      mine.tenants[0].phone,
      mine.tenants[0].idNumber,
      `Ghi chú nội bộ ${suffix}`,
    ];

    for (const path of [
      '/portal/me',
      '/portal/invoices',
      `/portal/invoices/${mine.invoice.id}`,
      '/portal/contract',
      '/portal/usage',
      '/portal/notices',
    ]) {
      const raw = JSON.stringify(ok(await call(cookie, 'GET', path)));

      for (const secret of otherSecrets)
        assert.ok(!raw.includes(secret), `${path} must not contain ${secret}`);
    }

    const contract = ok(await call(cookie, 'GET', '/portal/contract'));

    assert.equal(contract.code, mine.contract.code);
    assert.equal(contract.roomCode, mine.room.code);
    assert.equal(contract.rent, 3000000);
    assert.equal(contract.depositHeld, 0);
    // Own name in full; other occupants abbreviated only.
    assert.deepEqual(
      [...contract.occupants].sort((a, b) => Number(b.isSelf) - Number(a.isSelf)),
      [
        { name: 'Phạm Minh Đức', isSelf: true, isPrimary: true },
        { name: 'H. T. Bình', isSelf: false, isPrimary: false },
      ],
    );
    assert.ok(contract.issueDay >= 1 && contract.dueDay >= 1);

    // VietQR for the remaining amount, before and after a partial payment.
    let detail = ok(await call(cookie, 'GET', `/portal/invoices/${mine.invoice.id}`));

    assert.equal(detail.id, mine.invoice.id);
    assert.equal(detail.code, mine.invoice.code);
    assert.equal(detail.remaining, mine.invoice.total);
    assert.equal(parseTlv(detail.vietQrPayload)['54'], String(mine.invoice.total));
    assert.equal(
      detail.lines.reduce((sum, line) => sum + line.amount, 0),
      mine.invoice.total,
    );
    assert.deepEqual(detail.payments, []);
    ok(
      await call(
        owner,
        'POST',
        `/invoices/${mine.invoice.id}/payments`,
        { amount: 1000, method: 'bank_transfer', paidOn: today, reference: `REF-${suffix}` },
        { 'Idempotency-Key': randomUUID() },
      ),
      201,
    );
    detail = ok(await call(cookie, 'GET', `/portal/invoices/${mine.invoice.id}`));
    assert.equal(detail.remaining, mine.invoice.total - 1000);
    assert.equal(parseTlv(detail.vietQrPayload)['54'], String(mine.invoice.total - 1000));
    assert.equal(detail.payments.length, 1);
    assert.deepEqual(Object.keys(detail.payments[0]).sort(), ['amount', 'id', 'method', 'paidOn']);
    assert.ok(!JSON.stringify(detail).includes(`REF-${suffix}`));
    assert.equal(ok(await call(cookie, 'GET', '/portal/me')).totalDebt, mine.invoice.total - 1000);

    const usage = ok(await call(cookie, 'GET', '/portal/usage'));

    assert.ok(Array.isArray(usage.periods) && usage.periods.length <= 12);
  });

  test('notices: pinned, room and expiry filters; house rules and contact', async () => {
    const mine = await signedInTenant();
    const otherRoom = await rentedRoom();
    const note = (values) => AnnouncementModel.create({ buildingId: building.id, ...values });
    const pinned = await note({ title: `Ghim ${suffix}`, body: 'Cắt nước 9h', pinned: true });
    const roomOnly = await note({
      title: `Phòng ${suffix}`,
      body: 'Riêng',
      roomIds: [mine.room.id],
    });

    await note({ title: `Khác ${suffix}`, body: 'Phòng khác', roomIds: [otherRoom.room.id] });
    await note({
      title: `Hết hạn ${suffix}`,
      body: 'Cũ',
      pinned: true,
      expiresAt: new Date(Date.now() - 60_000),
    });
    await AnnouncementModel.create({
      buildingId: outside.id,
      title: `Toà khác ${suffix}`,
      body: '-',
    });

    const notices = ok(await call(mine.cookie, 'GET', '/portal/notices'));
    const titles = notices.announcements.map((row) => row.title);

    assert.equal(titles[0], pinned.title, 'pinned first');
    assert.ok(titles.includes(roomOnly.title));
    for (const hidden of [`Khác ${suffix}`, `Hết hạn ${suffix}`, `Toà khác ${suffix}`])
      assert.ok(!titles.includes(hidden), hidden);
    assert.equal(notices.rulesText, `Giữ trật tự sau 22h ${suffix}`);
    assert.equal(notices.contactPhone, '0901234567');
    const me = ok(await call(mine.cookie, 'GET', '/portal/me'));

    assert.ok(me.pinnedNotices.some((row) => row.title === pinned.title));
    assert.ok(!me.pinnedNotices.some((row) => row.title === roomOnly.title), 'pinned only');
  });

  test('staff and portal cookies are not interchangeable; sign out; CSRF', async () => {
    const mine = await signedInTenant();

    // Signed out and staff cookies cannot read the portal.
    failed(await call(undefined, 'GET', '/portal/me'), 401, 'portal_session_invalid');
    failed(await call(owner, 'GET', '/portal/me'), 401, 'portal_session_invalid');
    failed(await call(owner, 'GET', `/portal/invoices/${mine.invoice.id}`), 401);
    failed(await call(undefined, 'DELETE', '/portal/sessions'), 401);
    // The portal cookie never authenticates staff routes.
    for (const path of ['/me', '/invoices', `/contracts/${mine.contract.id}`, '/buildings'])
      failed(await call(mine.cookie, 'GET', path), 401);
    failed(await call(mine.cookie, 'GET', `/contracts/${mine.contract.id}/portal-links`), 401);
    // A cookie write from another origin is refused.
    failed(
      await call(mine.cookie, 'DELETE', '/portal/sessions', undefined, {
        origin: 'https://evil.example',
      }),
      403,
    );

    const signOut = await call(mine.cookie, 'DELETE', '/portal/sessions');

    assert.equal(ok(signOut).signedOut, true);
    assert.match(
      signOut.headers.getSetCookie().find((c) => c.startsWith(`${COOKIE}=`)) ?? '',
      /Max-Age=0/,
    );
    failed(await call(mine.cookie, 'GET', '/portal/me'), 401, 'portal_session_invalid');
  });

  test('revoking a link signs every device out; removed occupants and ended contracts', async () => {
    const rented = await rentedRoom(['Đỗ Văn Long', 'Bùi Thị Mai']);
    const [first, second] = rented.tenants;
    const link = ok(await createLink(rented.contract.id, first.id), 201);
    const token = tokenOf(link);
    const phone = await portalSignIn(token, last4(first.phone));
    const laptop = await portalSignIn(token, last4(first.phone));

    for (const device of [phone, laptop]) ok(await call(device.cookie, 'GET', '/portal/me'));
    const revoked = ok(await call(owner, 'DELETE', `/portal-links/${link.link.id}`));

    assert.equal(revoked.sessionsRevoked, 2);
    for (const device of [phone, laptop])
      failed(await call(device.cookie, 'GET', '/portal/me'), 401, 'portal_session_invalid');
    failed(await call(undefined, 'POST', '/portal/links/lookup', { token }), 404);
    failed(await portalSignIn(token, last4(first.phone)), 401, 'portal_verification_failed');

    // A removed occupant (left on the start date) loses the portal at once.
    const secondLink = ok(await createLink(rented.contract.id, second.id), 201);
    const secondSession = await portalSignIn(tokenOf(secondLink), last4(second.phone));

    ok(await call(secondSession.cookie, 'GET', '/portal/me'));
    await sequelize.query(
      'UPDATE contract_occupants SET to_date = from_date WHERE contract_id = :contractId AND tenant_id = :tenantId',
      { replacements: { contractId: rented.contract.id, tenantId: second.id } },
    );
    failed(await call(secondSession.cookie, 'GET', '/portal/me'), 401);
    let list = ok(await call(owner, 'GET', `/contracts/${rented.contract.id}/portal-links`));

    assert.equal(list.find((row) => row.id === secondLink.link.id).status, 'expired');
    failed(await createLink(rented.contract.id, second.id), 422, 'portal_tenant_not_occupant');

    // An ended contract keeps its portal for 30 days after the move-out, then it expires.
    const fresh = ok(await createLink(rented.contract.id, first.id), 201);
    const session = await portalSignIn(tokenOf(fresh), last4(first.phone));

    ok(await call(session.cookie, 'GET', '/portal/me'));
    await sequelize.query(
      "UPDATE contracts SET status = 'ended', moved_out_at = :movedOut WHERE id = :id",
      { replacements: { id: rented.contract.id, movedOut: addDays(today, -29) } },
    );
    assert.equal(ok(await call(session.cookie, 'GET', '/portal/me')).contractStatus, 'ended');
    failed(await createLink(rented.contract.id, first.id), 409, 'contract_not_active');
    await sequelize.query('UPDATE contracts SET moved_out_at = :movedOut WHERE id = :id', {
      replacements: { id: rented.contract.id, movedOut: addDays(today, -31) },
    });
    failed(await call(session.cookie, 'GET', '/portal/me'), 401, 'portal_session_invalid');
    failed(await portalSignIn(tokenOf(fresh), last4(first.phone)), 401);
    list = ok(await call(owner, 'GET', `/contracts/${rented.contract.id}/portal-links`));
    assert.equal(list.find((row) => row.id === fresh.link.id).status, 'expired');
  });
});
