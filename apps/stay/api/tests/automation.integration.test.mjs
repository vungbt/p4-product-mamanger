// CI Postgres/API only. Calls the clock-driven jobs directly, without a worker or real mail.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { QueryTypes } from 'sequelize';
import {
  deliverAutomationMail,
  runAutomations,
} from '../dist/modules/automation/automation.jobs.js';
import { DomainEventModel, InvoiceModel, sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();
const at = (date) => new Date(`${date}T12:00:00+07:00`);

async function call(cookie, method, path, body, expected = 200) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      origin: 'http://localhost:5174',
      ...(cookie ? { cookie } : {}),
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  assert.equal(response.status, expected, JSON.stringify(result));
  return result.data;
}
async function signIn(email = 'owner@stay.local', password = 'stay-owner-123') {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { origin: 'http://localhost:5174', 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

describe('ST-26 automation', { skip: !process.env.CI || !base }, () => {
  let owner, building, ready, missing, noEmail, settings, managerIn, managerOut;
  const settingsPath = () => `/buildings/${building.id}/automation`;
  const set = async (changes) => {
    settings = await call(owner, 'PUT', settingsPath(), { ...settings, ...changes });
  };
  const runs = () =>
    sequelize.query(
      'SELECT id,period,kind,status,scheduled_on::text AS scheduled_on FROM automation_runs WHERE building_id=:id ORDER BY scheduled_on,id',
      {
        replacements: { id: building.id },
        type: QueryTypes.SELECT,
      },
    );
  const notices = () =>
    sequelize.query('SELECT * FROM notifications WHERE building_id=:id ORDER BY created_at,id', {
      replacements: { id: building.id },
      type: QueryTypes.SELECT,
    });
  const emails = async () => {
    const ids = (await runs()).map((row) => row.id);
    return ids.length
      ? DomainEventModel.findAll({ where: { aggregateId: ids, type: 'stay.automation.mail' } })
      : [];
  };
  async function manager(assigned, index) {
    const id = randomUUID();
    const email = `automation-${index}-${suffix.toLowerCase()}@stay.local`;
    const password = 'automation-password-123';
    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST26',true,'manager','active');
      INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash)`,
      {
        replacements: { id, email, accountId: randomUUID(), hash: await bcrypt.hash(password, 10) },
      },
    );
    if (assigned)
      await sequelize.query(
        'INSERT INTO building_members(id,building_id,user_id) VALUES(:id,:buildingId,:userId)',
        { replacements: { id: randomUUID(), buildingId: building.id, userId: id } },
      );
    return signIn(email, password);
  }
  async function fixture(code, email, metered) {
    const room = await call(
      owner,
      'POST',
      `/buildings/${building.id}/rooms`,
      { code, floor: 1, listPrice: 3000000, maxOccupants: 2, initialElectric: 0, initialWater: 0 },
      201,
    );
    const tenant = await call(
      owner,
      'POST',
      '/tenants',
      {
        buildingId: building.id,
        fullName: `Automation ${code}`,
        phone: '0901234567',
        ...(email ? { email } : {}),
      },
      201,
    );
    const services = await call(owner, 'GET', '/services');
    const draft = await call(
      owner,
      'POST',
      '/contracts',
      {
        roomId: room.id,
        startDate: '2042-10-01',
        endDate: '2044-12-31',
        rent: 3000000,
        initialElectric: 0,
        initialWater: 0,
        occupantIds: [tenant.id],
        primaryTenantId: tenant.id,
        serviceIds: metered
          ? services.filter((s) => s.kind === 'electricity' || s.kind === 'water').map((s) => s.id)
          : [],
      },
      201,
    );
    const contract = await call(owner, 'POST', `/contracts/${draft.id}/activate`);
    const { meters } = await call(owner, 'GET', `/rooms/${room.id}`);
    return { room, contract, tenant, meters };
  }
  before(async () => {
    owner = await signIn();
    building = await call(
      owner,
      'POST',
      '/buildings',
      { code: `J${suffix}`, name: `Automation ${suffix}`, readingDay: 31, issueDay: 1, dueDay: 5 },
      201,
    );
    settings = await call(owner, 'GET', settingsPath());
    assert.equal(settings.tenantRemindersDisabled, true);
    ready = await fixture('READY', `ready-${suffix.toLowerCase()}@stay.local`, false);
    missing = await fixture('MISSING', `missing-${suffix.toLowerCase()}@stay.local`, true);
    noEmail = await fixture('NOEMAIL', null, false);
    managerIn = await manager(true, 1);
    managerOut = await manager(false, 2);
  });
  after(() => sequelize.close());

  test('all jobs opt-in; issue day twice creates drafts once and reports missing readings', async () => {
    await runAutomations(at('2042-11-01'));
    assert.equal((await runs()).length, 0);
    await set({ createDrafts: true });
    await Promise.all([runAutomations(at('2042-11-01')), runAutomations(at('2042-11-01'))]);
    const invoices = await InvoiceModel.findAll({
      where: { buildingId: building.id, period: '2042-11' },
    });
    assert.equal(invoices.length, 2);
    assert.ok(invoices.every((row) => row.status === 'draft'));
    assert.ok(!invoices.some((row) => row.contractId === missing.contract.id));
    const [notice] = await notices();
    assert.equal(notice.title, 'Còn phòng thiếu chỉ số');
    assert.match(notice.body, /MISSING/);
    const versions = invoices.map((row) => row.version);
    await runAutomations(at('2042-11-01'));
    assert.deepEqual(
      (await InvoiceModel.findAll({ where: { buildingId: building.id, period: '2042-11' } })).map(
        (row) => row.version,
      ),
      versions,
    );
    await call(owner, 'POST', '/invoices/issue', { ids: invoices.map((row) => row.id) });
  });

  test('reading day is M−1, email and notification once; Vietnam date boundary', async () => {
    await set({ readingReminder: true });
    await runAutomations(new Date('2042-11-29T17:00:00Z'));
    await runAutomations(at('2042-11-30'));
    const readingRuns = (await runs()).filter((row) => row.kind === 'reading');
    assert.equal(readingRuns.length, 1);
    assert.equal(readingRuns[0].period, '2042-12');
    assert.equal((await notices()).filter((row) => row.title === 'Đến ngày chốt số').length, 1);
    assert.ok((await emails()).length >= 1);
  });

  test('master switch and individual toggles suppress tenant reminders', async () => {
    await set({ beforeDue: true, afterDue: true, tenantRemindersDisabled: true });
    const count = (await emails()).length;
    await runAutomations(at('2042-11-04'));
    await runAutomations(at('2042-11-08'));
    assert.equal((await emails()).length, count);
    assert.equal((await runs()).filter((row) => row.kind.endsWith('_due')).length, 0);
    await set({ tenantRemindersDisabled: false, beforeDue: false, afterDue: false });
    await runAutomations(at('2042-11-04'));
    await runAutomations(at('2042-11-08'));
    assert.equal((await emails()).length, count);
  });

  test('each invoice/kind reminds once, creates public link, owner sees unreachable tenants', async () => {
    await set({ beforeDue: true, afterDue: true });
    const count = (await emails()).length;
    for (const date of ['2042-11-04', '2042-11-08']) {
      await runAutomations(at(date));
      await runAutomations(at(date));
    }
    assert.equal((await emails()).length, count + 2);
    const unreadable = (await notices()).filter(
      (row) => row.title === 'Không thể gửi nhắc thanh toán',
    );
    assert.equal(unreadable.length, 2);
    assert.ok(unreadable.every((row) => row.body.includes('Automation NOEMAIL')));
    const invoice = await InvoiceModel.findOne({
      where: { contractId: ready.contract.id, period: '2042-11' },
    });
    assert.ok(invoice.shareTokenHash);
    const reminder = (await emails()).find(
      (row) => row.payload.to === ready.tenant.email && row.payload.subject.includes('quá hạn'),
    );
    const url = reminder.payload.text.split(' ').at(-1);
    const publicResult = await fetch(`${base}/api/public/invoices/${url.split('/').at(-1)}`);
    assert.equal(publicResult.status, 200);
  });

  test('pending run with held lease resumes only after expiry; commit is idempotent', async () => {
    const id = randomUUID();
    await sequelize.query(
      `INSERT INTO automation_runs(id,building_id,period,kind,scheduled_on) VALUES(:id,:buildingId,'2043-01','reading','2042-12-31');
      INSERT INTO job_leases(key,token,expires_at) VALUES(:id,:token,'2043-01-01T00:00:00+07:00')`,
      { replacements: { id, buildingId: building.id, token: randomUUID() } },
    );
    const before = (await notices()).length;
    await runAutomations(at('2042-12-31'));
    assert.equal((await notices()).length, before);
    assert.equal((await runs()).find((row) => row.id === id).status, 'pending');
    await runAutomations(at('2043-01-02'));
    assert.equal((await runs()).find((row) => row.id === id).status, 'done');
    assert.equal((await notices()).length, before + 1);
    await runAutomations(at('2043-01-02'));
    assert.equal((await notices()).length, before + 1);
  });

  test('settings version 409, validation, manager scope and personal read state', async () => {
    await call(owner, 'PUT', settingsPath(), { ...settings, version: settings.version - 1 }, 409);
    await call(owner, 'PUT', settingsPath(), { ...settings, beforeDue: 'true' }, 400);
    await call(managerIn, 'GET', settingsPath());
    await call(managerOut, 'GET', settingsPath(), undefined, 404);
    await call(managerIn, 'PUT', settingsPath(), settings, 403);
    await call(managerOut, 'PUT', settingsPath(), settings, 403);
    const all = await notices();
    const list = await call(managerIn, 'GET', '/notifications');
    assert.equal(list.items.length, all.length);
    assert.equal(list.unreadCount, all.length);
    const outside = await call(managerOut, 'GET', '/notifications');
    assert.ok(!outside.items.some((row) => row.buildingId === building.id));
    await call(managerOut, 'POST', `/notifications/${all[0].id}/read`, undefined, 404);
    await call(managerIn, 'POST', `/notifications/${all[0].id}/read`);
    await call(managerIn, 'POST', `/notifications/${all[0].id}/read`);
    assert.equal((await call(managerIn, 'GET', '/notifications')).unreadCount, all.length - 1);
    assert.equal(
      (await call(owner, 'GET', '/notifications')).items.find((row) => row.id === all[0].id).readAt,
      null,
    );
  });

  test('outbox delivery uses injected fake transport, retries; never real mail', async () => {
    const sent = new Set();
    const deliveryDate = at('2044-01-01');
    assert.equal(
      await deliverAutomationMail(deliveryDate, {
        async send() {
          throw new Error('simulated provider failure');
        },
      }),
      true,
    );
    const failed = (await emails()).find((row) => row.lastErrorCode === 'mail_delivery_failed');
    assert.ok(failed);
    assert.equal(failed.status, 'pending');
    assert.equal(failed.attempts, 1);
    const transport = {
      async send(id) {
        assert.ok(!sent.has(id));
        sent.add(id);
      },
    };
    while (await deliverAutomationMail(at('2044-01-02'), transport)) {
      /* drain */
    }
    const events = await emails();
    assert.ok(events.every((row) => row.status === 'delivered'));
    assert.ok(events.every((row) => sent.has(row.id)));
    const count = sent.size;
    assert.equal(await deliverAutomationMail(at('2044-01-02'), transport), false);
    assert.equal(sent.size, count);
  });

  const updateBuilding = async (changes) => {
    const current = await call(owner, 'GET', `/buildings/${building.id}`);
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
  const readAll = async (period, readOn) => {
    const rows = [ready, missing, noEmail].flatMap((fixtureRow) =>
      fixtureRow.meters.map((meter) => ({
        meterId: meter.id,
        period,
        reading: 10,
        readOn,
        version: 0,
      })),
    );
    const result = await call(owner, 'PUT', `/buildings/${building.id}/readings`, { rows });
    assert.ok(
      result.results.every((row) => row.error === null),
      JSON.stringify(result.results),
    );
  };

  test('reading reminders: N days before and on the reading day, only while rooms lack readings', async () => {
    await set({ readingReminder: true, readingReminderBefore: true, readingReminderDaysBefore: 2 });
    assert.equal(settings.readingReminderDaysBefore, 2);
    await runAutomations(at('2043-05-28'));
    await runAutomations(at('2043-05-29'));
    await runAutomations(at('2043-05-29'));
    const early = (await runs()).filter((row) => row.kind === 'reading_before');
    assert.deepEqual(
      early.map((row) => [row.period, row.scheduled_on, row.status]),
      [['2043-06', '2043-05-29', 'done']],
    );
    const before = (await notices()).filter((row) => row.title === 'Sắp đến ngày chốt số');
    assert.equal(before.length, 1);
    assert.equal(before[0].path, '/readings?period=2043-05');
    assert.match(before[0].body, /còn 3\/3 phòng/);
    assert.match(before[0].body, /31\/05\/2043/);
    assert.ok((await emails()).some((row) => row.payload.subject === 'Sắp đến ngày chốt số'));

    // Every room read before the reading day: the reading-day run completes silently.
    await readAll('2043-05', '2043-05-31');
    const count = (await notices()).length;
    await runAutomations(at('2043-05-31'));
    const readingRun = (await runs()).find(
      (row) => row.kind === 'reading' && row.period === '2043-06',
    );
    assert.equal(readingRun.status, 'done');
    assert.equal((await notices()).length, count);

    // 0 days turns the early reminder off.
    await set({ readingReminderDaysBefore: 0 });
    await runAutomations(at('2043-06-30'));
    assert.equal((await runs()).filter((row) => row.kind === 'reading_before').length, 1);
    await call(owner, 'PUT', settingsPath(), { ...settings, readingReminderDaysBefore: 11 }, 400);
  });

  test('next mode: reading reminders fall in the invoice month, after-due waits for the grace period', async () => {
    await updateBuilding({
      readingDayMonth: 'next',
      readingDay: 5,
      issueDay: 6,
      dueDay: 10,
      graceDays: 5,
    });
    await set({ readingReminderDaysBefore: 1 });
    await runAutomations(at('2043-08-04'));
    const early = (await runs()).find(
      (row) => row.kind === 'reading_before' && row.period === '2043-08',
    );
    assert.equal(early.scheduled_on, '2043-08-04');
    const notice = (await notices()).at(-1);
    assert.equal(notice.title, 'Sắp đến ngày chốt số');
    assert.equal(notice.path, '/readings?period=2043-07');
    assert.match(notice.body, /05\/08\/2043/);
    await runAutomations(at('2043-08-05'));
    assert.equal((await notices()).at(-1).title, 'Đến ngày chốt số');

    // Drafts of 2043-09 on its issue day, then issued: due 10/09, overdue from 16/09.
    await runAutomations(at('2043-09-06'));
    const drafts = await InvoiceModel.findAll({
      where: { buildingId: building.id, period: '2043-09', status: 'draft' },
    });
    assert.ok(drafts.some((row) => row.contractId === ready.contract.id));
    await call(owner, 'POST', '/invoices/issue', { ids: drafts.map((row) => row.id) });
    const issued = await InvoiceModel.findOne({
      where: { contractId: ready.contract.id, period: '2043-09' },
    });
    assert.equal(issued.dueOn, '2043-09-10');

    await runAutomations(at('2043-09-09'));
    const beforeDue = (await runs()).find(
      (row) => row.kind === 'before_due' && row.period === '2043-09',
    );
    assert.equal(beforeDue.scheduled_on, '2043-09-09');
    for (const date of ['2043-09-13', '2043-09-15']) await runAutomations(at(date));
    const afterDue = () =>
      runs().then((rows) =>
        rows.filter((row) => row.kind === 'after_due' && row.period === '2043-09'),
      );
    assert.equal((await afterDue()).length, 0);
    await runAutomations(at('2043-09-16'));
    await runAutomations(at('2043-09-16'));
    const [run] = await afterDue();
    assert.equal(run.scheduled_on, '2043-09-16');
    assert.equal(run.status, 'done');
    const overdueMails = (await emails()).filter(
      (row) =>
        row.aggregateId === run.id &&
        row.payload.to === ready.tenant.email &&
        row.payload.subject === 'Hoá đơn đã quá hạn thanh toán',
    );
    assert.equal(overdueMails.length, 1);
    assert.match(overdueMails[0].payload.text, /hạn thanh toán 10\/09\/2043/);
  });
});
