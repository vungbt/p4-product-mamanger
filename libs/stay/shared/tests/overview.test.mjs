import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  currentBillingPeriod,
  OVERVIEW_TODO_KINDS,
  occupancyRate,
  periodChange,
  periodSeries,
} from '../dist/index.js';

test('period series: the last N periods ending with M, oldest first, across years', () => {
  assert.deepEqual(periodSeries('2026-03'), [
    '2025-10',
    '2025-11',
    '2025-12',
    '2026-01',
    '2026-02',
    '2026-03',
  ]);
  assert.deepEqual(periodSeries('2026-11', 1), ['2026-11']);
  assert.throws(() => periodSeries('2026-11', 0), RangeError);
  assert.throws(() => periodSeries('2026-13'));
});

test('current billing period follows the issue day of the month', () => {
  assert.equal(currentBillingPeriod('2026-11-01', 1), '2026-11');
  assert.equal(currentBillingPeriod('2026-11-30', 1), '2026-11');
  assert.equal(currentBillingPeriod('2026-11-09', 10), '2026-10');
  assert.equal(currentBillingPeriod('2026-11-10', 10), '2026-11');
  assert.equal(currentBillingPeriod('2026-01-05', 10), '2025-12');
  // 31 = end of month: February ends on the 28th/29th.
  assert.equal(currentBillingPeriod('2026-02-27', 31), '2026-01');
  assert.equal(currentBillingPeriod('2026-02-28', 31), '2026-02');
  assert.equal(currentBillingPeriod('2028-02-28', 31), '2028-01');
});

test('occupancy rate: occupied share with four decimals, null without rooms', () => {
  assert.equal(occupancyRate(0, 0), null);
  assert.equal(occupancyRate(3, 0), null);
  assert.equal(occupancyRate(0, 4), 0);
  assert.equal(occupancyRate(6, 7), 0.8571);
  assert.equal(occupancyRate(2, 3), 0.6667);
  assert.equal(occupancyRate(4, 4), 1);
  assert.equal(occupancyRate(5, 4), 1);
  assert.equal(occupancyRate(-1, 4), 0);
});

test('period change: delta and ratio against the previous period', () => {
  assert.deepEqual(periodChange(1_100_000, 1_000_000), { delta: 100_000, ratio: 0.1 });
  assert.deepEqual(periodChange(500, 1000), { delta: -500, ratio: -0.5 });
  assert.deepEqual(periodChange(1000, 0), { delta: 1000, ratio: null });
  assert.deepEqual(periodChange(0, 0), { delta: 0, ratio: null });
});

test('to-do kinds keep the monthly calendar order', () => {
  assert.deepEqual(OVERVIEW_TODO_KINDS, [
    'readings',
    'invoices_to_create',
    'draft_invoices',
    'unshared_invoices',
    'overdue_invoices',
    'expiring_contracts',
    'ending_contracts',
  ]);
});
