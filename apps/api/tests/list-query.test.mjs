import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createInstance } from 'i18next';
import { validateAddressesListQuery } from '../dist/modules/addresses/addresses.validation.js';
import { validateCouponsListQuery } from '../dist/modules/coupons/coupons.validation.js';
import { validateOrdersListQuery } from '../dist/modules/orders/orders.validation.js';
import { validateProductsListQuery } from '../dist/modules/products/products.validation.js';
import { validateRefundsListQuery } from '../dist/modules/refunds/refunds.validation.js';
import { validateReviewsListQuery } from '../dist/modules/reviews/reviews.validation.js';

const i18n = createInstance();
await i18n.init({
  lng: 'en',
  resources: {
    en: Object.fromEntries(
      ['validator', 'error'].map((ns) => [
        ns,
        JSON.parse(readFileSync(new URL(`../src/language/en/${ns}.json`, import.meta.url), 'utf8')),
      ]),
    ),
  },
});
const validators = [
  validateProductsListQuery,
  validateOrdersListQuery,
  validateCouponsListQuery,
  validateRefundsListQuery,
  validateReviewsListQuery,
  validateAddressesListQuery,
];

function parse(validator, query) {
  const req = {
    query: Object.freeze(query),
    body: { keep: true },
    language: 'en',
    t: i18n.t.bind(i18n),
  };
  const res = { locals: {} };
  let error;
  validator(req, res, (failure) => {
    error = failure;
  });
  assert.deepEqual(req.body, { keep: true });
  if (error) throw error;
  return res.locals.listQuery;
}

for (const [index, validator] of validators.entries()) {
  test(`${['products', 'orders', 'coupons', 'refunds', 'reviews', 'addresses'][index]}: strict pagination, scalar inputs and sort allowlist`, () => {
    for (const query of [
      { page: '2abc' },
      { page: '1.5' },
      { pageSize: '101' },
      { pageSize: { toString: 'invalid' } },
      { pageSize: '0' },
      { page: '9007199254740991', pageSize: '100' },
      { q: [] },
      { q: {} },
      { sortBy: 'name; SELECT 1' },
      { sortOrder: 'descending' },
    ]) {
      assert.throws(
        () => parse(validator, query),
        (error) =>
          error.statusCode === 400 &&
          error.code === 'input_valid_error' &&
          Object.keys(error.extensions).length > 0,
      );
    }
    const result = parse(validator, { page: ' 2 ', pageSize: '20', q: ' test ' });
    assert.equal(result.page, 2);
    assert.equal(result.pageSize, 20);
    assert.equal(result.q, 'test');
  });
}

test('resource filters keep numeric zero and boolean false; reject invalid ranges and enums', () => {
  const products = parse(validateProductsListQuery, {
    minPrice: '0',
    maxPrice: '0',
    minStock: '0',
    maxStock: '0',
    sortBy: 'stock',
  });
  assert.equal(products.maxStock, 0);
  assert.equal(products.maxPrice, 0);
  assert.equal(parse(validateCouponsListQuery, { isActive: 'false' }).isActive, false);
  assert.equal(parse(validateAddressesListQuery, { isDefault: 'false' }).isDefault, false);
  for (const [validator, query] of [
    [validateProductsListQuery, { minPrice: '20', maxPrice: '10' }],
    [validateProductsListQuery, { minStock: '2', maxStock: '1' }],
    [validateProductsListQuery, { categoryId: 'bad-id' }],
    [validateOrdersListQuery, { status: 'unknown' }],
    [validateOrdersListQuery, { minTotal: '2', maxTotal: '1' }],
    [validateOrdersListQuery, { paymentStatus: 'refunded' }],
    [validateOrdersListQuery, { shipmentStatus: 'unknown' }],
    [validateRefundsListQuery, { minAmount: '2', maxAmount: '1' }],
    [validateRefundsListQuery, { orderId: {} }],
    [validateReviewsListQuery, { rating: '6' }],
    [validateCouponsListQuery, { isActive: '0' }],
    [validateCouponsListQuery, { type: 'unknown' }],
  ]) {
    assert.throws(
      () => parse(validator, query),
      (error) => error.code === 'input_valid_error',
    );
  }
});

test('date ranges accept ISO dates and UTC timestamps; reject malformed dates and inverted ranges', () => {
  for (const validator of [validateOrdersListQuery, validateRefundsListQuery]) {
    for (const query of [
      { createdFrom: '2026-02-30' },
      { createdFrom: '2026' },
      { createdTo: '11/05/2026' },
      { createdFrom: '2026-11-05', createdTo: '2026-11-04' },
    ]) {
      assert.throws(
        () => parse(validator, query),
        (error) => error.code === 'input_valid_error',
      );
    }
    assert.equal(
      parse(validator, { createdFrom: '2026-11-05T12:00:00Z', createdTo: '2026-11-05' }).createdTo,
      '2026-11-05',
    );
    assert.equal(
      parse(validator, { createdTo: '2026-11-05T12:00:00.000Z' }).createdTo,
      '2026-11-05T12:00:00.000Z',
    );
  }
});

test('legacy array endpoints remain unpaginated without list parameters', () => {
  for (const validator of [
    validateCouponsListQuery,
    validateRefundsListQuery,
    validateReviewsListQuery,
    validateAddressesListQuery,
  ]) {
    assert.equal(parse(validator, {}), undefined);
    assert.ok(parse(validator, { page: '1' }));
  }
  assert.equal(
    parse(validateRefundsListQuery, { orderId: '00000000-0000-4000-a000-000000000001' }),
    undefined,
  );
  assert.equal(parse(validateProductsListQuery, {}).pageSize, 10);
  assert.equal(parse(validateOrdersListQuery, {}).pageSize, 10);
});
