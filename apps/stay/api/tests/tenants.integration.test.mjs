// ST-09 against the live API and seeded database (scripts/test-stay-api-integration.sh).
// Storage runs on the stub provider (no Cloudinary env in tests/CI). All data is fictional.
import assert from 'node:assert/strict';
import { randomInt, randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import {
  AuditLogModel,
  BuildingModel,
  sequelize,
  TenantModel,
} from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const owner = { email: 'owner@stay.local', password: 'stay-owner-123' };
const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toLowerCase();
// 1×1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);
const HEADERS = [
  'Họ tên',
  'Số điện thoại',
  'Email',
  'Số CCCD',
  'Ngày cấp',
  'Ngày sinh',
  'Giới tính',
  'Quê quán',
  'Địa chỉ thường trú',
  'Nghề nghiệp',
  'Ghi chú',
];

/** A fresh fictional phone `08xxxxxxxx` and CCCD `000xxxxxxxxx` per call. */
const uniquePhone = () => `08${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
const uniqueIdNumber = () => `000${String(randomInt(0, 1_000_000_000)).padStart(9, '0')}`;

async function signIn(credentials) {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(credentials),
  });

  assert.equal(response.status, 200, await response.clone().text());
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}

/** `{ status, body }` of one request; `cookie` undefined = signed out. */
async function call(cookie, method, path, body, headers = {}) {
  const form = body instanceof FormData;
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      origin,
      'accept-language': 'vi',
      ...(cookie ? { cookie } : {}),
      ...(body === undefined || form ? {} : { 'content-type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  });
  const text = await response.text();

  return { status: response.status, body: text ? JSON.parse(text) : null };
}

function assertFieldErrors(result, fields) {
  assert.equal(result.status, 400, JSON.stringify(result.body));
  assert.equal(result.body.code, 'input_valid_error');
  for (const field of fields)
    assert.ok(result.body.extensions?.[field]?.[0], `${field}: ${JSON.stringify(result.body)}`);
}

function csvFile(rows, name = 'nguoi-thue.csv') {
  const cell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const text = [HEADERS, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
  const form = new FormData();

  form.append('file', new Blob([`﻿${text}`], { type: 'text/csv' }), name);
  return form;
}

async function createManager(buildingId) {
  const id = randomUUID();
  const email = `tenant-manager-${suffix}@stay.local`;
  const password = 'manager-password-123';

  await sequelize.query(
    `INSERT INTO users (id, email, display_name, email_verified, role, account_status)
     VALUES (:id, :email, 'Quản lý', true, 'manager', 'active');
     INSERT INTO auth_accounts (id, account_id, provider_id, user_id, password)
     VALUES (:accountId, :id, 'credential', :id, :hash);
     INSERT INTO building_members (id, building_id, user_id) VALUES (:memberId, :buildingId, :id);`,
    {
      replacements: {
        id,
        email,
        accountId: randomUUID(),
        memberId: randomUUID(),
        buildingId,
        hash: await bcrypt.hash(password, 10),
      },
    },
  );
  return { email, password };
}

describe('Stay API: tenants, documents, vehicles and import', { skip: !base }, () => {
  let cookie;
  let buildingA;
  let buildingB;

  before(async () => {
    cookie = await signIn(owner);
    buildingA = await BuildingModel.findOne({ where: { code: 'A' } });

    const created = await call(cookie, 'POST', '/api/buildings', {
      code: `T${suffix.slice(0, 4).toUpperCase()}`,
      name: `Toà kiểm thử ${suffix}`,
    });

    assert.equal(created.status, 201, JSON.stringify(created.body));
    buildingB = created.body.data;
  });
  after(() => sequelize.close());

  const createTenant = (body, as = cookie) =>
    call(as, 'POST', '/api/tenants', { buildingId: buildingA.id, ...body });

  test('every endpoint requires a session', async () => {
    const id = randomUUID();
    const routes = [
      ['GET', '/api/tenants'],
      ['POST', '/api/tenants'],
      ['GET', `/api/tenants/${id}`],
      ['PUT', `/api/tenants/${id}`],
      ['POST', `/api/tenants/${id}/reveal-id`],
      ['POST', `/api/tenants/${id}/archive`],
      ['POST', `/api/tenants/${id}/documents`],
      ['POST', `/api/tenants/${id}/vehicles`],
      ['PUT', `/api/tenants/${id}/vehicles/${id}`],
      ['DELETE', `/api/tenants/${id}/vehicles/${id}`],
      ['GET', '/api/tenants/import/template'],
      ['POST', '/api/tenants/import/preview'],
      ['POST', '/api/tenants/import'],
      ['POST', '/api/uploads'],
      ['GET', `/api/uploads/${id}`],
      ['POST', `/api/uploads/${id}/complete`],
    ];

    for (const [method, path] of routes) {
      const result = await call(undefined, method, path, method === 'GET' ? undefined : {});

      assert.equal(result.status, 401, `${method} ${path}`);
    }
  });

  test('seeded tenants of building A are listed with masked CCCD and vehicles', async () => {
    const list = await call(cookie, 'GET', `/api/tenants?buildingId=${buildingA.id}&q=0911000001`);

    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.data[0].fullName, 'Nguyễn Văn An');
    assert.equal(list.body.data[0].idNumberMasked, '000*****0001');
    assert.equal(list.body.data[0].status, 'no_contract');
    assert.equal(list.body.data[0].currentRoom, null);
    assert.equal('idNumber' in list.body.data[0], false);

    const detail = await call(cookie, 'GET', `/api/tenants/${list.body.data[0].id}`);

    assert.equal(detail.body.data.vehicles[0].plate, '59-X1 000.01');
    assert.equal(detail.body.data.contracts.length, 0);
    assert.equal((await TenantModel.count({ where: { buildingId: buildingA.id } })) >= 15, true);
  });

  test('create needs only name and phone; the phone is normalised', async () => {
    const phone = uniquePhone();
    const created = await createTenant({
      fullName: '  Khách   Mới  ',
      phone: `+84 ${phone.slice(1, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`,
    });

    assert.equal(created.status, 201, JSON.stringify(created.body));
    assert.equal(created.body.data.fullName, 'Khách Mới');
    assert.equal(created.body.data.phone, phone);
    assert.equal(created.body.data.buildingId, buildingA.id);
    assert.equal(created.body.data.idNumberMasked, null);
    assert.equal(created.body.data.email, null);
    assert.equal(created.body.data.gender, null);
    assert.equal(created.body.data.status, 'no_contract');
    assert.equal(created.body.data.version, 1);

    const audit = await AuditLogModel.findOne({
      where: { action: 'tenant.create', resourceId: created.body.data.id },
    });
    const serialized = JSON.stringify(audit.changes);

    assert.ok(audit, 'create is audited');
    assert.ok(!serialized.includes(phone) && !serialized.includes('Khách'), serialized);
  });

  test('field errors for every invalid field at once', async () => {
    const result = await createTenant({
      fullName: '',
      phone: '12345',
      email: 'not-an-email',
      idNumber: '12345',
      idIssuedAt: '2026-02-30',
      birthDate: '2999-01-01',
      gender: 'robot',
    });

    assertFieldErrors(result, [
      'fullName',
      'phone',
      'email',
      'idNumber',
      'idIssuedAt',
      'birthDate',
      'gender',
    ]);
    assert.match(result.body.extensions.phone[0], /10 chữ số/);

    const unknownBuilding = await call(cookie, 'POST', '/api/tenants', {
      buildingId: randomUUID(),
      fullName: 'A',
      phone: uniquePhone(),
    });

    assertFieldErrors(unknownBuilding, ['buildingId']);
  });

  test('duplicate CCCD is a field error that links the existing profile', async () => {
    const idNumber = uniqueIdNumber();
    const first = await createTenant({ fullName: 'Người Có CCCD', phone: uniquePhone(), idNumber });

    assert.equal(first.status, 201, JSON.stringify(first.body));
    assert.equal(
      first.body.data.idNumberMasked,
      `${idNumber.slice(0, 3)}*****${idNumber.slice(-4)}`,
    );

    const duplicate = await createTenant({
      fullName: 'Người Trùng',
      phone: uniquePhone(),
      idNumber: `${idNumber.slice(0, 4)} ${idNumber.slice(4, 8)} ${idNumber.slice(8)}`,
    });

    assertFieldErrors(duplicate, ['idNumber']);
    assert.match(duplicate.body.extensions.idNumber[0], /CCCD/);
    assert.deepEqual(duplicate.body.extensions.duplicateTenant, {
      field: 'idNumber',
      tenantId: first.body.data.id,
    });

    // Its own CCCD is not a duplicate when editing.
    const updated = await call(cookie, 'PUT', `/api/tenants/${first.body.data.id}`, {
      fullName: 'Người Có CCCD',
      phone: first.body.data.phone,
      idNumber,
      version: 1,
    });

    assert.equal(updated.status, 200, JSON.stringify(updated.body));
  });

  test('reveal returns the full CCCD and is audited without it', async () => {
    const idNumber = uniqueIdNumber();
    const created = await createTenant({
      fullName: 'Người Xem CCCD',
      phone: uniquePhone(),
      idNumber,
    });
    const id = created.body.data.id;
    const detail = await call(cookie, 'GET', `/api/tenants/${id}`);

    assert.equal(JSON.stringify(detail.body).includes(idNumber), false);

    const before = await AuditLogModel.count({
      where: { action: 'tenant.reveal_id_number', resourceId: id },
    });
    const revealed = await call(cookie, 'POST', `/api/tenants/${id}/reveal-id`);

    assert.equal(revealed.status, 200);
    assert.deepEqual(revealed.body.data, { idNumber });

    const audits = await AuditLogModel.findAll({
      where: { action: 'tenant.reveal_id_number', resourceId: id },
    });

    assert.equal(audits.length, before + 1);
    for (const row of await AuditLogModel.findAll({ where: { resourceId: id } }))
      assert.equal(JSON.stringify(row.changes).includes(idNumber), false, row.action);
  });

  test('update with optimistic locking keeps the CCCD when it is left out', async () => {
    const idNumber = uniqueIdNumber();
    const phone = uniquePhone();
    const created = await createTenant({ fullName: 'Người Sửa', phone, idNumber });
    const id = created.body.data.id;
    const updated = await call(cookie, 'PUT', `/api/tenants/${id}`, {
      fullName: 'Người Đã Sửa',
      phone,
      email: 'NGUOI.SUA@example.com',
      birthDate: '01/02/2000',
      gender: 'female',
      occupation: 'Kế toán',
      version: 1,
    });

    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.data.fullName, 'Người Đã Sửa');
    assert.equal(updated.body.data.email, 'nguoi.sua@example.com');
    assert.equal(updated.body.data.birthDate, '2000-02-01');
    assert.equal(updated.body.data.gender, 'female');
    assert.equal(updated.body.data.version, 2);
    assert.equal((await TenantModel.findByPk(id)).idNumber, idNumber);

    const audit = await AuditLogModel.findOne({
      where: { action: 'tenant.update', resourceId: id },
      order: [['createdAt', 'DESC']],
    });

    assert.deepEqual([...audit.changes.changedFields].sort(), [
      'birthDate',
      'email',
      'fullName',
      'gender',
      'occupation',
    ]);

    const stale = await call(cookie, 'PUT', `/api/tenants/${id}`, {
      fullName: 'Cũ',
      phone,
      version: 1,
    });

    assert.equal(stale.status, 409);
    assert.equal(stale.body.code, 'version_conflict');

    const cleared = await call(cookie, 'PUT', `/api/tenants/${id}`, {
      fullName: 'Người Đã Sửa',
      phone,
      idNumber: null,
      version: 2,
    });

    assert.equal(cleared.body.data.idNumberMasked, null);
  });

  test('list: search by name, phone and the last 4 CCCD digits; status filters', async () => {
    const idNumber = uniqueIdNumber();
    const phone = uniquePhone();
    const name = `Tìm Kiếm ${suffix}`;
    const created = await createTenant({ fullName: name, phone, idNumber });
    const ids = async (query) =>
      (
        await call(cookie, 'GET', `/api/tenants?buildingId=${buildingA.id}&pageSize=100&${query}`)
      ).body.data.map((row) => row.id);

    assert.ok((await ids(`q=${encodeURIComponent(name)}`)).includes(created.body.data.id));
    assert.ok((await ids(`q=${phone.slice(2, 8)}`)).includes(created.body.data.id));
    assert.ok((await ids(`q=${idNumber.slice(-4)}`)).includes(created.body.data.id));
    const byName = `q=${encodeURIComponent(name)}`;

    assert.ok((await ids(`${byName}&status=no_contract`)).includes(created.body.data.id));
    assert.deepEqual(await ids('status=living'), []);
    assert.deepEqual(await ids('status=left'), []);

    const bad = await call(cookie, 'GET', '/api/tenants?status=gone');

    assert.equal(bad.status, 400);
    assert.equal(
      (await call(cookie, 'GET', `/api/tenants?buildingId=${'x'.repeat(36)}`)).status,
      400,
    );

    const page = await call(cookie, 'GET', `/api/tenants?buildingId=${buildingA.id}&pageSize=5`);

    assert.equal(page.body.data.length, 5);
    assert.ok(page.body.meta.total >= 15);
  });

  test('vehicles: add, duplicate plate, update and delete', async () => {
    const created = await createTenant({ fullName: 'Người Có Xe', phone: uniquePhone() });
    const id = created.body.data.id;
    const added = await call(cookie, 'POST', `/api/tenants/${id}/vehicles`, {
      plate: ' 59-x1  123.45 ',
      type: 'motorbike',
    });

    assert.equal(added.status, 201, JSON.stringify(added.body));
    assert.equal(added.body.data.plate, '59-X1 123.45');

    const duplicate = await call(cookie, 'POST', `/api/tenants/${id}/vehicles`, {
      plate: '59X112345',
      type: 'motorbike',
    });

    assertFieldErrors(duplicate, ['plate']);

    const invalid = await call(cookie, 'POST', `/api/tenants/${id}/vehicles`, {
      plate: '!!',
      type: 'tank',
    });

    assertFieldErrors(invalid, ['plate', 'type']);

    const updated = await call(cookie, 'PUT', `/api/tenants/${id}/vehicles/${added.body.data.id}`, {
      plate: '59-X1 123.46',
      type: 'electric_bike',
      note: 'Xe điện',
    });

    assert.equal(updated.status, 200, JSON.stringify(updated.body));
    assert.equal(updated.body.data.type, 'electric_bike');

    const removed = await call(
      cookie,
      'DELETE',
      `/api/tenants/${id}/vehicles/${added.body.data.id}`,
    );

    assert.equal(removed.status, 200);
    assert.equal((await call(cookie, 'GET', `/api/tenants/${id}`)).body.data.vehicles.length, 0);
    assert.equal(
      (await call(cookie, 'DELETE', `/api/tenants/${id}/vehicles/${added.body.data.id}`)).status,
      404,
    );
  });

  test('CCCD images: private upload, signed short-lived URL, no public access', async () => {
    const created = await createTenant({ fullName: 'Người Có Ảnh', phone: uniquePhone() });
    const id = created.body.data.id;

    const upload = async (bytes = PNG) => {
      const ticket = await call(cookie, 'POST', '/api/uploads', {
        purpose: 'tenant_document',
        buildingId: buildingA.id,
      });

      assert.equal(ticket.status, 201, JSON.stringify(ticket.body));
      assert.equal(JSON.stringify(ticket.body).includes('private/'), false, 'no storage id');

      const form = new FormData();

      form.append('file', new Blob([bytes], { type: 'image/png' }), 'cccd.png');

      // The browser posts the file without cookies; the signed URL is the authorisation.
      const stored = await fetch(new URL(ticket.body.data.uploadUrl, base), {
        method: 'POST',
        body: form,
      });

      return { ticket: ticket.body.data, stored };
    };

    const tampered = await upload();
    const badUrl = new URL(tampered.ticket.uploadUrl, base);

    badUrl.searchParams.set('signature', 'forged');
    assert.equal(
      (await fetch(badUrl, { method: 'POST', body: csvFile([]) })).status,
      403,
      'forged upload signature',
    );

    const notImage = await upload(Buffer.from('not an image'));

    assert.equal(notImage.stored.status, 400);

    const { ticket, stored } = await upload();

    assert.equal(stored.status, 200, await stored.clone().text());

    const completed = await call(cookie, 'POST', `/api/uploads/${ticket.id}/complete`);

    assert.equal(completed.status, 200, JSON.stringify(completed.body));
    assert.equal(completed.body.data.status, 'completed');

    const fileId = completed.body.data.fileId;
    const again = await call(cookie, 'POST', `/api/uploads/${ticket.id}/complete`);

    assert.equal(again.body.data.fileId, fileId);

    const attached = await call(cookie, 'POST', `/api/tenants/${id}/documents`, {
      kind: 'id_front',
      fileId,
    });

    assert.equal(attached.status, 201, JSON.stringify(attached.body));
    assert.ok(attached.body.data.url);

    const detail = await call(cookie, 'GET', `/api/tenants/${id}`);
    const document = detail.body.data.documents[0];
    const signedUrl = new URL(document.url, base);

    assert.equal(document.kind, 'id_front');
    assert.ok(new Date(document.urlExpiresAt).getTime() - Date.now() <= 300_000);

    const image = await fetch(signedUrl);

    assert.equal(image.status, 200);
    assert.equal(image.headers.get('content-type'), 'image/png');
    assert.match(image.headers.get('cache-control'), /no-store/);
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), PNG);

    // Without, with a forged or with an expired signature: no access.
    const publicUrl = new URL(`/api/files/${fileId}/stub`, base);
    const forged = new URL(signedUrl);
    const expired = new URL(signedUrl);

    forged.searchParams.set('signature', `${forged.searchParams.get('signature')}x`);
    expired.searchParams.set('expires', String(Math.floor(Date.now() / 1000) - 10));
    for (const url of [publicUrl, forged, expired]) assert.equal((await fetch(url)).status, 403);

    // The audit keeps neither URLs nor storage ids.
    for (const row of await AuditLogModel.findAll({ where: { resourceType: 'tenant_document' } }))
      assert.equal(/stub|signature|private\//.test(JSON.stringify(row.changes)), false);

    // A new front image replaces the old one.
    const second = await upload();

    await call(cookie, 'POST', `/api/uploads/${second.ticket.id}/complete`);

    const secondFile = (await call(cookie, 'GET', `/api/uploads/${second.ticket.id}`)).body.data
      .fileId;
    const replaced = await call(cookie, 'POST', `/api/tenants/${id}/documents`, {
      kind: 'id_front',
      fileId: secondFile,
    });

    assert.equal(replaced.status, 201);
    assert.deepEqual(
      (await call(cookie, 'GET', `/api/tenants/${id}`)).body.data.documents.map((d) => d.fileId),
      [secondFile],
    );

    // A file of another building cannot be attached here.
    const ticketB = await call(cookie, 'POST', '/api/uploads', {
      purpose: 'tenant_document',
      buildingId: buildingB.id,
    });
    const formB = new FormData();

    formB.append('file', new Blob([PNG], { type: 'image/png' }), 'b.png');
    await fetch(new URL(ticketB.body.data.uploadUrl, base), { method: 'POST', body: formB });
    await call(cookie, 'POST', `/api/uploads/${ticketB.body.data.id}/complete`);

    const fileB = (await call(cookie, 'GET', `/api/uploads/${ticketB.body.data.id}`)).body.data
      .fileId;

    assertFieldErrors(
      await call(cookie, 'POST', `/api/tenants/${id}/documents`, {
        kind: 'id_back',
        fileId: fileB,
      }),
      ['fileId'],
    );
  });

  test('import: a 200-row file with scattered errors, then an idempotent commit', async () => {
    const existing = await createTenant({
      fullName: 'Đã Có Hồ Sơ',
      phone: uniquePhone(),
      idNumber: uniqueIdNumber(),
    });
    const existingIdNumber = (await TenantModel.findByPk(existing.body.data.id)).idNumber;
    const rows = Array.from({ length: 200 }, (_, index) => [
      `Người Nhập ${suffix} ${index + 1}`,
      uniquePhone(),
      '',
      index % 3 === 0 ? uniqueIdNumber() : '',
      '',
      index % 4 === 0 ? '15/06/1999' : '',
      index % 5 === 0 ? 'Nữ' : '',
      '',
      '',
      '',
      '',
    ]);
    // Scattered problems; file lines are index + 2 (line 1 is the header).
    rows[9][1] = '12345'; // line 11: phone
    rows[49][0] = ''; // line 51: name
    rows[49][3] = '99'; // line 51: CCCD too
    rows[99][5] = '31/02/2000'; // line 101: birth date
    rows[149][6] = 'robot'; // line 151: gender
    rows[179][3] = existingIdNumber; // line 181: CCCD already used
    rows[198][1] = rows[197][1]; // line 200: same phone as line 199

    const preview = await call(
      cookie,
      'POST',
      `/api/tenants/import/preview?buildingId=${buildingA.id}`,
      csvFile(rows),
    );

    assert.equal(preview.status, 200, JSON.stringify(preview.body).slice(0, 500));

    const result = preview.body.data;
    const byLine = new Map(result.rows.map((row) => [row.line, row]));
    const columns = (line) =>
      byLine
        .get(line)
        .errors.map((error) => error.column)
        .sort();

    assert.equal(result.totalRows, 200);
    assert.equal(result.errorCount, 4);
    assert.equal(result.duplicateCount, 2);
    assert.equal(result.validCount, 194);
    assert.deepEqual(columns(11), ['phone']);
    assert.deepEqual(columns(51), ['fullName', 'idNumber']);
    assert.deepEqual(columns(101), ['birthDate']);
    assert.deepEqual(columns(151), ['gender']);
    assert.match(byLine.get(11).errors[0].message, /10 chữ số/);
    assert.deepEqual(byLine.get(181).duplicate, {
      field: 'idNumber',
      tenantId: existing.body.data.id,
    });
    assert.deepEqual(byLine.get(200).duplicate, { field: 'phone', tenantId: null });
    assert.equal(byLine.get(2).status, 'valid');
    assert.equal(byLine.get(6).values.gender, undefined);
    assert.equal(byLine.get(7).values.gender, 'Nữ');

    // Nothing was written by the preview.
    const prefix = `Người Nhập ${suffix}`;
    const countImported = async () => {
      const row = await sequelize.query(
        'SELECT count(*)::int AS n FROM tenants WHERE full_name LIKE :prefix',
        { replacements: { prefix: `${prefix}%` }, plain: true },
      );

      return row.n;
    };

    assert.equal(await countImported(), 0);

    const body = {
      buildingId: buildingA.id,
      rows: result.rows.map(({ line, values }) => ({ line, values })),
    };
    const key = `import-${randomUUID()}`;
    const committed = await call(cookie, 'POST', '/api/tenants/import', body, {
      'idempotency-key': key,
    });

    assert.equal(committed.status, 201, JSON.stringify(committed.body).slice(0, 500));
    assert.equal(committed.body.data.createdCount, 194);
    assert.equal(committed.body.data.skippedCount, 6);
    assert.equal(committed.body.data.replayed, false);
    assert.equal(await countImported(), 194);

    const imported = await TenantModel.findOne({ where: { fullName: `${prefix} 1` } });

    assert.equal(imported.birthDate, '1999-06-15');
    assert.equal(imported.gender, 'female');
    assert.equal(imported.email, null, 'missing values stay empty');

    // Same key and body: the stored result, nothing created again.
    const replay = await call(cookie, 'POST', '/api/tenants/import', body, {
      'idempotency-key': key,
    });

    assert.equal(replay.status, 201);
    assert.equal(replay.body.data.replayed, true);
    assert.deepEqual(replay.body.data.tenantIds, committed.body.data.tenantIds);
    assert.equal(await countImported(), 194);

    // Same key, other body: conflict.
    const conflict = await call(
      cookie,
      'POST',
      '/api/tenants/import',
      { ...body, rows: body.rows.slice(1) },
      { 'idempotency-key': key },
    );

    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.code, 'idempotency_conflict');

    // A new key on the same rows creates nothing: every row is now a duplicate.
    const again = await call(cookie, 'POST', '/api/tenants/import', body, {
      'idempotency-key': `import-${randomUUID()}`,
    });

    assert.equal(again.body.data.createdCount, 0);
    assert.equal(await countImported(), 194);

    const missingKey = await call(cookie, 'POST', '/api/tenants/import', body);

    assertFieldErrors(missingKey, ['idempotencyKey']);

    const audit = await AuditLogModel.findOne({
      where: { action: 'tenant.import' },
      order: [['createdAt', 'DESC']],
    });

    assert.equal(audit.changes.createdCount, 0);
    assert.equal(JSON.stringify(audit.changes).includes(prefix), false);
  });

  test('import: XLSX files, templates and file-level errors', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Người thuê');
    const phone = uniquePhone();

    sheet.addRow(HEADERS);
    sheet.addRow([`Xlsx ${suffix}`, phone, '', '', new Date(Date.UTC(2020, 0, 2)), '', 'Nam']);
    sheet.addRow([`Xlsx Lỗi ${suffix}`, 912345678]);

    const form = new FormData();

    form.append('file', new Blob([await workbook.xlsx.writeBuffer()]), 'nguoi-thue.xlsx');

    const preview = await call(
      cookie,
      'POST',
      `/api/tenants/import/preview?buildingId=${buildingA.id}`,
      form,
    );

    assert.equal(preview.status, 200, JSON.stringify(preview.body));
    assert.deepEqual(
      preview.body.data.rows.map((row) => row.status),
      ['valid', 'error'],
    );
    assert.equal(preview.body.data.rows[0].values.idIssuedAt, '02/01/2020');
    assert.equal(preview.body.data.rows[1].errors[0].column, 'phone');

    const unknownColumn = new FormData();

    unknownColumn.append(
      'file',
      new Blob(['Họ tên,Số điện thoại,Phòng\r\nA,0912345678,101']),
      'x.csv',
    );

    const unknown = await call(
      cookie,
      'POST',
      `/api/tenants/import/preview?buildingId=${buildingA.id}`,
      unknownColumn,
    );

    assert.equal(unknown.status, 400);
    assert.equal(unknown.body.code, 'import_unknown_columns');
    assert.deepEqual(unknown.body.extensions.columns, ['Phòng']);

    const wrongType = new FormData();

    wrongType.append('file', new Blob(['x']), 'x.pdf');
    assertFieldErrors(
      await call(
        cookie,
        'POST',
        `/api/tenants/import/preview?buildingId=${buildingA.id}`,
        wrongType,
      ),
      ['file'],
    );

    for (const format of ['csv', 'xlsx']) {
      const response = await fetch(`${base}/api/tenants/import/template?format=${format}`, {
        headers: { cookie, origin },
      });

      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-disposition'), new RegExp(`\\.${format}"?$`));

      const bytes = Buffer.from(await response.arrayBuffer());

      if (format === 'csv') assert.ok(bytes.toString('utf8').includes('Họ tên'));
      else {
        const template = new ExcelJS.Workbook();

        await template.xlsx.load(bytes);
        assert.equal(template.worksheets[0].getRow(1).getCell(2).value, 'Số điện thoại');
      }
    }
  });

  test('managers only reach tenants of their buildings; import is for owners', async () => {
    const tenantB = await call(cookie, 'POST', '/api/tenants', {
      buildingId: buildingB.id,
      fullName: 'Ở Toà Khác',
      phone: uniquePhone(),
      idNumber: uniqueIdNumber(),
    });

    assert.equal(tenantB.status, 201, JSON.stringify(tenantB.body));

    const manager = await signIn(await createManager(buildingA.id));
    const list = await call(manager, 'GET', '/api/tenants?pageSize=100');

    assert.equal(list.status, 200);
    assert.ok(list.body.data.every((row) => row.buildingId === buildingA.id));
    assert.equal(
      (await call(manager, 'GET', `/api/tenants?buildingId=${buildingB.id}`)).body.data.length,
      0,
    );
    assert.equal((await call(manager, 'GET', `/api/tenants/${tenantB.body.data.id}`)).status, 404);
    assert.equal(
      (await call(manager, 'POST', `/api/tenants/${tenantB.body.data.id}/reveal-id`)).status,
      404,
    );
    assert.equal(
      (
        await call(manager, 'PUT', `/api/tenants/${tenantB.body.data.id}`, {
          fullName: 'X',
          phone: uniquePhone(),
          version: 1,
        })
      ).status,
      404,
    );
    assertFieldErrors(
      await call(manager, 'POST', '/api/tenants', {
        buildingId: buildingB.id,
        fullName: 'Không Được',
        phone: uniquePhone(),
      }),
      ['buildingId'],
    );
    assert.equal(
      (
        await call(manager, 'POST', '/api/uploads', {
          purpose: 'tenant_document',
          buildingId: buildingB.id,
        })
      ).status,
      404,
    );

    // The duplicate CCCD error does not link a profile the manager cannot open.
    const revealed = await call(cookie, 'POST', `/api/tenants/${tenantB.body.data.id}/reveal-id`);
    const duplicate = await createTenant(
      { fullName: 'Trùng Toà Khác', phone: uniquePhone(), idNumber: revealed.body.data.idNumber },
      manager,
    );

    assertFieldErrors(duplicate, ['idNumber']);
    assert.deepEqual(duplicate.body.extensions.duplicateTenant, {
      field: 'idNumber',
      tenantId: null,
    });

    // Managers create and edit tenants of their building, but import is owner-only.
    const own = await createTenant({ fullName: 'Của Quản Lý', phone: uniquePhone() }, manager);

    assert.equal(own.status, 201);
    assert.equal(
      (
        await call(
          manager,
          'POST',
          `/api/tenants/import/preview?buildingId=${buildingA.id}`,
          csvFile([]),
        )
      ).status,
      403,
    );
    assert.equal((await call(manager, 'GET', '/api/tenants/import/template')).status, 403);
  });

  test('archive hides the profile and blocks further changes', async () => {
    const created = await createTenant({ fullName: 'Người Lưu Trữ', phone: uniquePhone() });
    const id = created.body.data.id;
    const archived = await call(cookie, 'POST', `/api/tenants/${id}/archive`);

    assert.equal(archived.status, 200, JSON.stringify(archived.body));
    assert.ok(archived.body.data.archivedAt);

    const active = await call(
      cookie,
      'GET',
      `/api/tenants?buildingId=${buildingA.id}&pageSize=100&q=Người Lưu Trữ`,
    );
    const listed = await call(
      cookie,
      'GET',
      `/api/tenants?buildingId=${buildingA.id}&status=archived&pageSize=100`,
    );

    assert.equal(
      active.body.data.some((row) => row.id === id),
      false,
    );
    assert.equal(
      listed.body.data.some((row) => row.id === id),
      true,
    );
    assert.equal((await call(cookie, 'POST', `/api/tenants/${id}/archive`)).status, 409);

    const edit = await call(cookie, 'PUT', `/api/tenants/${id}`, {
      fullName: 'X',
      phone: created.body.data.phone,
      version: archived.body.data.version,
    });

    assert.equal(edit.status, 409);
    assert.equal(edit.body.code, 'tenant_archived');
  });
});
