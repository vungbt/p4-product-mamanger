// ST-20: runs in CI against the migrated, seeded real API (never starts a database).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import {
  AuditLogModel,
  BuildingModel,
  ExpenseCategoryModel,
  ExpenseModel,
  FileModel,
  RoomModel,
  sequelize,
} from '../dist/sequelize/models/index.js';

const base = process.env.STAY_TEST_API_URL;
const origin = 'http://localhost:5174';
const suffix = randomUUID().slice(0, 8);
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

async function login(email, password) {
  const response = await fetch(`${base}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  assert.equal(response.status, 200, await response.clone().text());
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}

async function call(cookie, method, path, body) {
  const form = body instanceof FormData;
  const response = await fetch(new URL(path, base), {
    method,
    headers: {
      origin,
      ...(cookie ? { cookie } : {}),
      ...(body && !form ? { 'content-type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  });

  return { status: response.status, body: await response.json() };
}

function ok(result, status = 200) {
  assert.equal(result.status, status, JSON.stringify(result.body));
  return result.body.data;
}

function invalid(result, field) {
  assert.equal(result.status, 400, JSON.stringify(result.body));
  assert.ok(result.body.extensions?.[field]?.length, JSON.stringify(result.body));
}

describe('Stay API: operating expenses', { skip: !base }, () => {
  let cookie;
  let manager;
  let building;
  let category;
  let otherCategory;
  const createdIds = [];
  const categoryIds = [];
  const managerId = randomUUID();
  const period = '2040-03';

  before(async () => {
    cookie = await login('owner@stay.local', 'stay-owner-123');
    building = await BuildingModel.findOne({ where: { code: 'A' } });
    assert.ok(building);
    category = ok(
      await call(cookie, 'POST', '/api/expense-categories', { name: `ST20 ${suffix}` }),
      201,
    );
    otherCategory = ok(
      await call(cookie, 'POST', '/api/expense-categories', { name: `ST20 other ${suffix}` }),
      201,
    );
    categoryIds.push(category.id, otherCategory.id);
    await sequelize.query(
      `INSERT INTO users (id, email, display_name, email_verified, role, account_status)
      VALUES (:id, :email, 'ST20 Manager', true, 'manager', 'active');
      INSERT INTO auth_accounts (id, account_id, provider_id, user_id, password)
      VALUES (:accountId, :id, 'credential', :id, :hash);
      INSERT INTO building_members (id, building_id, user_id) VALUES (:memberId, :buildingId, :id);`,
      {
        replacements: {
          id: managerId,
          email: `expense-manager-${suffix}@stay.local`,
          accountId: randomUUID(),
          memberId: randomUUID(),
          buildingId: building.id,
          hash: await bcrypt.hash('manager-password-123', 10),
        },
      },
    );
    manager = await login(`expense-manager-${suffix}@stay.local`, 'manager-password-123');
  });

  after(async () => {
    if (createdIds.length) await ExpenseModel.destroy({ where: { id: createdIds } });
    if (categoryIds.length) await ExpenseCategoryModel.destroy({ where: { id: categoryIds } });
    await sequelize.query('DELETE FROM users WHERE id = :id', { replacements: { id: managerId } });
    await sequelize.close();
  });

  const input = (changes = {}) => ({
    buildingId: building.id,
    categoryId: category.id,
    amount: 120000,
    spentOn: `${period}-12`,
    note: suffix,
    ...changes,
  });
  const create = async (changes = {}) => {
    const result = ok(await call(cookie, 'POST', '/api/expenses', input(changes)), 201);

    createdIds.push(result.id);
    return result;
  };

  test('all expense/category endpoints require a session; managers receive 403', async () => {
    const id = randomUUID();
    const routes = [
      ['GET', '/api/expense-categories'],
      ['POST', '/api/expense-categories'],
      ['PUT', `/api/expense-categories/${id}`],
      ['GET', '/api/expenses'],
      ['POST', '/api/expenses'],
      ['PUT', `/api/expenses/${id}`],
      ['DELETE', `/api/expenses/${id}`],
    ];

    for (const [method, path] of routes) {
      assert.equal(
        (await call(undefined, method, path, method === 'GET' ? undefined : {})).status,
        401,
        `${method} ${path}`,
      );
      assert.equal(
        (await call(manager, method, path, method === 'GET' ? undefined : {})).status,
        403,
        `${method} ${path}`,
      );
    }
    assert.equal(
      (
        await call(manager, 'POST', '/api/uploads', {
          purpose: 'expense_receipt',
          buildingId: building.id,
        })
      ).status,
      403,
    );
  });

  test('default categories, duplicate validation and optimistic category updates', async () => {
    const list = ok(await call(cookie, 'GET', '/api/expense-categories'));

    for (const name of [
      'Điện nước tổng',
      'Sửa chữa',
      'Internet tổng',
      'Vệ sinh',
      'Thuế phí',
      'Khác',
    ])
      assert.ok(list.some((row) => row.name === name));
    invalid(await call(cookie, 'POST', '/api/expense-categories', { name: ' ' }), 'name');
    invalid(
      await call(cookie, 'POST', '/api/expense-categories', { name: category.name.toLowerCase() }),
      'name',
    );
    const updated = ok(
      await call(cookie, 'PUT', `/api/expense-categories/${category.id}`, {
        ...category,
        name: `${category.name} updated`,
      }),
    );

    assert.equal(updated.version, category.version + 1);
    assert.equal(
      (await call(cookie, 'PUT', `/api/expense-categories/${category.id}`, category)).status,
      409,
    );
    category = updated;
  });

  test('expense CRUD derives period, protects versions and audits writes', async () => {
    const expense = await create();

    assert.equal(expense.period, period);
    assert.equal(expense.amount, 120000);
    const updated = ok(
      await call(
        cookie,
        'PUT',
        `/api/expenses/${expense.id}`,
        input({ amount: 250000, spentOn: '2040-04-01', version: expense.version }),
      ),
    );

    assert.equal(updated.period, '2040-04');
    assert.equal(updated.version, expense.version + 1);
    const stale = await call(
      cookie,
      'PUT',
      `/api/expenses/${expense.id}`,
      input({ version: expense.version }),
    );

    assert.equal(stale.status, 409);
    assert.equal(stale.body.code, 'version_conflict');
    ok(await call(cookie, 'DELETE', `/api/expenses/${expense.id}`));
    assert.equal(await ExpenseModel.findByPk(expense.id), null);
    assert.equal((await call(cookie, 'DELETE', `/api/expenses/${expense.id}`)).status, 404);
    const audits = await AuditLogModel.findAll({
      where: { resourceType: 'expense', resourceId: expense.id },
    });

    for (const action of ['create', 'update', 'delete'])
      assert.ok(
        audits.some((row) => row.action === `expense.${action}`),
        `${action}: ${JSON.stringify(audits)}`,
      );
  });

  test('dates and instants derive Vietnamese periods at month/year boundaries', async () => {
    for (const [spentOn, date, expected] of [
      ['2040-03-31', '2040-03-31', '2040-03'],
      ['2040-03-31T16:59:59Z', '2040-03-31', '2040-03'],
      ['2040-03-31T17:00:00Z', '2040-04-01', '2040-04'],
      ['2039-12-31T17:00:00Z', '2040-01-01', '2040-01'],
      ['2040-04-01T00:00:00+07:00', '2040-04-01', '2040-04'],
    ]) {
      const row = await create({ spentOn });

      assert.equal(row.spentOn, date);
      assert.equal(row.period, expected);
    }
  });

  test('validates positive integer money, dates, IDs, room building and list queries', async () => {
    for (const amount of [0, -1, 1.5, '1000', Number.MAX_SAFE_INTEGER + 1])
      invalid(await call(cookie, 'POST', '/api/expenses', input({ amount })), 'amount');
    for (const spentOn of ['2040-02-30', 'garbage', '2040-04-01T00:00:00'])
      invalid(await call(cookie, 'POST', '/api/expenses', input({ spentOn })), 'spentOn');
    invalid(
      await call(cookie, 'POST', '/api/expenses', input({ categoryId: randomUUID() })),
      'categoryId',
    );
    invalid(await call(cookie, 'POST', '/api/expenses', input({ roomId: randomUUID() })), 'roomId');
    invalid(
      await call(cookie, 'POST', '/api/expenses', input({ receiptFileId: randomUUID() })),
      'receiptFileId',
    );
    invalid(
      await call(
        cookie,
        'POST',
        '/api/expenses',
        input({ categoryId: 'bad', note: 'x'.repeat(2001) }),
      ),
      'categoryId',
    );
    for (const query of [
      'period=2040-13',
      'period=wrong',
      'buildingId=no',
      'categoryId=no',
      'roomId=no',
      'sortBy=note',
      'page=0',
    ])
      assert.equal((await call(cookie, 'GET', `/api/expenses?${query}`)).status, 400, query);
    const otherRoom = await RoomModel.findOne({ where: { buildingId: building.id } });

    if (otherRoom) {
      const otherBuilding = await BuildingModel.create({
        code: `E${suffix.slice(0, 5).toUpperCase()}`,
        name: 'ST20 room scope',
      });

      try {
        invalid(
          await call(
            cookie,
            'POST',
            '/api/expenses',
            input({ buildingId: otherBuilding.id, roomId: otherRoom.id }),
          ),
          'roomId',
        );
      } finally {
        await otherBuilding.destroy();
      }
    }
  });

  test('totals match every filter across pages and reflect edits/deletions', async () => {
    const note = `totals-${suffix}`;
    const one = await create({ note, amount: 100 });
    const two = await create({ note, amount: 200 });
    await create({ note, amount: 500, categoryId: otherCategory.id });
    await create({ note, amount: 900, spentOn: '2040-04-12' });
    const path = `/api/expenses?buildingId=${building.id}&period=${period}&q=${note}&pageSize=1`;
    const list = await call(cookie, 'GET', path);

    ok(list);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.meta.total, 3);
    assert.deepEqual(
      Object.fromEntries(
        list.body.meta.totalsByCategory.map((row) => [row.categoryId, row.amount]),
      ),
      { [category.id]: 300, [otherCategory.id]: 500 },
    );
    const filtered = await call(cookie, 'GET', `${path}&categoryId=${category.id}`);

    assert.equal(filtered.body.meta.total, 2);
    assert.deepEqual(filtered.body.meta.totalsByCategory, [
      { categoryId: category.id, amount: 300 },
    ]);
    ok(
      await call(
        cookie,
        'PUT',
        `/api/expenses/${one.id}`,
        input({ note, amount: 400, version: one.version }),
      ),
    );
    ok(await call(cookie, 'DELETE', `/api/expenses/${two.id}`));
    const changed = await call(cookie, 'GET', `${path}&categoryId=${category.id}`);

    assert.deepEqual(changed.body.meta.totalsByCategory, [
      { categoryId: category.id, amount: 400 },
    ]);
    const room = await RoomModel.findOne({ where: { buildingId: building.id } });

    assert.ok(room);
    const scoped = await create({ note, roomId: room.id, amount: 50 });
    const byRoom = await call(cookie, 'GET', `${path}&roomId=${room.id}`);

    assert.equal(byRoom.body.meta.total, 1);
    assert.equal(byRoom.body.data[0].id, scoped.id);
    assert.deepEqual(byRoom.body.meta.totalsByCategory, [{ categoryId: category.id, amount: 50 }]);
  });

  test('receipt upload is private, purpose scoped and signed', async () => {
    const ticket = ok(
      await call(cookie, 'POST', '/api/uploads', {
        purpose: 'expense_receipt',
        buildingId: building.id,
      }),
      201,
    );
    const form = new FormData();

    form.append('file', new Blob([PNG], { type: 'image/png' }), 'receipt.png');
    ok(await call(undefined, 'POST', ticket.uploadUrl, form));
    const completed = ok(await call(cookie, 'POST', `/api/uploads/${ticket.id}/complete`));
    const file = await FileModel.findByPk(completed.fileId);

    assert.equal(file.private, true);
    assert.equal(file.purpose, 'expense_receipt');
    const expense = await create({ receiptFileId: file.id });

    assert.ok(expense.receipt?.url);
    const signed = await fetch(new URL(expense.receipt.url, base));

    assert.equal(signed.status, 200);
    assert.equal(signed.headers.get('content-type'), 'image/png');
    assert.equal((await fetch(`${base}/api/files/${file.id}/stub`)).status, 403);
    const wrongPurpose = await FileModel.create({
      provider: 'stub',
      storageId: `wrong-purpose-${suffix}`,
      format: 'png',
      bytes: 1,
      purpose: 'tenant_document',
      ownerId: file.ownerId,
      buildingId: building.id,
    });

    invalid(
      await call(cookie, 'POST', '/api/expenses', input({ receiptFileId: wrongPurpose.id })),
      'receiptFileId',
    );
    const wrongOwner = await FileModel.create({
      provider: 'stub',
      storageId: `wrong-owner-${suffix}`,
      format: 'png',
      bytes: 1,
      purpose: 'expense_receipt',
      ownerId: managerId,
      buildingId: building.id,
    });

    invalid(
      await call(cookie, 'POST', '/api/expenses', input({ receiptFileId: wrongOwner.id })),
      'receiptFileId',
    );
  });

  test('used categories deactivate without losing historical expenses', async () => {
    const expense = await create();
    const disabled = ok(
      await call(cookie, 'PUT', `/api/expense-categories/${category.id}`, {
        name: category.name,
        active: false,
        version: category.version,
      }),
    );

    assert.equal(disabled.active, false);
    assert.ok(await ExpenseModel.findByPk(expense.id));
    invalid(await call(cookie, 'POST', '/api/expenses', input()), 'categoryId');
    const edited = ok(
      await call(
        cookie,
        'PUT',
        `/api/expenses/${expense.id}`,
        input({ amount: 42, version: expense.version }),
      ),
    );

    assert.equal(edited.categoryId, category.id);
    category = disabled;
  });
});
