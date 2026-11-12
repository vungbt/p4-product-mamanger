import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  afterDueReminderOn,
  billingCycleErrors,
  currentBillingPeriod,
  DEFAULT_BILLING_SETTINGS,
  defaultReadingPeriod,
  defaultReadOn,
  invoiceCalendar,
  invoiceOverdueDays,
  invoiceOverdueDaysSql,
  isInReadingWindow,
  isInvoiceOverdue,
  overdueFrom,
  readingDateOf,
  readingWindow,
} from '../dist/index.js';

const same = { readingDay: 31, readingDayMonth: 'same' };
const next = { readingDay: 5, readingDayMonth: 'next' };
const owner = { ...next, issueDay: 6, dueDay: 10, graceDays: 5 };

describe('reading day mode', () => {
  test('defaults keep the current behaviour', () => {
    assert.equal(DEFAULT_BILLING_SETTINGS.readingDayMonth, 'same');
    assert.equal(DEFAULT_BILLING_SETTINGS.graceDays, 0);
  });

  test('reading date of a consumption month', () => {
    assert.equal(readingDateOf('2026-11', same), '2026-11-30');
    assert.equal(readingDateOf('2026-11', next), '2026-12-05');
    // Year end, February and day 31 (end of month).
    assert.equal(readingDateOf('2026-12', next), '2027-01-05');
    assert.equal(
      readingDateOf('2027-01', { readingDay: 31, readingDayMonth: 'next' }),
      '2027-02-28',
    );
    assert.equal(
      readingDateOf('2028-01', { readingDay: 31, readingDayMonth: 'next' }),
      '2028-02-29',
    );
    assert.equal(readingDateOf('2026-02', same), '2026-02-28');
    assert.equal(
      readingDateOf('2026-02', { readingDay: 25, readingDayMonth: 'same' }),
      '2026-02-25',
    );
  });

  test('same mode: readings are dated inside the consumption month', () => {
    const window = readingWindow('2026-11', same);

    assert.deepEqual(window, { from: '2026-11-01', to: '2026-11-30' });
    assert.ok(isInReadingWindow('2026-11-01', window));
    assert.ok(isInReadingWindow('2026-11-30', window));
    assert.ok(!isInReadingWindow('2026-12-05', window));
    assert.ok(!isInReadingWindow('2026-10-31', window));
    // The reading day does not shrink the month in `same` mode (current behaviour).
    assert.deepEqual(readingWindow('2026-02', { readingDay: 25, readingDayMonth: 'same' }), {
      from: '2026-02-01',
      to: '2026-02-28',
    });
  });

  test('next mode: from the 1st of P through the reading day of P+1', () => {
    const window = readingWindow('2026-11', next);

    assert.deepEqual(window, { from: '2026-11-01', to: '2026-12-05' });
    assert.ok(isInReadingWindow('2026-12-05', window));
    assert.ok(!isInReadingWindow('2026-12-06', window));
    assert.ok(!isInReadingWindow('2026-10-31', window));
    assert.deepEqual(readingWindow('2026-12', next), { from: '2026-12-01', to: '2027-01-05' });
    assert.deepEqual(readingWindow('2027-01', { readingDay: 31, readingDayMonth: 'next' }), {
      from: '2027-01-01',
      to: '2027-02-28',
    });
  });

  test('readings screen opens on the month being closed', () => {
    assert.equal(defaultReadingPeriod('2026-12-03', same), '2026-12');
    assert.equal(defaultReadingPeriod('2026-12-03', next), '2026-11');
    assert.equal(defaultReadingPeriod('2026-12-05', next), '2026-11');
    assert.equal(defaultReadingPeriod('2026-12-06', next), '2026-12');
    assert.equal(defaultReadingPeriod('2027-01-02', next), '2026-12');
  });

  test('default read-on date', () => {
    assert.equal(defaultReadOn('2026-11', same, '2026-11-12'), '2026-11-30');
    assert.equal(defaultReadOn('2026-02', same, '2026-02-10'), '2026-02-28');
    assert.equal(defaultReadOn('2026-11', next, '2026-12-04'), '2026-12-04');
    assert.equal(defaultReadOn('2026-11', next, '2026-12-20'), '2026-12-05');
    assert.equal(defaultReadOn('2026-12', next, '2027-01-03'), '2027-01-03');
  });

  test('current billing period starts at the reading day in next mode', () => {
    assert.equal(currentBillingPeriod('2026-12-04', owner), '2026-11');
    assert.equal(currentBillingPeriod('2026-12-05', owner), '2026-12');
    assert.equal(
      currentBillingPeriod('2026-12-05', { ...owner, readingDayMonth: 'same' }),
      '2026-11',
    );
    assert.equal(
      currentBillingPeriod('2026-12-06', { ...owner, readingDayMonth: 'same' }),
      '2026-12',
    );
  });
});

describe('grace period', () => {
  test('overdue only after dueOn + graceDays', () => {
    assert.equal(overdueFrom('2026-12-10', 0), '2026-12-11');
    assert.equal(overdueFrom('2026-12-10', 5), '2026-12-16');
    assert.equal(overdueFrom('2026-12-31', 1), '2027-01-02');
    assert.equal(invoiceOverdueDays('2026-12-10', '2026-12-15', 5), 0);
    assert.equal(invoiceOverdueDays('2026-12-10', '2026-12-16', 5), 1);
    assert.equal(invoiceOverdueDays('2026-12-10', '2026-12-11', 0), 1);
    assert.equal(invoiceOverdueDays('2026-02-25', '2026-03-03', 5), 1);
    assert.equal(isInvoiceOverdue('issued', '2026-12-10', '2026-12-15', 5), false);
    assert.equal(isInvoiceOverdue('issued', '2026-12-10', '2026-12-16', 5), true);
    assert.equal(isInvoiceOverdue('partially_paid', '2026-12-10', '2026-12-16', 5), true);
    assert.equal(isInvoiceOverdue('paid', '2026-12-10', '2027-01-16', 5), false);
  });

  test('SQL mirror has the same formula', () => {
    assert.equal(
      invoiceOverdueDaysSql('i.due_on', ':graceDays', ':today'),
      'GREATEST(CAST(:today AS date) - (i.due_on + CAST(:graceDays AS integer)), 0)',
    );
  });

  test('after-due reminder: due + 3 without grace, first overdue day with grace', () => {
    assert.equal(afterDueReminderOn('2026-12-10', 0), '2026-12-13');
    assert.equal(afterDueReminderOn('2026-12-10', 5), '2026-12-16');
    assert.equal(afterDueReminderOn('2026-12-31', 1), '2027-01-02');
  });
});

describe('invoice calendar', () => {
  test('owner cycle: readings 05/12 for November, issue 06/12, due 10/12, overdue from 16/12', () => {
    assert.deepEqual(invoiceCalendar('2026-12', owner), {
      period: '2026-12',
      consumptionPeriod: '2026-11',
      readingOn: '2026-12-05',
      issueOn: '2026-12-06',
      dueOn: '2026-12-10',
      overdueFrom: '2026-12-16',
    });
  });

  test('same mode defaults', () => {
    assert.deepEqual(invoiceCalendar('2027-03', { ...DEFAULT_BILLING_SETTINGS }), {
      period: '2027-03',
      consumptionPeriod: '2027-02',
      readingOn: '2027-02-28',
      issueOn: '2027-03-01',
      dueOn: '2027-03-05',
      overdueFrom: '2027-03-06',
    });
  });

  test('validation', () => {
    assert.deepEqual(billingCycleErrors(owner), {});
    assert.deepEqual(billingCycleErrors({ ...owner, readingDay: 7 }), {
      readingDay: 'reading_after_issue',
    });
    assert.deepEqual(billingCycleErrors({ ...owner, readingDay: 6 }), {});
    // `same` mode: the reading day belongs to the previous month, any day is fine.
    assert.deepEqual(billingCycleErrors({ ...owner, readingDayMonth: 'same', readingDay: 31 }), {});
    assert.deepEqual(billingCycleErrors({ ...owner, dueDay: 5 }), { dueDay: 'due_before_issue' });
    assert.deepEqual(billingCycleErrors({ ...owner, graceDays: 32 }), {
      graceDays: 'grace_days_range',
    });
    assert.deepEqual(billingCycleErrors({ ...owner, graceDays: -1 }), {
      graceDays: 'grace_days_range',
    });
    assert.deepEqual(billingCycleErrors({ ...owner, graceDays: 1.5 }), {
      graceDays: 'grace_days_range',
    });
    assert.deepEqual(billingCycleErrors({ ...owner, graceDays: 31 }), {});
  });
});
