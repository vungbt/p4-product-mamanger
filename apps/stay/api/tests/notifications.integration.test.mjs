// Notification channels: CI Postgres/API only. Own buildings and far-future contracts (2042).
// Email and push go through injected fake transports (`deliverNotifications(now, transports)`);
// no SMTP server or push service is contacted.
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { QueryTypes } from 'sequelize';
import { deliverNotifications } from '../dist/modules/notifications/notifications.delivery.js';
import { DeliveryError } from '../dist/modules/notifications/notifications.transports.js';
import { DomainEventModel, sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
const COOKIE = 'stay_portal_session';
/** Delivery clock far ahead of every backoff, so each call drains what is due. */
const later = (minutes = 0) => new Date(Date.UTC(2045, 0, 1) + minutes * 60_000);

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

/** Collects SSE `notification` events of one stream until `close()`. */
async function openStream(cookie, path) {
  const controller = new AbortController();
  const response = await fetch(`${base}/api${path}`, {
    headers: { origin, ...(cookie ? { cookie } : {}) },
    signal: controller.signal,
  });
  const events = [];
  if (response.status !== 200) {
    controller.abort();
    return { status: response.status, events, close() {} };
  }
  assert.match(response.headers.get('content-type'), /text\/event-stream/);
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  let ready;
  const opened = new Promise((resolve) => {
    ready = resolve;
  });
  (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) return;
        buffer += value;
        let index = buffer.indexOf('\n\n');
        while (index >= 0) {
          const chunk = buffer.slice(0, index);
          buffer = buffer.slice(index + 2);
          const type = /^event: (.+)$/m.exec(chunk)?.[1];
          const data = /^data: (.+)$/m.exec(chunk)?.[1];
          if (type === 'ready') ready();
          if (type === 'notification' && data) events.push(JSON.parse(data));
          index = buffer.indexOf('\n\n');
        }
      }
    } catch {
      /* aborted */
    }
  })();
  await opened;
  return { status: 200, events, close: () => controller.abort() };
}

const waitFor = async (check, ms = 5000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return check();
};

/** Fake transports that record what would have been sent. */
function fakeTransports() {
  const mails = [];
  const pushes = [];
  return {
    mails,
    pushes,
    transports: {
      email: {
        async send(message) {
          mails.push(message);
        },
      },
      push: {
        async send(target, message) {
          pushes.push({ endpoint: target.endpoint, ...message });
        },
      },
    },
  };
}

async function drain(transports, now = later()) {
  while (await deliverNotifications(now, transports)) {
    /* every due event */
  }
}

const randomPhone = () => `09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
const endpoint = () => `https://fcm.googleapis.com/fcm/send/${randomUUID()}`;
const keys = {
  p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
  auth: 'tBHItJI5svbpez7KI4CCXg',
};

describe('Notification channels', { skip: !base }, () => {
  let owner, managerIn, managerOut, managerInEmail;
  let building, outside;
  let rooms = 0;

  async function createManager(buildingId) {
    const id = randomUUID();
    const email = `notify-${randomUUID().slice(0, 8)}-${suffix.toLowerCase()}@stay.local`;
    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'Notify',true,'manager','active');
       INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
      {
        replacements: {
          id,
          email,
          accountId: randomUUID(),
          hash: await bcrypt.hash('notify-password-123', 10),
        },
      },
    );
    await sequelize.query(
      'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
      { replacements: { id: randomUUID(), buildingId, userId: id } },
    );
    return { cookie: await signIn(email, 'notify-password-123'), email, id };
  }

  /** New room + active contract + issued move-in invoice + portal session of the occupant. */
  async function tenantPortal(target = building) {
    rooms += 1;
    const room = ok(
      await call(owner, 'POST', `/buildings/${target.id}/rooms`, {
        code: `N${rooms}`,
        floor: 1,
        listPrice: 3000000,
        maxOccupants: 2,
        initialElectric: 0,
        initialWater: 0,
      }),
      201,
    );
    const phone = randomPhone();
    const email = `tenant-${rooms}-${suffix.toLowerCase()}@stay.local`;
    const tenant = ok(
      await call(owner, 'POST', '/tenants', {
        buildingId: target.id,
        fullName: `Người thuê ${rooms}`,
        phone,
        email,
      }),
      201,
    );
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
    const [invoice] = ok(
      await call(owner, 'POST', '/invoices/issue', { ids: [moveIn.id] }),
    ).invoices;
    const link = ok(
      await call(owner, 'POST', `/contracts/${contract.id}/portal-links`, { tenantId: tenant.id }),
      201,
    );
    const session = await fetch(`${base}/api/portal/sessions`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ token: link.path.slice(3), phoneLast4: phone.slice(-4) }),
    });
    assert.equal(session.status, 201, await session.clone().text());
    const cookie = session.headers
      .getSetCookie()
      .find((c) => c.startsWith(`${COOKIE}=`))
      ?.split(';')[0];
    assert.ok(cookie);
    return { room, tenant: { ...tenant, email }, contract, invoice, link, cookie };
  }

  const notificationsOf = (where, replacements) =>
    sequelize.query(`SELECT * FROM notifications WHERE ${where} ORDER BY created_at,id`, {
      replacements,
      type: QueryTypes.SELECT,
    });

  before(async () => {
    owner = await signIn('owner@stay.local', 'stay-owner-123');
    building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `V${suffix}`,
        name: `Trọ thông báo ${suffix}`,
        bankBin: '970436',
        bankAccount: '0123456789',
        bankAccountName: 'NGUYEN VAN CHU',
      }),
      201,
    );
    outside = ok(
      await call(owner, 'POST', '/buildings', { code: `X${suffix}`, name: `Khác ${suffix}` }),
      201,
    );
    const inside = await createManager(building.id);
    managerIn = inside.cookie;
    managerInEmail = inside.email;
    managerOut = (await createManager(outside.id)).cookie;
    // Earlier suites' events must not count against this one.
    await drain(fakeTransports().transports);
  });

  after(() => sequelize.close());

  test('settings: defaults all on, validation, saved per person', async () => {
    const defaults = ok(await call(managerIn, 'GET', '/me/notification-settings'));
    assert.equal(defaults.email, true);
    assert.equal(defaults.push, true);
    assert.deepEqual(defaults.mutedGroups, []);
    assert.equal(defaults.hasEmail, true);
    assert.equal(defaults.pushSubscriptions, 0);
    assert.equal(
      (
        await call(managerIn, 'PUT', '/me/notification-settings', {
          email: true,
          push: true,
          mutedGroups: ['nope'],
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call(managerIn, 'PUT', '/me/notification-settings', {
          email: 'yes',
          push: true,
          mutedGroups: [],
        })
      ).status,
      400,
    );
    const saved = ok(
      await call(managerIn, 'PUT', '/me/notification-settings', {
        email: true,
        push: true,
        mutedGroups: ['requests', 'requests'],
      }),
    );
    assert.deepEqual(saved.mutedGroups, ['requests']);
    // Another person keeps the defaults.
    assert.deepEqual(
      ok(await call(managerOut, 'GET', '/me/notification-settings')).mutedGroups,
      [],
    );
    assert.equal((await call(undefined, 'GET', '/me/notification-settings')).status, 401);
  });

  test('push subscriptions: create (idempotent), validate endpoint, delete only own', async () => {
    const mine = endpoint();
    assert.equal(
      (
        await call(managerIn, 'POST', '/me/push-subscriptions', {
          endpoint: 'https://127.0.0.1/x',
          keys,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call(managerIn, 'POST', '/me/push-subscriptions', {
          endpoint: mine,
          keys: { p256dh: 'x y' },
        })
      ).status,
      400,
    );
    ok(await call(managerIn, 'POST', '/me/push-subscriptions', { endpoint: mine, keys }), 201);
    ok(await call(managerIn, 'POST', '/me/push-subscriptions', { endpoint: mine, keys }), 201);
    assert.equal(
      ok(await call(managerIn, 'GET', '/me/notification-settings')).pushSubscriptions,
      1,
    );
    // Someone else cannot remove it.
    ok(await call(managerOut, 'DELETE', '/me/push-subscriptions', { endpoint: mine }));
    assert.equal(
      ok(await call(managerIn, 'GET', '/me/notification-settings')).pushSubscriptions,
      1,
    );
    const removed = ok(
      await call(managerIn, 'DELETE', '/me/push-subscriptions', { endpoint: mine }),
    );
    assert.equal(removed.subscribed, false);
    assert.equal(
      ok(await call(managerIn, 'GET', '/me/notification-settings')).pushSubscriptions,
      0,
    );
  });

  test('payment claim → owner/managers of the building, live stream and fake email/push', async () => {
    const tenant = await tenantPortal();
    const pushEndpoint = endpoint();
    ok(
      await call(managerIn, 'POST', '/me/push-subscriptions', { endpoint: pushEndpoint, keys }),
      201,
    );
    const inside = await openStream(managerIn, '/notifications/stream');
    const outsider = await openStream(managerOut, '/notifications/stream');
    const otherTenant = await openStream(tenant.cookie, '/portal/notifications/stream');

    const claim = ok(
      await call(tenant.cookie, 'POST', `/portal/invoices/${tenant.invoice.id}/payment-claims`, {
        amount: 1_500_000,
        paidOn: today,
      }),
      201,
    );
    const [row] = await notificationsOf(`kind='payment_claim.created' AND building_id=:id`, {
      id: building.id,
    });
    assert.equal(row.audience, 'staff');
    assert.match(
      row.body,
      new RegExp(
        `Phòng ${tenant.room.code} báo đã chuyển 1\\.500\\.000 ₫ cho hoá đơn ${tenant.invoice.code}`,
      ),
    );
    // Outbox: one dispatch committed with the claim.
    assert.equal(
      await DomainEventModel.count({
        where: { aggregateId: row.id, type: 'stay.notification.dispatch' },
      }),
      1,
    );
    assert.ok(await waitFor(() => inside.events.some((event) => event.id === row.id)));
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.ok(!outsider.events.some((event) => event.id === row.id));
    assert.ok(!otherTenant.events.some((event) => event.id === row.id));
    inside.close();
    outsider.close();
    otherTenant.close();

    assert.ok(
      ok(await call(managerIn, 'GET', '/notifications')).items.some((item) => item.id === row.id),
    );
    assert.ok(
      !ok(await call(managerOut, 'GET', '/notifications')).items.some((item) => item.id === row.id),
    );

    const fake = fakeTransports();
    await drain(fake.transports);
    const mails = fake.mails.filter((mail) =>
      mail.subject.startsWith(`[Trọ thông báo ${suffix}] Phòng ${tenant.room.code} báo đã chuyển`),
    );
    assert.deepEqual(new Set(mails.map((mail) => mail.to)), new Set([managerInEmail, 'owner@stay.local']));
    assert.ok(mails.every((mail) => mail.html.includes('Xác nhận chuyển khoản')));
    assert.ok(mails.every((mail) => mail.text.includes('/requests?kind=payment_claim')));
    // The tenant got the invoice email when it was issued, never the staff notice.
    assert.ok(fake.mails.some((mail) => mail.to === tenant.tenant.email && mail.subject.includes('Hoá đơn mới')));
    const push = fake.pushes.find((item) => item.endpoint === pushEndpoint);
    assert.equal(push?.tag, row.id);
    assert.equal(push?.url, '/requests?kind=payment_claim');

    // Reject → the tenant who sent it, with the reason; confirm of a new claim → remaining.
    ok(
      await call(owner, 'POST', `/payment-claims/${claim.id}/reject`, { reason: 'Chưa thấy tiền' }),
    );
    const [rejected] = await notificationsOf(`kind='payment_claim.rejected' AND contract_id=:id`, {
      id: tenant.contract.id,
    });
    assert.equal(rejected.tenant_id, tenant.tenant.id);
    assert.match(rejected.body, /Chưa thấy tiền/);
    const second = ok(
      await call(tenant.cookie, 'POST', `/portal/invoices/${tenant.invoice.id}/payment-claims`, {
        amount: 1_000_000,
        paidOn: today,
      }),
      201,
    );
    ok(await call(owner, 'POST', `/payment-claims/${second.id}/confirm`, {}));
    const [paid] = await notificationsOf(`kind='payment.recorded' AND contract_id=:id`, {
      id: tenant.contract.id,
    });
    assert.match(
      paid.body,
      new RegExp(`Còn lại ${(tenant.invoice.total - 1_000_000).toLocaleString('de-DE')} ₫`),
    );

    // The tenant sees its own notifications in the portal, never staff ones.
    const portal = ok(await call(tenant.cookie, 'GET', '/portal/notifications'));
    const kinds = portal.items.map((item) => item.kind);
    assert.ok(kinds.includes('invoice.issued'));
    assert.ok(kinds.includes('payment_claim.rejected'));
    assert.ok(kinds.includes('payment.recorded'));
    assert.ok(!kinds.includes('payment_claim.created'));
    assert.equal(portal.unreadCount, portal.items.length);
    ok(await call(tenant.cookie, 'POST', `/portal/notifications/${paid.id}/read`));
    ok(await call(tenant.cookie, 'POST', `/portal/notifications/${paid.id}/read`));
    assert.equal(
      ok(await call(tenant.cookie, 'GET', '/portal/notifications')).unreadCount,
      portal.items.length - 1,
    );
    // A staff notification id is not readable from the portal.
    assert.equal(
      (await call(tenant.cookie, 'POST', `/portal/notifications/${row.id}/read`)).status,
      404,
    );

    const tenantMails = fakeTransports();
    await drain(tenantMails.transports);
    const own = tenantMails.mails.filter((mail) => mail.to === tenant.tenant.email);
    assert.ok(
      own.some(
        (mail) => mail.subject === `[Trọ thông báo ${suffix}] Báo chuyển khoản chưa được xác nhận`,
      ),
    );
    assert.ok(own.some((mail) => mail.subject.includes('Đã nhận 1.000.000 ₫')));
  });

  test('SSE auth: no session 401, staff and portal cookies never cross, no cross-tenant leak', async () => {
    const first = await tenantPortal();
    const second = await tenantPortal();
    assert.equal((await openStream(undefined, '/notifications/stream')).status, 401);
    assert.equal((await openStream(first.cookie, '/notifications/stream')).status, 401);
    assert.equal((await openStream(undefined, '/portal/notifications/stream')).status, 401);
    assert.equal((await openStream(owner, '/portal/notifications/stream')).status, 401);

    const firstStream = await openStream(first.cookie, '/portal/notifications/stream');
    const secondStream = await openStream(second.cookie, '/portal/notifications/stream');
    const maintenance = ok(
      await call(first.cookie, 'POST', '/portal/maintenance', {
        title: 'Vòi nước rỉ',
        description: 'Bồn rửa',
        category: 'water',
        severity: 'urgent',
        photoFileIds: [],
      }),
      201,
    );
    const [created] = await notificationsOf(`kind='maintenance.created' AND building_id=:id`, {
      id: building.id,
    });
    assert.match(created.title, new RegExp(`\\[Khẩn\\] Phòng ${first.room.code} báo hỏng`));
    ok(
      await call(owner, 'POST', `/requests/${maintenance.id}/accept`, {
        reply: 'Chiều nay thợ tới',
      }),
    );
    const [handled] = await notificationsOf(`kind='request.updated' AND contract_id=:id`, {
      id: first.contract.id,
    });
    assert.ok(await waitFor(() => firstStream.events.some((event) => event.id === handled.id)));
    assert.equal(
      firstStream.events.find((event) => event.id === handled.id).body,
      'Chiều nay thợ tới',
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.ok(!secondStream.events.some((event) => event.id === handled.id));
    assert.ok(!firstStream.events.some((event) => event.id === created.id));
    firstStream.close();
    secondStream.close();
    // Another contract's notification is not listed nor readable.
    assert.ok(
      !ok(await call(second.cookie, 'GET', '/portal/notifications')).items.some(
        (item) => item.id === handled.id,
      ),
    );
    assert.equal(
      (await call(second.cookie, 'POST', `/portal/notifications/${handled.id}/read`)).status,
      404,
    );
  });

  test('announcement → every active contract of the building; tenant push and preferences', async () => {
    const tenant = await tenantPortal();
    const pushEndpoint = endpoint();
    ok(
      await call(tenant.cookie, 'POST', '/portal/push-subscriptions', {
        endpoint: pushEndpoint,
        keys,
      }),
      201,
    );
    assert.equal(
      ok(await call(tenant.cookie, 'GET', '/portal/notification-settings')).pushSubscriptions,
      1,
    );
    ok(
      await call(owner, 'POST', '/announcements', {
        buildingId: building.id,
        title: 'Cắt nước sáng mai',
        body: 'Từ 8h đến 10h',
        roomIds: null,
        pinned: false,
        expiresOn: null,
      }),
      201,
    );
    const rows = await notificationsOf(`kind='announcement.created' AND building_id=:id`, {
      id: building.id,
    });
    assert.ok(rows.some((row) => row.contract_id === tenant.contract.id));
    assert.ok(rows.every((row) => row.audience === 'tenant'));
    const fake = fakeTransports();
    await drain(fake.transports);
    const push = fake.pushes.find(
      (item) => item.endpoint === pushEndpoint && item.url === '/p/notices',
    );
    assert.ok(push);
    assert.ok(
      fake.mails.some(
        (mail) => mail.to === tenant.tenant.email && mail.subject.includes('Cắt nước'),
      ),
    );

    // Muting announcements stops email and push, the in-app row is still recorded.
    ok(
      await call(tenant.cookie, 'PUT', '/portal/notification-settings', {
        email: true,
        push: true,
        mutedGroups: ['announcements'],
      }),
    );
    ok(
      await call(owner, 'POST', '/announcements', {
        buildingId: building.id,
        title: 'Họp nhà',
        body: 'Tối thứ 7',
        roomIds: [tenant.room.id],
        pinned: false,
        expiresOn: null,
      }),
      201,
    );
    const muted = fakeTransports();
    await drain(muted.transports);
    assert.ok(!muted.pushes.some((item) => item.endpoint === pushEndpoint));
    assert.ok(!muted.mails.some((mail) => mail.to === tenant.tenant.email));
    assert.equal(
      (
        await notificationsOf(`kind='announcement.created' AND contract_id=:id`, {
          id: tenant.contract.id,
        })
      ).length,
      2,
    );
    // A revoked link stops browser pushes.
    ok(
      await call(tenant.cookie, 'PUT', '/portal/notification-settings', {
        email: false,
        push: true,
        mutedGroups: [],
      }),
    );
    ok(await call(owner, 'DELETE', `/portal-links/${tenant.link.link.id}`));
    ok(
      await call(
        owner,
        'POST',
        `/invoices/${tenant.invoice.id}/payments`,
        { amount: 100_000, method: 'cash', paidOn: today },
        { 'Idempotency-Key': `notify-${randomUUID()}` },
      ),
      201,
    );
    const revoked = fakeTransports();
    await drain(revoked.transports);
    assert.ok(!revoked.pushes.some((item) => item.endpoint === pushEndpoint));
  });

  test('worker: transient failure retries with backoff, permanent failure dead-letters', async () => {
    const tenant = await tenantPortal();
    await drain(fakeTransports().transports);
    ok(
      await call(tenant.cookie, 'POST', '/portal/requests', {
        type: 'other',
        payload: { message: 'Xin thêm chìa khoá' },
      }),
      201,
    );
    const [row] = await notificationsOf(`kind='tenant_request.created' AND building_id=:id`, {
      id: building.id,
    });
    // Dispatch (no transport call), then the first email fails transiently.
    let calls = 0;
    const flaky = {
      email: {
        async send() {
          calls += 1;
          throw new DeliveryError('smtp_unavailable');
        },
      },
      push: null,
    };
    assert.equal(await deliverNotifications(later(), flaky), true);
    assert.equal(await deliverNotifications(later(), flaky), true);
    const [failed] = await DomainEventModel.findAll({
      where: {
        aggregateId: row.id,
        type: 'stay.notification.email',
        lastErrorCode: 'smtp_unavailable',
      },
    });
    assert.ok(failed);
    assert.equal(failed.status, 'pending');
    assert.equal(failed.attempts, 1);
    assert.ok(failed.availableAt > later());
    assert.equal(calls, 1);
    // Not due yet: nothing happens at the same clock.
    const before = calls;
    while (await deliverNotifications(later(), flaky)) {
      /* other recipients' events may still fail */
    }
    await failed.reload();
    assert.equal(failed.attempts, 1);
    // After the backoff a working transport delivers it.
    const fake = fakeTransports();
    await drain(fake.transports, later(60));
    await failed.reload();
    assert.equal(failed.status, 'delivered');
    assert.ok(calls >= before);

    // Permanent SMTP rejection: dead letter at once.
    ok(
      await call(tenant.cookie, 'POST', '/portal/requests', {
        type: 'other',
        payload: { message: 'Xin thêm chìa khoá nữa' },
      }),
      201,
    );
    const rejecting = {
      email: {
        async send() {
          throw new DeliveryError('smtp_550', true);
        },
      },
      push: null,
    };
    await drain(rejecting, later(120));
    const rows = await notificationsOf(`kind='tenant_request.created' AND building_id=:id`, {
      id: building.id,
    });
    const dead = await DomainEventModel.findAll({
      where: { aggregateId: rows.at(-1).id, type: 'stay.notification.email' },
    });
    assert.ok(dead.length > 0);
    assert.ok(
      dead.every((event) => event.status === 'dead_letter' && event.lastErrorCode === 'smtp_550'),
    );
  });
});
