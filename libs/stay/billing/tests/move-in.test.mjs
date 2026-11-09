import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { computeMoveInInvoice } from '../dist/index.js';
import {
  amounts,
  assertBalanced,
  assertBillingError,
  line,
  SERVICES,
  serviceLine,
} from './fixtures.mjs';

function moveIn(contract, overrides = {}) {
  return computeMoveInInvoice({
    contract: { rent: 3000000, ...contract },
    occupantCount: 2,
    vehicleCount: 1,
    services: SERVICES,
    ...overrides,
  });
}

describe('computeMoveInInvoice — rules.md example: move-in 20/11/2026', () => {
  const invoice = moveIn({ startDate: '2026-11-20' });

  test('rent and services prorated 11/30, in period 2026-11', () => {
    assert.equal(invoice.kind, 'move_in');
    assert.equal(invoice.period, '2026-11');

    for (const item of invoice.lines.filter((entry) => entry.type !== 'rounding')) {
      assert.equal(item.ratioNum, 11);
      assert.equal(item.ratioDen, 30);
      assert.deepEqual([item.meta.coveredFrom, item.meta.coveredTo], ['2026-11-20', '2026-11-30']);
    }
  });

  test('line amounts: each line rounded half-up to whole đồng', () => {
    assert.deepEqual(amounts(invoice), [
      ['rent', 1100000],
      ['service', 36667],
      ['service', 11000],
      ['service', 36667],
      ['service', 36667],
      ['rounding', -1],
    ]);
  });

  test('per_person line is rounded once on price × people × ratio (not per person)', () => {
    // 50.000 × 2 × 11/30 = 36.666,67 → 36.667 (rounding per person would give 36.666).
    assert.equal(serviceLine(invoice, 'common').amount, 36667);
  });

  test('total 1.221.000đ with a −1đ rounding line', () => {
    assert.equal(invoice.subtotal, 1221001);
    assert.equal(invoice.rounding, -1);
    assert.equal(invoice.total, 1221000);
    assertBalanced(invoice);
  });

  test('no electricity, water or deposit lines', () => {
    for (const type of ['electricity', 'water', 'deposit']) {
      assert.equal(
        invoice.lines.some((item) => item.type === type),
        false,
        `${type} must not be on a move-in invoice`,
      );
    }
  });
});

describe('computeMoveInInvoice — edge cases', () => {
  test('move-in on the 1st bills the full month', () => {
    const invoice = moveIn({ startDate: '2026-11-01' });

    assert.equal(line(invoice, (item) => item.type === 'rent').amount, 3000000);
    assert.equal(invoice.total, 3330000);
  });

  test('move-in on the last day: 1/30', () => {
    const invoice = moveIn({ startDate: '2026-11-30' });

    assert.equal(line(invoice, (item) => item.type === 'rent').ratioNum, 1);
    assert.equal(line(invoice, (item) => item.type === 'rent').amount, 100000);
  });

  test('start == end date counts one day (1/30)', () => {
    const invoice = moveIn({ startDate: '2026-11-30', endDate: '2026-11-30' });

    assert.deepEqual(amounts(invoice), [
      ['rent', 100000],
      ['service', 3333],
      ['service', 1000],
      ['service', 3333],
      ['service', 3333],
      ['rounding', 1],
    ]);
    assert.equal(invoice.total, 111000);
    assertBalanced(invoice);
  });

  test('contract starting and ending in the same month: 10/11 → 19/11 is 10/30', () => {
    const invoice = moveIn({ startDate: '2026-11-10', endDate: '2026-11-19' });
    const rent = line(invoice, (item) => item.type === 'rent');

    assert.equal(rent.ratioNum, 10);
    assert.deepEqual(rent.meta, { coveredFrom: '2026-11-10', coveredTo: '2026-11-19' });
    assert.deepEqual(amounts(invoice), [
      ['rent', 1000000],
      ['service', 33333],
      ['service', 10000],
      ['service', 33333],
      ['service', 33333],
      ['rounding', 1],
    ]);
    assert.equal(invoice.total, 1110000);
    assertBalanced(invoice);
  });

  test('February 2027 (28 days): move-in 15/02 → 14/28', () => {
    const invoice = moveIn({ startDate: '2027-02-15' });

    assert.equal(invoice.period, '2027-02');
    assert.deepEqual(amounts(invoice), [
      ['rent', 1500000],
      ['service', 50000],
      ['service', 15000],
      ['service', 50000],
      ['service', 50000],
    ]);
    assert.equal(invoice.total, 1665000);
    assert.equal(invoice.rounding, 0);
  });

  test('leap February 2028 (29 days): move-in 15/02 → 15/29 with −413đ rounding', () => {
    const invoice = moveIn({ startDate: '2028-02-15' });

    assert.equal(line(invoice, (item) => item.type === 'rent').ratioDen, 29);
    assert.deepEqual(amounts(invoice), [
      ['rent', 1551724],
      ['service', 51724],
      ['service', 15517],
      ['service', 51724],
      ['service', 51724],
      ['rounding', -413],
    ]);
    assert.equal(invoice.total, 1722000);
    assertBalanced(invoice);
  });

  test('leap day move-in 29/02/2028 → 1/29', () => {
    const invoice = moveIn({ startDate: '2028-02-29' });

    assert.equal(line(invoice, (item) => item.type === 'rent').ratioNum, 1);
    assert.equal(line(invoice, (item) => item.type === 'rent').amount, 103448);
  });

  test('an exact half đồng rounds up: 14đ × 1/28 = 0,5 → 1', () => {
    const invoice = computeMoveInInvoice({
      contract: { startDate: '2027-02-28', rent: 14 },
      occupantCount: 0,
      vehicleCount: 0,
      roundingUnit: 1,
    });

    assert.equal(line(invoice, (item) => item.type === 'rent').amount, 1);
  });

  test('a first-month discount can be added to the move-in invoice', () => {
    const invoice = moveIn(
      { startDate: '2026-11-20' },
      { manualLines: [{ type: 'discount', amount: 21000, reason: 'Giảm giá tháng đầu' }] },
    );

    assert.equal(invoice.total, 1200000);
    assertBalanced(invoice);
  });

  test('every move-in day of 2026–2028 produces a balanced invoice', () => {
    for (let time = Date.UTC(2026, 0, 1); time <= Date.UTC(2028, 11, 31); time += 86400000) {
      const startDate = new Date(time).toISOString().slice(0, 10);
      const invoice = moveIn({ startDate }, { occupantCount: 3, vehicleCount: 2 });

      assertBalanced(invoice);
    }
  });

  test('end before start is rejected', () => {
    assertBillingError(
      () => moveIn({ startDate: '2026-11-20', endDate: '2026-11-19' }),
      'END_BEFORE_START',
    );
  });
});
