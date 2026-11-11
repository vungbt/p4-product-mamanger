// CI Postgres/API only. Never starts infrastructure; every money fixture belongs to a new building.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import { sequelize } from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 5).toUpperCase();

async function login(email, password) {
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

async function request(cookie, method, path, body) {
  return fetch(`${base}/api${path}`, {
    method,
    headers: {
      origin,
      ...(cookie ? { cookie } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function json(cookie, method, path, body, status = 200) {
  const response = await request(cookie, method, path, body);
  const result = await response.json();

  assert.equal(response.status, status, JSON.stringify(result));
  return result;
}

describe('ST-21 reports', { skip: !base }, () => {
  let owner, manager, outsider, building, room, contract;
  const invoice = randomUUID();
  const secondInvoice = randomUUID();
  const voidInvoice = randomUUID();
  const draftInvoice = randomUUID();

  async function managerFor(buildingId) {
    const id = randomUUID();
    const email = `report-${id}@stay.local`;
    const password = 'reports-password-123';

    await sequelize.query(
      `INSERT INTO users(id,email,display_name,email_verified,role,account_status)
      VALUES(:id,:email,'ST21',true,'manager','active');
      INSERT INTO auth_accounts(id,account_id,provider_id,user_id,password) VALUES(:account,:id,'credential',:id,:hash);
      INSERT INTO building_members(id,building_id,user_id) VALUES(:member,:buildingId,:id)`,
      {
        replacements: {
          id,
          email,
          account: randomUUID(),
          member: randomUUID(),
          buildingId,
          hash: await bcrypt.hash(password, 10),
        },
      },
    );
    return login(email, password);
  }

  before(async () => {
    owner = await login('owner@stay.local', 'stay-owner-123');
    building = (
      await json(owner, 'POST', '/buildings', { code: `R${suffix}`, name: `ST21 ${suffix}` }, 201)
    ).data;
    const outside = (
      await json(
        owner,
        'POST',
        '/buildings',
        { code: `S${suffix}`, name: `ST21 outside ${suffix}` },
        201,
      )
    ).data;

    manager = await managerFor(building.id);
    outsider = await managerFor(outside.id);
    room = (
      await json(
        owner,
        'POST',
        `/buildings/${building.id}/rooms`,
        {
          code: 'R1',
          floor: 1,
          listPrice: 3000000,
          maxOccupants: 2,
          initialElectric: 0,
          initialWater: 0,
        },
        201,
      )
    ).data;
    contract = randomUUID();
    // Historical fixtures keep the payment dates valid and make inclusive occupancy reproducible.
    await sequelize.query(
      `UPDATE rooms SET created_at = '2020-01-01T00:00:00Z' WHERE id = :room;
      INSERT INTO contracts(id,building_id,room_id,code,status,start_date,end_date,moved_out_at,rent)
        VALUES(:contract,:building,:room,'ST21','ended','2020-01-16','2020-02-02','2020-02-02',3000000)`,
      { replacements: { room: room.id, building: building.id, contract } },
    );
    for (const [id, period, status, total, paid] of [
      [invoice, '2020-01', 'partially_paid', 1000000, 300000],
      [secondInvoice, '2020-02', 'paid', 500000, 500000],
      [voidInvoice, '2020-02', 'void', 9000000, 0],
      [draftInvoice, '2020-03', 'draft', 8000000, 0],
    ]) {
      await sequelize.query(
        `INSERT INTO invoices(id,building_id,contract_id,room_id,kind,period,code,status,issued_on,due_on,subtotal,rounding,total,paid_total,rounding_unit,void_reason)
        VALUES(:id,:building,:contract,:room,'monthly',:period,:code,:status,:issued,:due,:total,0,:total,:paid,1000,:reason)`,
        {
          replacements: {
            id,
            building: building.id,
            contract,
            room: room.id,
            period,
            status,
            total,
            paid,
            code: status === 'draft' ? null : `R${suffix}-${id.slice(0, 8)}`,
            issued: status === 'draft' ? null : `${period}-01`,
            due: `${period}-05`,
            reason: status === 'void' ? 'ST21 void' : null,
          },
        },
      );
    }
    for (const [invoiceId, amount, method, paidOn, reversed] of [
      [invoice, 300000, 'cash', '2020-02-10', false],
      [invoice, 100000, 'bank_transfer', '2020-02-11', true],
      [secondInvoice, 500000, 'deposit', '2020-02-12', false],
    ]) {
      await sequelize.query(
        `INSERT INTO payments(id,invoice_id,building_id,amount,method,paid_on,reversed_at,reverse_reason)
        VALUES(:id,:invoiceId,:building,:amount,:method,:paidOn,:reversedAt,:reason)`,
        {
          replacements: {
            id: randomUUID(),
            invoiceId,
            building: building.id,
            amount,
            method,
            paidOn,
            reversedAt: reversed ? new Date() : null,
            reason: reversed ? 'ST21 reversed' : null,
          },
        },
      );
    }
    for (const [name, amount] of [
      ['Điện tổng', 400000],
      ['Nước tổng', 200000],
      ['Điện nước tổng', 123000],
    ]) {
      // Reuse an existing named category without renaming global data.
      const [rows] = await sequelize.query(
        'SELECT id FROM expense_categories WHERE lower(trim(name)) = lower(:name)',
        { replacements: { name } },
      );
      const id = rows[0]?.id ?? randomUUID();

      if (!rows.length) {
        await sequelize.query('INSERT INTO expense_categories(id,name) VALUES(:id,:name)', {
          replacements: { id, name },
        });
      }
      await json(
        owner,
        'POST',
        '/expenses',
        { buildingId: building.id, categoryId: id, amount, spentOn: '2020-01-20' },
        201,
      );
    }
    for (const [type, quantity, amount] of [
      ['electricity', 100, 300000],
      ['water', 5, 100000],
    ]) {
      await sequelize.query(
        `INSERT INTO invoice_lines(id,invoice_id,position,type,description,period,quantity,amount)
        VALUES(:id,:invoice,1,:type,'{"key":"invoiceLine.rent","params":{}}','2020-01',:quantity,:amount)`,
        { replacements: { id: randomUUID(), invoice: secondInvoice, type, quantity, amount } },
      );
    }
    await sequelize.query(
      `INSERT INTO invoice_lines(id,invoice_id,position,type,description,period,quantity,amount)
      VALUES(:id,:invoice,0,'rent','{"key":"invoiceLine.rent","params":{}}','2020-02',1,100000)`,
      { replacements: { id: randomUUID(), invoice: secondInvoice } },
    );
    for (const id of [voidInvoice, draftInvoice]) {
      await sequelize.query(
        `INSERT INTO invoice_lines(id,invoice_id,position,type,description,period,quantity,amount)
        VALUES(:id,:invoice,0,'electricity','{"key":"invoiceLine.electricity","params":{}}','2020-01',999,999000)`,
        { replacements: { id: randomUUID(), invoice: id } },
      );
    }
  });

  after(async () => {
    await sequelize.close();
  });

  const range = () => `buildingId=${building.id}&from=2020-01&to=2020-03`;

  test('revenue equals invoice, payment and expense lists; cash follows later payment month', async () => {
    const report = (await json(owner, 'GET', `/reports/revenue?${range()}`)).data;
    let billed = 0,
      expenses = 0;

    for (const period of ['2020-01', '2020-02', '2020-03']) {
      const invoices = (
        await json(
          owner,
          'GET',
          `/invoices?buildingId=${building.id}&period=${period}&pageSize=100`,
        )
      ).data;
      const costs = await json(
        owner,
        'GET',
        `/expenses?buildingId=${building.id}&period=${period}&pageSize=100`,
      );
      const monthBilled = invoices
        .filter((i) => ['issued', 'partially_paid', 'paid'].includes(i.status))
        .reduce((s, i) => s + i.total, 0);
      const monthExpenses = costs.data.reduce((s, e) => s + e.amount, 0);

      billed += monthBilled;
      expenses += monthExpenses;
      const month = report.months.find((m) => m.period === period);

      assert.equal(month.billed, monthBilled);
      assert.equal(month.expenses, monthExpenses);
    }
    const payments = await json(
      owner,
      'GET',
      `/payments?buildingId=${building.id}&dateFrom=2020-01-01&dateTo=2020-03-31`,
    );

    assert.deepEqual(report.totals, {
      billed,
      collected: payments.meta.totalAmount,
      expenses,
      profit: payments.meta.totalAmount - expenses,
    });
    assert.equal(report.totals.billed, 1500000, 'void and draft excluded');
    assert.equal(report.months[0].collected, 0);
    assert.equal(
      report.months[1].collected,
      800000,
      'later month, deposit included, reversed excluded',
    );
    assert.equal(report.months[2].billed, 0);
    assert.deepEqual((await json(manager, 'GET', `/reports/revenue?${range()}`)).data, report);
  });

  test('room occupancy includes the move-out date and leap-year denominator', async () => {
    const report = (await json(owner, 'GET', `/reports/rooms?buildingId=${building.id}&year=2020`))
      .data;

    assert.deepEqual(report.rooms[0], {
      roomId: room.id,
      roomCode: 'R1',
      billed: 1500000,
      collected: 800000,
      occupiedMonths: 2,
      occupiedDays: 18,
      availableDays: 366,
      occupancyRate: 0.0492,
    });
  });

  test('occupancy follows room-change history, not the contract current room', async () => {
    const movedRoom = (
      await json(
        owner,
        'POST',
        `/buildings/${building.id}/rooms`,
        {
          code: 'R2',
          floor: 1,
          listPrice: 3000000,
          maxOccupants: 2,
          initialElectric: 0,
          initialWater: 0,
        },
        201,
      )
    ).data;
    const [owners] = await sequelize.query("SELECT id FROM users WHERE email = 'owner@stay.local'");

    await sequelize.query(
      `UPDATE rooms SET created_at = '2020-01-01T00:00:00Z' WHERE id = :room;
      UPDATE contracts SET room_id = :room WHERE id = :contract;
      INSERT INTO contract_events(id,contract_id,type,payload,actor_id) VALUES(:event,:contract,'room-change',CAST(:payload AS jsonb),:actor)`,
      {
        replacements: {
          room: movedRoom.id,
          contract,
          event: randomUUID(),
          actor: owners[0].id,
          payload: JSON.stringify({
            oldRoomId: room.id,
            roomId: movedRoom.id,
            effectiveDate: '2020-01-21',
            version: 2,
          }),
        },
      },
    );
    const report = (await json(owner, 'GET', `/reports/rooms?buildingId=${building.id}&year=2020`))
      .data;

    assert.equal(report.rooms.find((r) => r.roomId === room.id).occupiedDays, 5);
    assert.equal(report.rooms.find((r) => r.roomId === movedRoom.id).occupiedDays, 13);
    // Financial rows keep the room snapshot of the invoice, including later payments.
    assert.equal(report.rooms.find((r) => r.roomId === room.id).collected, 800000);
    assert.equal(report.rooms.find((r) => r.roomId === movedRoom.id).collected, 0);
  });

  test('utilities use consumption period, quantities and separate/combined categories', async () => {
    const report = (await json(owner, 'GET', `/reports/utilities?${range()}`)).data;

    assert.deepEqual(report.months[0], {
      period: '2020-01',
      electricityQuantity: 100,
      waterQuantity: 5,
      electricityBilled: 300000,
      waterBilled: 100000,
      electricityExpenses: 400000,
      waterExpenses: 200000,
      combinedExpenses: 123000,
      electricityLossPercent: 25,
      waterLossPercent: 50,
    });
    assert.equal(report.months[1].electricityLossPercent, null);
  });

  test('XLSX attachment contains Vietnamese sheets, numeric money, real dates and frozen bold headers', async () => {
    const response = await request(owner, 'POST', '/reports/exports', {
      buildingId: building.id,
      from: '2020-01',
      to: '2020-03',
      sheets: ['invoices', 'payments', 'expenses', 'receivables'],
    });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-disposition'), /attachment;.*\.xlsx/);
    assert.match(response.headers.get('content-type'), /spreadsheetml/);
    const bytes = Buffer.from(await response.arrayBuffer());

    assert.equal(bytes.subarray(0, 2).toString(), 'PK');
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(bytes);
    assert.deepEqual(
      workbook.worksheets.map((s) => s.name),
      ['Hoá đơn', 'Sổ thu', 'Chi phí', 'Công nợ'],
    );
    const sheet = workbook.getWorksheet('Hoá đơn');

    assert.equal(sheet.getCell('F2').value, 1000000);
    assert.match(sheet.getCell('F2').numFmt, /₫/);
    assert.ok(sheet.getCell('D2').value instanceof Date);
    assert.equal(sheet.getRow(1).font.bold, true);
    assert.equal(sheet.views[0].ySplit, 1);
    assert.equal(workbook.getWorksheet('Sổ thu').rowCount, 3);
    assert.equal(workbook.getWorksheet('Công nợ').getCell('F2').value, 300000);
  });

  test('validation, cross-building 404 and signed-out 401 on every report/export', async () => {
    for (const path of [
      `/reports/revenue?${range()}`,
      `/reports/utilities?${range()}`,
      `/reports/rooms?buildingId=${building.id}&year=2020`,
    ]) {
      assert.equal((await request(undefined, 'GET', path)).status, 401);
      assert.equal((await request(outsider, 'GET', path)).status, 404);
    }
    for (const [from, to] of [
      ['2020-13', '2020-14'],
      ['2020-02', '2020-01'],
      ['2020-01', '2022-01'],
    ]) {
      for (const name of ['revenue', 'utilities']) {
        assert.ok(
          [400, 422].includes(
            (
              await request(
                owner,
                'GET',
                `/reports/${name}?buildingId=${building.id}&from=${from}&to=${to}`,
              )
            ).status,
          ),
        );
      }
    }
    const body = { buildingId: building.id, from: '2020-01', to: '2020-03', sheets: ['invoices'] };

    assert.equal((await request(undefined, 'POST', '/reports/exports', body)).status, 401);
    assert.equal((await request(outsider, 'POST', '/reports/exports', body)).status, 404);
    assert.equal(
      (await request(owner, 'POST', '/reports/exports', { ...body, sheets: ['invalid'] })).status,
      400,
    );
    assert.equal(
      (
        await request(owner, 'POST', '/reports/exports', {
          ...body,
          from: '2021-01',
          to: '2020-01',
        })
      ).status,
      422,
    );
  });
  test('export rate limit is per staff user and includes Retry-After', async () => {
    const input = { buildingId: building.id, from: '2020-01', to: '2020-01', sheets: ['expenses'] };

    for (let attempt = 0; attempt < 5; attempt++) {
      const response = await request(manager, 'POST', '/reports/exports', input);

      assert.equal(response.status, 200);
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.load(Buffer.from(await response.arrayBuffer()));
      assert.deepEqual(
        workbook.worksheets.map((s) => s.name),
        ['Chi phí'],
      );
    }
    const limited = await request(manager, 'POST', '/reports/exports', input);

    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
  });
});
