import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Op } from 'sequelize';
import { list } from '../dist/modules/categories/categories.controller.js';
import { parseCategoryListQuery } from '../dist/modules/categories/categories.query.js';
import { listCategories } from '../dist/modules/categories/categories.service.js';
import { CategoryModel } from '../dist/sequelize/models/index.js';

const fixture = {
  id: 'category-1',
  name: 'Category',
  slug: 'category',
  description: 'Description',
};

test('legacy list has no pagination; query defaults and all public options are normalized', () => {
  assert.equal(parseCategoryListQuery({}), undefined);
  assert.deepEqual(parseCategoryListQuery({ q: '  hello  ' }), {
    page: 1,
    pageSize: 10,
    q: 'hello',
    description: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  assert.deepEqual(
    parseCategoryListQuery({
      page: '2',
      pageSize: '20',
      q: 'Vietnam',
      description: 'has',
      sortBy: 'slug',
      sortOrder: 'desc',
    }),
    {
      page: 2,
      pageSize: 20,
      q: 'Vietnam',
      description: 'has',
      sortBy: 'slug',
      sortOrder: 'desc',
    },
  );
});

test('reject invalid query shapes, bounds and SQL-like sort values with field errors', () => {
  for (const query of [
    { page: '0' },
    { page: '-1' },
    { page: '1.5' },
    { page: '1abc' },
    { page: '9007199254740991', pageSize: '100' },
    { pageSize: '101' },
    { pageSize: '0' },
    { q: ['a', 'b'] },
    { q: 'a'.repeat(256) },
    { sortBy: 'name; DROP TABLE categories' },
    { sortOrder: 'invalid' },
    { description: 'unknown' },
    { page: ['1', '2'] },
    { sortBy: { field: 'slug' } },
  ]) {
    assert.throws(
      () => parseCategoryListQuery(query),
      (error) => error.statusCode === 400 && Object.keys(error.extensions).length === 1,
    );
  }
});

test('service applies search/filter/sort/limit/offset in SQL query and returns full filtered count', async (t) => {
  let options;
  t.mock.method(CategoryModel, 'findAndCountAll', async (value) => {
    options = value;
    return { rows: [fixture], count: 42 };
  });
  const result = await listCategories(
    parseCategoryListQuery({
      page: '3',
      pageSize: '10',
      q: '50%_\\',
      description: 'has',
      sortBy: 'slug',
      sortOrder: 'desc',
    }),
  );
  assert.deepEqual(result, {
    data: [fixture],
    meta: { page: 3, pageSize: 10, total: 42, totalPages: 5 },
  });
  assert.equal(options.limit, 10);
  assert.equal(options.offset, 20);
  assert.deepEqual(options.order, [
    ['slug', 'DESC'],
    ['id', 'ASC'],
  ]);
  const [search, description] = options.where[Op.and];
  assert.deepEqual(
    search[Op.or].map((entry) => Object.keys(entry)[0]),
    ['name', 'slug', 'description'],
  );
  assert.equal(search[Op.or][0].name[Op.iLike], '%50\\%\\_\\\\%');
  const sql = CategoryModel.sequelize
    .getQueryInterface()
    .queryGenerator.selectQuery('categories', options, CategoryModel);
  assert.match(sql, /ORDER BY .*"slug" DESC, .*"id" ASC/);
  assert.match(sql, /btrim\("description"\) != ''/);
  assert.match(sql, /LIMIT 10 OFFSET 20/);
  assert.ok(description);
});

test('empty and beyond-last-page responses preserve requested page and total count', async (t) => {
  t.mock.method(CategoryModel, 'findAndCountAll', async () => ({ rows: [], count: 0 }));
  assert.deepEqual((await listCategories(parseCategoryListQuery({ page: '1' }))).meta, {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  CategoryModel.findAndCountAll.mock.mockImplementation(async () => ({ rows: [], count: 12 }));
  assert.deepEqual((await listCategories(parseCategoryListQuery({ page: '3' }))).meta, {
    page: 3,
    pageSize: 10,
    total: 12,
    totalPages: 2,
  });
});

test('missing-description filter uses trimmed empty text', async (t) => {
  let options;
  t.mock.method(CategoryModel, 'findAndCountAll', async (value) => {
    options = value;
    return { rows: [], count: 0 };
  });
  await listCategories(parseCategoryListQuery({ description: 'none', sortBy: 'description' }));
  assert.deepEqual(options.order, [
    ['description', 'ASC'],
    ['id', 'ASC'],
  ]);
  const sql = CategoryModel.sequelize
    .getQueryInterface()
    .queryGenerator.selectQuery('categories', options, CategoryModel);
  assert.match(sql, /btrim\("description"\) = ''/);
});

test('controller retains legacy envelope and paginated envelope; forwards validation/DB errors', async (t) => {
  t.mock.method(CategoryModel, 'findAll', async () => [fixture]);
  t.mock.method(CategoryModel, 'findAndCountAll', async () => ({ rows: [fixture], count: 1 }));
  let body;
  const response = {
    jsonApi(status, value) {
      assert.equal(status, 200);
      body = value;
    },
  };
  await list({ query: {} }, response, (error) => {
    throw error;
  });
  assert.deepEqual(body, { data: [fixture] });
  await list({ query: { page: '1' } }, response, (error) => {
    throw error;
  });
  assert.equal(body.meta.total, 1);
  let forwarded;
  await list({ query: { sortBy: 'invalid' } }, response, (error) => {
    forwarded = error;
  });
  assert.equal(forwarded.statusCode, 400);
  const dbError = new Error('database unavailable');
  CategoryModel.findAndCountAll.mock.mockImplementation(async () => {
    throw dbError;
  });
  await list({ query: { page: '1' } }, response, (error) => {
    forwarded = error;
  });
  assert.equal(forwarded, dbError);
});
