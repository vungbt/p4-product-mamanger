import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  billingDate,
  computeMonthlyInvoice,
  invoiceCodePeriod,
  invoicePaymentStatus,
  invoiceSchedule,
  invoiceTotals,
  manualLines,
} from '../dist/index.js';
import { assertBalanced, assertBillingError, electricity, fullMonthInput } from './fixtures.mjs';

describe('billingDate', () => {
  test('day of the period; 31 or past the month end is the last day', () => {
    assert.equal(billingDate('2026-11', 1), '2026-11-01');
    assert.equal(billingDate('2026-11', 5), '2026-11-05');
    assert.equal(billingDate('2026-11', 31), '2026-11-30');
    assert.equal(billingDate('2027-02', 31), '2027-02-28');
    assert.equal(billingDate('2028-02', 31), '2028-02-29');
  });

  test('rejects invalid days and periods', () => {
    assertBillingError(() => billingDate('2026-11', 0), 'INVALID_SETTING');
    assertBillingError(() => billingDate('2026-11', 1.5), 'INVALID_SETTING');
    assertBillingError(() => billingDate('2026-13', 1), 'INVALID_PERIOD');
  });
});

describe('invoiceSchedule', () => {
  test('monthly: issue and due days of the period (rules.md defaults 1 and 5)', () => {
    assert.deepEqual(
      invoiceSchedule({
        kind: 'monthly',
        period: '2026-11',
        issueDay: 1,
        dueDay: 5,
        today: '2026-11-10',
      }),
      { issuedOn: '2026-11-01', dueOn: '2026-11-05' },
    );
  });

  test('move-in: issued today, due today or on a later start date', () => {
    const base = { kind: 'move_in', period: '2026-11', issueDay: 1, dueDay: 5 };

    assert.deepEqual(invoiceSchedule({ ...base, today: '2026-11-20', eventDate: '2026-11-18' }), {
      issuedOn: '2026-11-20',
      dueOn: '2026-11-20',
    });
    assert.deepEqual(invoiceSchedule({ ...base, today: '2026-11-15', eventDate: '2026-11-20' }), {
      issuedOn: '2026-11-15',
      dueOn: '2026-11-20',
    });
    assert.deepEqual(invoiceSchedule({ ...base, today: '2026-11-15' }), {
      issuedOn: '2026-11-15',
      dueOn: '2026-11-15',
    });
  });
});

describe('invoiceCodePeriod', () => {
  test('monthly uses the billing period; move-in and settlement the issue date period', () => {
    assert.equal(invoiceCodePeriod('monthly', '2026-11', '2026-10-28'), '2026-11');
    assert.equal(invoiceCodePeriod('move_in', '2026-11', '2026-12-02'), '2026-12');
    assert.equal(invoiceCodePeriod('settlement', '2026-12', '2026-12-03'), '2026-12');
  });
});

describe('invoiceTotals', () => {
  test('adding a surcharge to stored lines re-rounds the total with a new rounding line', () => {
    const invoice = computeMonthlyInvoice(fullMonthInput());
    const surcharge = manualLines([{ type: 'surcharge', amount: 1234, reason: 'Đền ghế' }], 'x');
    const lines = [...invoice.lines, ...surcharge];
    const totals = invoiceTotals(lines, 1000);

    assert.equal(totals.subtotal, 3911234);
    assert.equal(totals.total, 3911000);
    assert.equal(totals.rounding, -234);
    assert.equal(totals.roundingLine.type, 'rounding');
    assert.equal(totals.roundingLine.amount, -234);
    assert.equal(
      [...lines, totals.roundingLine].reduce((sum, line) => sum + line.amount, 0),
      totals.total,
    );
  });

  test('ignores a previous rounding line; no rounding line when the subtotal is round', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({ manualLines: [{ type: 'discount', amount: 250, reason: 'Giảm' }] }),
    );

    assert.equal(invoice.rounding, 250);
    assertBalanced(invoice);
    const totals = invoiceTotals(
      invoice.lines.filter((line) => line.type !== 'discount'),
      1000,
    );

    assert.deepEqual(
      { subtotal: totals.subtotal, rounding: totals.rounding, total: totals.total },
      { subtotal: 3910000, rounding: 0, total: 3910000 },
    );
    assert.equal(totals.roundingLine, null);
  });

  test('negative amounts round away from zero (rules.md)', () => {
    const totals = invoiceTotals([{ type: 'discount', amount: -759500 }], 1000);

    assert.equal(totals.total, -760000);
    assert.equal(totals.rounding, -500);
  });

  test('rejects an invalid rounding unit', () => {
    assertBillingError(() => invoiceTotals([], 0), 'INVALID_ROUNDING_UNIT');
  });
});

describe('room change closing segment', () => {
  test('old-room utility line carries the room and source event in meta', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        utilities: [
          {
            ...electricity([{ meterId: 'old-meter', startReading: 500, endReading: 540 }]),
            roomId: 'room-old',
            sourceEventId: 'event-1',
          },
          electricity([{ meterId: 'new-meter', startReading: 10, endReading: 30 }]),
        ],
      }),
    );
    const [old, current] = invoice.lines.filter((line) => line.type === 'electricity');

    assert.equal(old.amount, 140000);
    assert.equal(old.meta.roomId, 'room-old');
    assert.equal(old.meta.sourceEventId, 'event-1');
    assert.equal(current.amount, 70000);
    assert.equal(current.meta.roomId, undefined);
    assertBalanced(invoice);
  });
});

describe('invoicePaymentStatus (ST-15)', () => {
  test('recomputed from the paid total', () => {
    assert.equal(invoicePaymentStatus(3910000, 0), 'issued');
    assert.equal(invoicePaymentStatus(3910000, 1000000), 'partially_paid');
    assert.equal(invoicePaymentStatus(3910000, 3910000), 'paid');
    assert.equal(invoicePaymentStatus(0, 0), 'paid');
  });

  test('rejects overpayment and negative or fractional amounts', () => {
    assertBillingError(() => invoicePaymentStatus(1000, 1001), 'INVALID_AMOUNT');
    assertBillingError(() => invoicePaymentStatus(1000, -1), 'INVALID_AMOUNT');
    assertBillingError(() => invoicePaymentStatus(1000.5, 0), 'INVALID_AMOUNT');
  });
});
