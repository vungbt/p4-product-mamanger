// ST-28: CI Postgres/API only. Never starts databases or local services.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import { AuditLogModel, ContractOccupantModel, sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().replaceAll('-', '').slice(0, 5).toUpperCase();
const date = '2020-02-15';
const idNumber = `000${String(Number.parseInt(suffix, 16)).padStart(9, '0')}`;
const headers = [
  'STT',
  'Họ tên',
  'Ngày sinh',
  'Số CCCD',
  'Quê quán/Địa chỉ thường trú',
  'Phòng',
  'Ngày đến',
  'Đã khai báo',
];

async function request(cookie, method, path, body) {
  return fetch(`${base}/api${path}`, {
    method,
    headers: {
      origin,
      ...(cookie ? { cookie } : {}),
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
async function call(cookie, method, path, body, status = 200) {
  const response = await request(cookie, method, path, body);
  const result = await response.json();

  assert.equal(response.status, status, JSON.stringify(result));
  return result;
}
async function signIn(email = 'owner@stay.local', password = 'stay-owner-123') {
  const response = await request(null, 'POST', '/auth/sign-in/email', { email, password });

  assert.equal(response.status, 200, await response.clone().text());
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

describe('ST-28 temporary residence', { skip: !process.env.CI || !base }, () => {
  let owner, building, room, target, current, departed, future, contract, stay;
  let managerIn, managerOut, outsider, ownerId;
  let roomNumber = 0;
  const listPath = (query = '') => `/buildings/${building.id}/residents?date=${date}${query}`;
  const newRoom = async () =>
    (
      await call(
        owner,
        'POST',
        `/buildings/${building.id}/rooms`,
        {
          code: `R${++roomNumber}`,
          floor: 1,
          listPrice: 3000000,
          maxOccupants: 5,
          initialElectric: 0,
          initialWater: 0,
        },
        201,
      )
    ).data;
  const tenant = async (name) =>
    (
      await call(
        owner,
        'POST',
        '/tenants',
        {
          buildingId: building.id,
          fullName: `${name} ${suffix}`,
          ...(name === 'Đang ở' ? { idNumber } : {}),
          phone: '0901234567',
          birthDate: '1990-01-01',
          hometown: 'Quê quán riêng',
          permanentAddress: 'Địa chỉ riêng',
        },
        201,
      )
    ).data;
  const apply = async (path, body) => {
    contract = (
      await call(owner, 'POST', `/contracts/${contract.id}/${path}`, {
        version: contract.version,
        ...body,
      })
    ).data.contract;
  };
  async function manager(buildingId, index) {
    const id = randomUUID();
    const email = `residents-${index}-${suffix.toLowerCase()}@stay.local`;
    const password = 'residents-password-123';

    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status) VALUES(:id,:email,'ST28',true,'manager','active');
      INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:accountId,:id,'credential',:id,:hash);
      INSERT INTO building_members(id,building_id,user_id) VALUES(:memberId,:buildingId,:id)`,
      {
        replacements: {
          id,
          email,
          accountId: randomUUID(),
          hash: await bcrypt.hash(password, 10),
          memberId: randomUUID(),
          buildingId,
        },
      },
    );
    return signIn(email, password);
  }

  before(async () => {
    owner = await signIn();
    ownerId = (await call(owner, 'GET', '/me')).data.user.id;
    building = (
      await call(owner, 'POST', '/buildings', { code: `R${suffix}`, name: `ST28 ${suffix}` }, 201)
    ).data;
    outsider = (
      await call(
        owner,
        'POST',
        '/buildings',
        { code: `S${suffix}`, name: `Outside ST28 ${suffix}` },
        201,
      )
    ).data;
    managerIn = await manager(building.id, 1);
    managerOut = await manager(outsider.id, 2);
    room = await newRoom();
    target = await newRoom();
    current = await tenant('Đang ở');
    departed = await tenant('Đã rời');
    future = await tenant('Đến sau');
    const draft = (
      await call(
        owner,
        'POST',
        '/contracts',
        {
          roomId: room.id,
          startDate: '2020-01-01',
          endDate: '2098-12-31',
          rent: 3000000,
          initialElectric: 0,
          initialWater: 0,
          occupantIds: [current.id, departed.id],
          primaryTenantId: current.id,
        },
        201,
      )
    ).data;

    contract = (await call(owner, 'POST', `/contracts/${draft.id}/activate`)).data;
    await apply(`occupants/${departed.id}/leave`, { effectiveDate: '2020-02-10' });
    await apply('occupants', { effectiveDate: '2020-03-01', tenantId: future.id });
    await apply('room-change', {
      effectiveDate: '2020-02-12',
      roomId: target.id,
      rent: 3000000,
      closingElectric: 0,
      closingWater: 0,
      initialElectric: 0,
      initialWater: 0,
    });
    stay = await ContractOccupantModel.findOne({
      where: { contractId: contract.id, tenantId: current.id },
    });
  });
  after(() => sequelize.close());

  test('date bounds, one row after room change, search and pagination; read does not add audit changes', async () => {
    const beforeCount = await AuditLogModel.count({ where: { resourceType: 'resident' } });
    const result = await call(owner, 'GET', listPath());

    assert.equal(result.meta.total, 1);
    assert.deepEqual(
      result.data.map((row) => row.tenantId),
      [current.id],
    );
    assert.equal(result.data[0].roomId, target.id);
    assert.equal(result.data[0].arrivalDate, '2020-01-01');
    assert.equal(result.data[0].birthDate, '1990-01-01');
    assert.equal(result.data[0].idNumber, idNumber);
    assert.equal(
      (await call(owner, 'GET', `/buildings/${building.id}/residents?date=2020-02-09`)).meta.total,
      2,
    );
    assert.equal(
      (await call(owner, 'GET', `/buildings/${building.id}/residents?date=2020-02-10`)).meta.total,
      1,
    );
    assert.equal(
      (await call(owner, 'GET', `/buildings/${building.id}/residents?date=2020-03-01`)).meta.total,
      2,
    );
    assert.equal((await call(owner, 'GET', listPath('&q=nomatch'))).meta.total, 0);
    assert.equal((await call(owner, 'GET', listPath('&page=2&pageSize=1'))).data.length, 0);
    assert.equal(await AuditLogModel.count({ where: { resourceType: 'resident' } }), beforeCount);
  });

  test('rejects malformed, impossible and missing dates and invalid registration dates', async () => {
    for (const invalid of ['2020-02-30', '2020-13-01', 'anything', '']) {
      assert.equal(
        (await request(owner, 'GET', `/buildings/${building.id}/residents?date=${invalid}`)).status,
        400,
      );
      assert.equal(
        (
          await request(owner, 'POST', `/buildings/${building.id}/residents/export`, {
            date: invalid,
          })
        ).status,
        400,
      );
    }
    for (const registeredOn of ['2019-12-31', '2020-02-30', '2099-01-01'])
      assert.equal(
        (await request(owner, 'POST', `/resident-stays/${stay.id}/registration`, { registeredOn }))
          .status,
        400,
      );
    assert.equal(
      (
        await request(owner, 'POST', `/resident-stays/${stay.id}/registration`, {
          registeredOn: date,
          note: 'a'.repeat(2001),
        })
      ).status,
      400,
    );
  });

  test('unregistered filter, mark and unmark, audited without personal values', async () => {
    assert.equal((await call(owner, 'GET', listPath('&status=unregistered'))).data.length, 1);
    await call(owner, 'POST', `/resident-stays/${stay.id}/registration`, {
      registeredOn: date,
      note: 'Private registration note',
    });
    const marked = (await call(owner, 'GET', listPath())).data[0];

    assert.equal(marked.registeredOn, date);
    assert.equal((await call(owner, 'GET', listPath('&status=unregistered'))).data.length, 0);
    const audit = await AuditLogModel.findOne({
      where: { resourceType: 'resident_registration', resourceId: stay.id, outcome: 'success' },
      order: [['createdAt', 'DESC']],
    });

    assert.ok(audit);
    assert.equal(audit.actorId, ownerId);
    assert.equal(audit.changes.buildingId, building.id);
    assert.equal(audit.changes.registered, true);
    for (const value of [current.fullName, 'Private registration note', date, '0901234567'])
      assert.ok(!JSON.stringify(audit.changes).includes(value));
    await call(owner, 'DELETE', `/resident-stays/${stay.id}/registration`);
    assert.equal((await call(owner, 'GET', listPath('&status=unregistered'))).data.length, 1);
    await call(owner, 'POST', `/resident-stays/${stay.id}/registration`, { registeredOn: date });
  });

  test('export is a real XLSX with Vietnamese headers and an audit row before response', async () => {
    const response = await request(owner, 'POST', `/buildings/${building.id}/residents/export`, {
      date,
    });

    assert.equal(response.status, 200, await response.clone().text());
    assert.match(response.headers.get('content-type'), /spreadsheetml/);
    assert.match(response.headers.get('content-disposition'), /\.xlsx/);
    const bytes = Buffer.from(await response.arrayBuffer());

    assert.equal(bytes.subarray(0, 2).toString(), 'PK');
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(bytes);
    const sheet = workbook.getWorksheet('Tạm trú');

    assert.deepEqual(sheet.getRow(1).values.slice(1), headers);
    assert.equal(sheet.rowCount, 2);
    assert.equal(sheet.getCell('B2').value, current.fullName);
    assert.equal(sheet.getCell('F2').value, target.code);
    assert.equal(sheet.getCell('D2').value, idNumber);
    assert.equal(sheet.getCell('H2').value, '15/02/2020');
    const audit = await AuditLogModel.findOne({
      where: { action: 'residents.export', resourceId: building.id },
      order: [['createdAt', 'DESC']],
    });

    assert.ok(audit);
    assert.equal(audit.actorId, ownerId);
    assert.equal(audit.changes.count, 1);
    assert.equal(audit.changes.buildingId, building.id);
    assert.ok(!JSON.stringify(audit.changes).includes(current.fullName));
  });

  test('assigned manager reads/exports; another building is 404; signed out is 401', async () => {
    await call(managerIn, 'GET', listPath());
    assert.equal(
      (await request(managerIn, 'POST', `/buildings/${building.id}/residents/export`, { date }))
        .status,
      200,
    );
    assert.equal(
      (
        await request(managerIn, 'POST', `/resident-stays/${stay.id}/registration`, {
          registeredOn: date,
        })
      ).status,
      403,
    );
    for (const [method, path, body] of [
      ['GET', listPath()],
      ['POST', `/buildings/${building.id}/residents/export`, { date }],
    ]) {
      assert.equal((await request(managerOut, method, path, body)).status, 404);
      assert.equal((await request(null, method, path, body)).status, 401);
    }
    for (const method of ['POST', 'DELETE'])
      assert.equal(
        (
          await request(
            null,
            method,
            `/resident-stays/${stay.id}/registration`,
            method === 'POST' ? { registeredOn: date } : undefined,
          )
        ).status,
        401,
      );
  });
  test('leaving and returning is a fresh registration; role-only split retains registration', async () => {
    const futureStay = await ContractOccupantModel.findOne({
      where: { contractId: contract.id, tenantId: future.id },
    });

    await call(owner, 'POST', `/resident-stays/${futureStay.id}/registration`, {
      registeredOn: '2020-03-01',
    });
    await apply(`occupants/${current.id}/leave`, {
      effectiveDate: '2020-03-02',
      newPrimaryTenantId: future.id,
    });
    await apply('occupants', { effectiveDate: '2020-03-03', tenantId: current.id });
    const later = (await call(owner, 'GET', `/buildings/${building.id}/residents?date=2020-03-03`))
      .data;
    const returned = later.find((row) => row.tenantId === current.id);
    const representative = later.find((row) => row.tenantId === future.id);

    assert.equal(returned.registeredOn, null);
    assert.notEqual(returned.occupantId, stay.id);
    assert.equal(returned.arrivalDate, '2020-03-03');
    assert.equal(representative.registeredOn, '2020-03-01');
  });
});
