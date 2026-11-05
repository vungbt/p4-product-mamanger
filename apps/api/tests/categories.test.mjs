import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createInstance } from 'i18next';
import { Op, UniqueConstraintError, ValidationErrorItem } from 'sequelize';
import { handleErrorApi } from '../dist/middlewares/error.middleware.js';
import { list as listController } from '../dist/modules/categories/categories.controller.js';
import { listCategories } from '../dist/modules/categories/categories.service.js';
import {
  validateCategory,
  validateCategoryListQuery,
} from '../dist/modules/categories/categories.validation.js';
import { CategoryModel } from '../dist/sequelize/models/index.js';

const i18n = createInstance();
const resources = Object.fromEntries(
  ['en', 'vi'].map((locale) => [
    locale,
    Object.fromEntries(
      ['validator', 'error'].map((namespace) => [
        namespace,
        JSON.parse(
          readFileSync(
            new URL(`../src/language/${locale}/${namespace}.json`, import.meta.url),
            'utf8',
          ),
        ),
      ]),
    ),
  ]),
);
await i18n.init({ lng: 'en', fallbackLng: 'en', resources });

function request(query, language = 'en') {
  return { query, language, t: i18n.getFixedT(language) };
}

function parseCategoryListQuery(query, language = 'en') {
  const res = { locals: {} };
  let error;
  validateCategoryListQuery(request(query, language), res, (value) => {
    error = value;
  });
  if (error) throw error;
  return res.locals.listQuery;
}

async function list(req, res, next) {
  res.locals = {};
  Object.assign(req, request(req.query));
  let error;
  validateCategoryListQuery(req, res, (value) => {
    error = value;
  });
  if (error) return next(error);
  return listController(req, res, next);
}

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

test('query validation preserves Express query/body and normalizes whitespace', () => {
  const query = Object.freeze({
    page: ' 2 ',
    pageSize: ' 20 ',
    q: ' hello ',
    sortBy: ' slug ',
    sortOrder: ' desc ',
    description: ' has ',
  });
  const req = { ...request(query), body: { unchanged: true } };
  const res = { locals: {} };
  validateCategoryListQuery(req, res, (error) => {
    if (error) throw error;
  });
  assert.equal(req.query, query);
  assert.deepEqual(req.body, { unchanged: true });
  assert.deepEqual(res.locals.listQuery, {
    page: 2,
    pageSize: 20,
    q: 'hello',
    sortBy: 'slug',
    sortOrder: 'desc',
    description: 'has',
  });
  assert.equal(parseCategoryListQuery({ lang: 'vi' }), undefined);
  assert.equal(parseCategoryListQuery({ q: '' }).q, '');
});

test('rejects empty enums, malformed numbers and scalar arrays with localized field errors', () => {
  for (const query of [
    { page: '' },
    { page: '1e2' },
    { page: '1.0' },
    { sortBy: '' },
    { description: '' },
    { pageSize: [] },
    { q: [] },
    { q: {} },
  ]) {
    assert.throws(
      () => parseCategoryListQuery(query),
      (error) =>
        error.code === 'input_valid_error' &&
        error.statusCode === 400 &&
        Object.keys(error.extensions).length > 0,
    );
  }
  for (const locale of ['en', 'vi']) {
    for (const query of [{ q: ['a', 'b'] }, { sortBy: 'invalid' }]) {
      assert.throws(
        () => parseCategoryListQuery(query, locale),
        (error) => {
          assert.equal(error.code, 'input_valid_error');
          assert.equal(error.message, i18n.getFixedT(locale)('error:input_valid_error'));
          const messages = Object.values(error.extensions).flat();
          assert.ok(
            messages.every(
              (message) => typeof message === 'string' && !message.includes('validator:'),
            ),
          );
          return true;
        },
      );
    }
  }
});

test('existing category body validation still validates and retains its input', () => {
  const req = {
    ...request({}),
    body: { name: 'Category', slug: 'category', description: 'Description' },
  };
  validateCategory(req, {}, (error) => {
    if (error) throw error;
  });
  assert.deepEqual(req.body, { name: 'Category', slug: 'category', description: 'Description' });
  let failure;
  validateCategory({ ...request({}), body: { slug: 'category' } }, {}, (error) => {
    failure = error;
  });
  assert.equal(failure.code, 'input_valid_error');
  assert.ok(failure.extensions.name);
});

test('unique slug violations return localized field errors without leaking database values', () => {
  const privateSlug = 'private-conflicting-value';
  const error = new UniqueConstraintError({
    fields: { slug: privateSlug },
    errors: [
      new ValidationErrorItem('raw database message', 'unique violation', 'slug', privateSlug),
    ],
  });

  for (const locale of ['en', 'vi']) {
    let status;
    let body;
    handleErrorApi(
      error,
      request({}, locale),
      {
        status(value) {
          status = value;
          return this;
        },
        json(value) {
          body = value;
          return this;
        },
      },
      () => {},
    );
    assert.equal(status, 400);
    assert.equal(body.code, 'input_valid_error');
    assert.deepEqual(body.extensions, {
      slug: [i18n.getFixedT(locale)('error:unique_value', { attribute: 'Slug' })],
    });
    assert.ok(!JSON.stringify(body).includes(privateSlug));
    assert.ok(!JSON.stringify(body).includes('raw database message'));
  }
});
