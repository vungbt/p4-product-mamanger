// ST-30a online contracts: CI Postgres/API only. This suite never starts infrastructure.
// Uses its own building, new rooms and far-future contracts (2044) so seed data does not interfere.
import assert from 'node:assert/strict';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { after, before, describe, test } from 'node:test';
import { AuditLogModel, sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();
const COOKIE = 'stay_portal_session';
const OWNER_PASSWORD = 'stay-owner-123';
// 1×1 transparent PNG (a drawn signature).
const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

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
      ...(cookie ? { cookie } : {}),
      ...(body === undefined || method === 'GET' ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined || method === 'GET' ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json(), headers: response.headers };
}

async function upload(cookie, path, fields, file, name, type) {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  if (file) form.append('file', new Blob([file], { type }), name);
  const response = await fetch(`${base}/api${path}`, {
    method: 'POST',
    headers: { origin, ...(cookie ? { cookie } : {}) },
    body: form,
  });
  return { status: response.status, body: await response.json() };
}

async function download(cookie, path) {
  const response = await fetch(`${base}/api${path}`, { headers: { origin, cookie } });

  assert.equal(response.status, 200, await response.clone().text());
  return Buffer.from(await response.arrayBuffer());
}

function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body.data;
}

function failed(result, status, code) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  if (code) assert.equal(result.body.code, code, JSON.stringify(result.body));
  return result.body;
}

const randomPhone = () => `09${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
const randomIdNumber = () => `0${String(randomInt(0, 100_000_000_000)).padStart(11, '0')}`;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

describe('ST-30a online contracts', { skip: !base }, () => {
  let owner;
  let building;
  let template;
  let roomNumber = 0;

  /** Room + active 2044 contract (rent 3.500.000, deposit 7.000.000) + a portal per occupant. */
  async function leased(people = [{ fullName: 'Nguyễn Văn An', idNumber: null }]) {
    roomNumber += 1;
    const room = ok(
      await call(owner, 'POST', `/buildings/${building.id}/rooms`, {
        code: `H${roomNumber}`,
        floor: 2,
        listPrice: 3500000,
        maxOccupants: 4,
        initialElectric: 0,
        initialWater: 0,
      }),
      201,
    );
    const tenants = [];

    for (const person of people) {
      const phone = randomPhone();
      const tenant = ok(
        await call(owner, 'POST', '/tenants', {
          buildingId: building.id,
          fullName: person.fullName,
          phone,
          ...(person.idNumber ? { idNumber: person.idNumber } : {}),
        }),
        201,
      );
      tenants.push({ ...tenant, phone });
    }
    const draft = ok(
      await call(owner, 'POST', '/contracts', {
        roomId: room.id,
        startDate: '2044-01-01',
        endDate: '2044-12-31',
        rent: 3500000,
        depositAmount: 7000000,
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

    for (const tenant of tenants) {
      const link = ok(
        await call(owner, 'POST', `/contracts/${contract.id}/portal-links`, {
          tenantId: tenant.id,
        }),
        201,
      );
      const session = await fetch(`${base}/api/portal/sessions`, {
        method: 'POST',
        headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify({ token: link.path.slice(3), phoneLast4: tenant.phone.slice(-4) }),
      });

      assert.equal(session.status, 201, await session.clone().text());
      tenant.cookie = session.headers
        .getSetCookie()
        .find((c) => c.startsWith(`${COOKIE}=`))
        ?.split(';')[0];
    }
    return { room, tenants, contract };
  }

  const newDocument = async (contract) =>
    ok(
      await call(owner, 'POST', `/contracts/${contract.id}/documents`, { templateId: template.id }),
      201,
    );

  before(async () => {
    owner = await signIn('owner@stay.local', OWNER_PASSWORD);
    building = ok(
      await call(owner, 'POST', '/buildings', {
        code: `D${suffix}`,
        name: `Documents ${suffix}`,
        address: `30 Đường Hợp Đồng ${suffix}`,
        contactPhone: '0901234567',
        bankBin: '970436',
        bankAccount: '0123456789',
        bankAccountName: 'NGUYEN VAN CHU',
      }),
      201,
    );
    const profile = ok(await call(owner, 'GET', '/settings/landlord'));

    ok(
      await call(owner, 'PUT', '/settings/landlord', {
        fullName: 'Nguyễn Văn Chủ',
        birthDate: '1975-01-01',
        idNumber: '079075000123',
        idIssuedAt: '2021-01-01',
        permanentAddress: 'Quận 1, TP.HCM',
        phone: '0901234567',
        signatureImage: PNG_DATA_URL,
        version: profile.version,
      }),
    );
    template = ok(
      await call(owner, 'POST', '/contract-templates', {
        source: 'default',
        buildingId: building.id,
        name: `Mẫu ${suffix}`,
      }),
      201,
    );
  });

  after(async () => {
    await sequelize.close();
  });

  test('landlord profile keeps CCCD and signature private in audit', async () => {
    const profile = ok(await call(owner, 'GET', '/settings/landlord'));

    assert.equal(profile.idNumber, '079075000123');
    assert.match(profile.signatureImage, /^data:image\/png;base64,/);
    failed(
      await call(owner, 'PUT', '/settings/landlord', {
        fullName: 'X',
        signatureImage: 'data:image/png;base64,AAAA',
        version: profile.version,
      }),
      400,
      'input_valid_error',
    );
    const rows = await AuditLogModel.findAll({
      where: { resourceType: 'landlord_profile' },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });
    const text = JSON.stringify(rows.map((row) => row.changes));

    assert.ok(rows.length > 0);
    assert.ok(!text.includes('079075000123'));
    assert.ok(!text.includes('base64'));
  });

  test('templates: default copy, versions, variables and preview', async () => {
    assert.equal(template.activeVersion, 1);
    assert.ok(template.bodyHtml.includes('{{hop_dong.gia_thue_bang_chu}}'));
    const variables = ok(await call(owner, 'GET', '/contract-template-variables'));

    assert.ok(variables.some((item) => item.key === 'ben_thue.cccd' && item.required));
    const saved = ok(
      await call(owner, 'POST', `/contract-templates/${template.id}/versions`, {
        bodyHtml: `${template.bodyHtml}<p onclick="x()">Ghi chú <script>alert(1)</script>{{khong_co}}</p>`,
        note: 'Thêm ghi chú',
        version: template.version,
      }),
      201,
    );

    assert.equal(saved.activeVersion, 2);
    assert.equal(saved.versions.length, 2);
    assert.ok(!saved.bodyHtml.includes('script') && !saved.bodyHtml.includes('onclick'));
    const preview = ok(
      await call(owner, 'POST', `/contract-templates/${template.id}/preview`, {
        bodyHtml: saved.bodyHtml,
      }),
    );

    assert.deepEqual(preview.unknown, ['khong_co']);
    assert.ok(preview.html.includes('Ba triệu năm trăm nghìn đồng'));
    // Restore the default body for the documents below (version 3).
    template = ok(
      await call(owner, 'POST', `/contract-templates/${template.id}/versions`, {
        bodyHtml: template.bodyHtml,
        version: saved.version,
      }),
      201,
    );
    const list = ok(await call(owner, 'GET', `/contract-templates?buildingId=${building.id}`));

    assert.ok(list.some((item) => item.id === template.id && item.activeVersion === 3));
  });

  test('Word import converts, sanitizes and highlights blanks; rejects non-docx', async () => {
    const docx = await readFile(new URL('./fixtures/contract-template.docx', import.meta.url));
    const result = ok(
      await upload(
        owner,
        '/contract-templates/import-docx',
        {},
        docx,
        'hop-dong.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    );

    assert.ok(result.bodyHtml.includes('<h1>HỢP ĐỒNG THUÊ NHÀ</h1>'));
    assert.ok(result.bodyHtml.includes('<table>'));
    assert.ok(result.bodyHtml.includes('text-align:center'));
    assert.ok(result.bodyHtml.includes('<mark data-blank="">[Họ tên]</mark>'));
    assert.equal(result.blanks, 4);
    failed(
      await upload(
        owner,
        '/contract-templates/import-docx',
        {},
        Buffer.from('%PDF-1.4 not word'),
        'x.docx',
        'application/pdf',
      ),
      400,
      'input_valid_error',
    );
    const imported = ok(
      await call(owner, 'POST', '/contract-templates', {
        source: 'html',
        bodyHtml: result.bodyHtml,
        name: `Word ${suffix}`,
        buildingId: building.id,
      }),
      201,
    );

    assert.ok(imported.bodyHtml.includes('data-blank'));
  });

  test('missing CCCD blocks sending; regenerate after fixing; amounts in words', async () => {
    const { contract, tenants } = await leased();
    const document = await newDocument(contract);

    assert.equal(document.status, 'draft');
    assert.deepEqual(document.missing, ['ben_thue.cccd']);
    assert.ok(document.bodyHtml.includes('Ba triệu năm trăm nghìn đồng'));
    assert.ok(document.bodyHtml.includes('Bảy triệu đồng'));
    assert.ok(document.bodyHtml.includes('Nguyễn Văn Chủ'));
    const blocked = failed(
      await call(owner, 'POST', `/documents/${document.id}/send`, { version: document.version }),
      422,
      'document_missing_fields',
    );

    assert.deepEqual(blocked.extensions.missing, ['ben_thue.cccd']);
    const tenant = ok(await call(owner, 'GET', `/tenants/${tenants[0].id}`));

    ok(
      await call(owner, 'PUT', `/tenants/${tenant.id}`, {
        fullName: tenant.fullName,
        phone: tenants[0].phone,
        idNumber: randomIdNumber(),
        version: tenant.version,
      }),
    );
    const refreshed = ok(
      await call(owner, 'PUT', `/documents/${document.id}`, {
        regenerate: true,
        version: document.version,
      }),
    );

    assert.deepEqual(refreshed.missing, []);
    const sent = ok(
      await call(owner, 'POST', `/documents/${document.id}/send`, { version: refreshed.version }),
    );

    assert.equal(sent.status, 'sent');
    assert.match(sent.dataSha256, /^[0-9a-f]{64}$/);
  });

  test('send → tenants sign in the portal → owner signs → final PDF + evidence + verify', async () => {
    const { contract, tenants } = await leased([
      { fullName: 'Trần Thị Bình', idNumber: randomIdNumber() },
      { fullName: 'Lê Văn Cường', idNumber: randomIdNumber() },
    ]);
    const document = await newDocument(contract);
    const sent = ok(
      await call(owner, 'POST', `/documents/${document.id}/send`, {
        version: document.version,
        coSignerTenantIds: [tenants[1].id],
      }),
    );

    assert.equal(sent.signers.length, 2);
    assert.deepEqual(
      sent.signers.map((signer) => [signer.name, signer.required]),
      [
        ['Trần Thị Bình', true],
        ['Lê Văn Cường', false],
      ],
    );
    // Edits after sending are refused; contract changes do not touch the document.
    failed(
      await call(owner, 'PUT', `/documents/${document.id}`, {
        bodyHtml: '<p>Sửa</p>',
        version: sent.version,
      }),
      409,
      'document_locked',
    );
    const current = ok(await call(owner, 'GET', `/contracts/${contract.id}`));

    ok(
      await call(owner, 'POST', `/contracts/${contract.id}/rent-change`, {
        effectiveDate: '2044-03-01',
        rent: 4000000,
        version: current.version,
      }),
    );
    assert.equal(ok(await call(owner, 'GET', `/documents/${document.id}`)).bodyHtml, sent.bodyHtml);

    const [primary, other] = tenants;
    const list = ok(await call(primary.cookie, 'GET', '/portal/documents'));

    assert.equal(list[0].id, document.id);
    assert.equal(list[0].awaitingMe, true);
    const opened = ok(await call(primary.cookie, 'GET', `/portal/documents/${document.id}`));

    assert.equal(opened.status, 'viewed');
    assert.ok(opened.bodyHtml.includes('Trần Thị Bình'));
    const signBody = {
      fullName: '  trần THỊ   bình ',
      phoneLast4: primary.phone.slice(-4),
      agree: true,
      method: 'drawn',
      signatureImage: PNG_DATA_URL,
    };

    failed(
      await call(primary.cookie, 'POST', `/portal/documents/${document.id}/sign`, {
        ...signBody,
        phoneLast4: primary.phone.slice(-4) === '0000' ? '1111' : '0000',
      }),
      422,
      'document_sign_phone_mismatch',
    );
    failed(
      await call(primary.cookie, 'POST', `/portal/documents/${document.id}/sign`, {
        ...signBody,
        agree: false,
      }),
      400,
      'input_valid_error',
    );
    const signed = ok(
      await call(primary.cookie, 'POST', `/portal/documents/${document.id}/sign`, signBody),
    );

    assert.equal(signed.status, 'signed_by_tenant');
    assert.equal(signed.myStatus, 'signed');
    // The optional co-signer may still sign before the owner (typed signature).
    ok(
      await call(other.cookie, 'POST', `/portal/documents/${document.id}/sign`, {
        fullName: 'Lê Văn Cường',
        phoneLast4: other.phone.slice(-4),
        agree: true,
        method: 'typed',
      }),
    );
    let detail = ok(await call(owner, 'GET', `/documents/${document.id}`));

    assert.equal(detail.status, 'signed_by_tenant');
    failed(
      await call(owner, 'POST', `/documents/${document.id}/owner-sign`, {
        password: 'wrong-password-1',
        version: detail.version,
      }),
      422,
      'password_invalid',
    );
    detail = ok(
      await call(owner, 'POST', `/documents/${document.id}/owner-sign`, {
        password: OWNER_PASSWORD,
        version: detail.version,
      }),
    );

    assert.equal(detail.status, 'completed');
    assert.ok(detail.hasPdf);
    assert.ok(detail.signers.every((signer) => signer.status === 'signed'));
    assert.deepEqual(
      detail.events.map((event) => event.type).filter((type) => type !== 'verification_failed'),
      ['created', 'sent', 'viewed', 'signed', 'signed', 'owner_signed', 'completed'],
    );
    const pdf = await download(owner, `/documents/${document.id}/pdf`);

    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    assert.equal(sha256(pdf), detail.pdfSha256);
    assert.deepEqual(await download(primary.cookie, `/portal/documents/${document.id}/pdf`), pdf);

    const verified = ok(await call(undefined, 'GET', `/public/documents/verify/${detail.code}`));

    assert.equal(verified.status, 'completed');
    assert.equal(verified.signedCount, 3);
    assert.ok(!JSON.stringify(verified).includes('Bình'));
    const match = ok(
      await upload(
        undefined,
        `/public/documents/verify/${detail.code}`,
        {},
        pdf,
        'a.pdf',
        'application/pdf',
      ),
    );

    assert.equal(match.matches, true);
    const tampered = Buffer.from(pdf);

    tampered[tampered.length - 10] ^= 1;
    const mismatch = ok(
      await upload(
        undefined,
        `/public/documents/verify/${detail.code}`,
        {},
        tampered,
        'a.pdf',
        'application/pdf',
      ),
    );

    assert.equal(mismatch.matches, false);
    failed(await call(undefined, 'GET', '/public/documents/verify/VB-ZZZZZZZZ'), 404);
    // Completed documents are final.
    failed(
      await call(owner, 'POST', `/documents/${document.id}/cancel`, {
        reason: 'x',
        version: detail.version,
      }),
      409,
      'document_final',
    );
    // The signature stays out of audit rows.
    const rows = await AuditLogModel.findAll({ where: { resourceId: document.id } });

    assert.ok(rows.length > 0);
    assert.ok(!JSON.stringify(rows.map((row) => row.changes)).includes('base64'));
  });

  test('owner signs first, tenant completes; wrong digits lock the signer', async () => {
    const { contract, tenants } = await leased([
      { fullName: 'Phạm Thu Dung', idNumber: randomIdNumber() },
    ]);
    let document = await newDocument(contract);

    document = ok(
      await call(owner, 'POST', `/documents/${document.id}/owner-sign`, {
        password: OWNER_PASSWORD,
        version: document.version,
      }),
    );
    assert.equal(document.status, 'owner_signed');
    assert.equal(document.signingOrder, 'owner_first');
    failed(
      await call(owner, 'PUT', `/documents/${document.id}`, {
        bodyHtml: '<p>Sửa</p>',
        version: document.version,
      }),
      409,
      'document_locked',
    );
    document = ok(
      await call(owner, 'POST', `/documents/${document.id}/send`, { version: document.version }),
    );
    const [tenant] = tenants;
    const wrong = tenant.phone.slice(-4) === '0000' ? '1111' : '0000';
    const attempt = () =>
      call(tenant.cookie, 'POST', `/portal/documents/${document.id}/sign`, {
        fullName: 'Phạm Thu Dung',
        phoneLast4: wrong,
        agree: true,
        method: 'typed',
      });

    for (let index = 0; index < 4; index += 1) failed(await attempt(), 422);
    failed(await attempt(), 429, 'document_sign_locked');
    failed(
      await call(tenant.cookie, 'POST', `/portal/documents/${document.id}/sign`, {
        fullName: 'Phạm Thu Dung',
        phoneLast4: tenant.phone.slice(-4),
        agree: true,
        method: 'typed',
      }),
      429,
      'document_sign_locked',
    );
    // Unlock (test shortcut) and sign: the owner already signed, so it completes.
    await sequelize.query(
      'UPDATE document_signers SET locked_until = NULL WHERE document_id = :id',
      { replacements: { id: document.id } },
    );
    const signed = ok(
      await call(tenant.cookie, 'POST', `/portal/documents/${document.id}/sign`, {
        fullName: 'Phạm Thu Dung',
        phoneLast4: tenant.phone.slice(-4),
        agree: true,
        method: 'typed',
      }),
    );

    assert.equal(signed.status, 'completed');
    assert.equal(signed.hasPdf, true);
  });

  test('reject, cancel kills the link, contracts are isolated', async () => {
    const first = await leased([{ fullName: 'Võ Minh Em', idNumber: randomIdNumber() }]);
    const second = await leased([{ fullName: 'Đỗ Gia Huy', idNumber: randomIdNumber() }]);
    const rejected = await newDocument(first.contract);

    ok(await call(owner, 'POST', `/documents/${rejected.id}/send`, { version: rejected.version }));
    // Contract B's portal cannot read or sign contract A's document.
    failed(await call(second.tenants[0].cookie, 'GET', `/portal/documents/${rejected.id}`), 404);
    failed(
      await call(second.tenants[0].cookie, 'POST', `/portal/documents/${rejected.id}/sign`, {
        fullName: 'Đỗ Gia Huy',
        phoneLast4: second.tenants[0].phone.slice(-4),
        agree: true,
        method: 'typed',
      }),
      404,
    );
    failed(
      await call(first.tenants[0].cookie, 'POST', `/portal/documents/${rejected.id}/reject`, {}),
      400,
    );
    ok(
      await call(first.tenants[0].cookie, 'POST', `/portal/documents/${rejected.id}/reject`, {
        reason: 'Sai giá thuê',
      }),
    );
    const seen = ok(await call(owner, 'GET', `/documents/${rejected.id}`));

    assert.equal(seen.status, 'rejected');
    assert.equal(seen.signers[0].rejectReason, 'Sai giá thuê');

    const cancelled = await newDocument(second.contract);
    const sent = ok(
      await call(owner, 'POST', `/documents/${cancelled.id}/send`, { version: cancelled.version }),
    );

    ok(
      await call(owner, 'POST', `/documents/${cancelled.id}/cancel`, {
        reason: 'Lập lại',
        version: sent.version,
      }),
    );
    failed(await call(second.tenants[0].cookie, 'GET', `/portal/documents/${cancelled.id}`), 404);
    failed(
      await call(second.tenants[0].cookie, 'POST', `/portal/documents/${cancelled.id}/sign`, {
        fullName: 'Đỗ Gia Huy',
        phoneLast4: second.tenants[0].phone.slice(-4),
        agree: true,
        method: 'typed',
      }),
      404,
    );
  });

  test('paper fallback with a scan, then a replacement supersedes it', async () => {
    const { contract } = await leased([{ fullName: 'Hồ Ngọc Lan', idNumber: randomIdNumber() }]);
    const document = await newDocument(contract);

    failed(
      await upload(
        owner,
        `/documents/${document.id}/paper`,
        { signedOn: '2044-01-01', version: document.version },
        Buffer.from('not a scan'),
        'scan.txt',
        'text/plain',
      ),
      400,
    );
    const paper = ok(
      await upload(
        owner,
        `/documents/${document.id}/paper`,
        { signedOn: '2044-01-01', version: document.version },
        Buffer.from('%PDF-1.4\n% scan\n'),
        'scan.pdf',
        'application/pdf',
      ),
    );

    assert.equal(paper.status, 'completed_paper');
    assert.ok(paper.hasPaperScan);
    const replacement = ok(await call(owner, 'POST', `/documents/${document.id}/supersede`), 201);

    assert.equal(replacement.supersedesId, document.id);
    failed(await call(owner, 'POST', `/documents/${document.id}/supersede`), 409);
    ok(
      await upload(
        owner,
        `/documents/${replacement.id}/paper`,
        { signedOn: '2044-02-01', version: replacement.version },
        Buffer.from('%PDF-1.4\n% scan 2\n'),
        'scan.pdf',
        'application/pdf',
      ),
    );
    assert.equal(ok(await call(owner, 'GET', `/documents/${document.id}`)).status, 'superseded');
    const list = ok(await call(owner, 'GET', `/contracts/${contract.id}/documents`));

    assert.deepEqual(
      list.map((row) => row.status),
      ['completed_paper', 'superseded'],
    );
  });
});
