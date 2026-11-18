import assert from 'node:assert/strict';
import { test } from 'node:test';
import { invoiceOverdueDays, receivableBucket } from '../dist/index.js';

test('overdue days count whole calendar days after the due date', () => {
  assert.equal(invoiceOverdueDays('2026-11-05', '2026-11-05', 0), 0);
  assert.equal(invoiceOverdueDays('2026-11-05', '2026-11-01', 0), 0);
  assert.equal(invoiceOverdueDays('2026-11-05', '2026-11-06', 0), 1);
  assert.equal(invoiceOverdueDays('2026-02-28', '2026-03-01', 0), 1);
  assert.equal(invoiceOverdueDays('2025-12-31', '2026-01-31', 0), 31);
});

test('buckets: not due, 1–7, 8–30, over 30 days', () => {
  for (const [days, bucket] of [
    [0, 'not_due'],
    [1, '1_7'],
    [7, '1_7'],
    [8, '8_30'],
    [30, '8_30'],
    [31, 'over_30'],
  ])
    assert.equal(receivableBucket(days), bucket, `${days} days`);
});
