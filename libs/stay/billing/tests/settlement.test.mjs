import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  computeMonthlyInvoice,
  computeMoveInInvoice,
  computeSettlement,
  toPrepaidLines,
} from '../dist/index.js';
import {
  amounts,
  assertBalanced,
  assertBillingError,
  electricity,
  fullMonthInput,
  line,
  SERVICES,
  water,
} from './fixtures.mjs';

// November 2026 was prepaid by the full-month invoice of rules.md.
const NOVEMBER = computeMonthlyInvoice(fullMonthInput());
const NOVEMBER_PREPAID = toPrepaidLines(NOVEMBER.lines, 'inv-2026-11');

// Utilities from the 31/10 closing (1.250 kWh, 88 m³) to the move-out readings.
const FINAL_UTILITIES = [
  electricity([{ startReading: 1250, endReading: 1290 }]),
  water([{ startReading: 88, endReading: 91 }]),
];

const CLEANING = { type: 'surcharge', amount: 150000, reason: 'Dọn dẹp phòng' };

function settle(overrides = {}) {
  return computeSettlement({
    contract: { startDate: '2026-01-01' },
    moveOutDate: '2026-11-20',
    utilities: FINAL_UTILITIES,
    refundUnusedRent: false,
    prepaidLines: NOVEMBER_PREPAID,
    surcharges: [CLEANING],
    outstandingInvoices: [],
    depositHeld: 3000000,
    ...overrides,
  });
}

describe('toPrepaidLines', () => {
  test('keeps rent/service lines with their coverage and source invoice', () => {
    assert.equal(NOVEMBER_PREPAID.length, 5);
    assert.deepEqual(NOVEMBER_PREPAID[0], {
      type: 'rent',
      serviceId: null,
      period: '2026-11',
      unitPrice: 3000000,
      quantity: 1,
      coveredFrom: '2026-11-01',
      coveredTo: '2026-11-30',
      sourceInvoiceId: 'inv-2026-11',
    });
    assert.equal(NOVEMBER_PREPAID[3].code, 'common');
    assert.equal(NOVEMBER_PREPAID[3].quantity, 2);
    assert.equal(NOVEMBER_PREPAID[3].name, 'Phí chung');
  });
});

describe('computeSettlement — move-out 20/11/2026 mid-month', () => {
  test('refundUnusedRent off (default policy): utilities + surcharge only', () => {
    const settlement = settle();

    assert.equal(settlement.kind, 'settlement');
    assert.equal(settlement.period, '2026-11');
    assert.deepEqual(amounts(settlement), [
      ['electricity', 140000],
      ['water', 60000],
      ['surcharge', 150000],
    ]);
    assert.equal(line(settlement, (item) => item.type === 'electricity').period, '2026-11');
    assert.equal(line(settlement, (item) => item.type === 'electricity').meta.endReading, 1290);
    assert.equal(settlement.total, 350000);
    assertBalanced(settlement);
  });

  test('deposit greater than amount due: owner refunds X', () => {
    const settlement = settle();

    assert.equal(settlement.amountDue, 350000);
    assert.equal(settlement.depositHeld, 3000000);
    assert.equal(settlement.depositApplied, 350000);
    assert.equal(settlement.depositRefunded, 2650000);
    assert.equal(settlement.ownerRefunds, 2650000);
    assert.equal(settlement.tenantPays, 0);
  });

  test('deposit smaller than amount due: tenant pays Y', () => {
    const settlement = settle({ depositHeld: 100000 });

    assert.equal(settlement.depositApplied, 100000);
    assert.equal(settlement.depositRefunded, 0);
    assert.equal(settlement.ownerRefunds, 0);
    assert.equal(settlement.tenantPays, 250000);
  });

  test('deposit exactly equal to amount due: nothing to pay or refund', () => {
    const settlement = settle({ depositHeld: 350000 });

    assert.equal(settlement.ownerRefunds, 0);
    assert.equal(settlement.tenantPays, 0);
    assert.equal(settlement.depositApplied, 350000);
  });

  test('no deposit: tenant pays the full amount', () => {
    const settlement = settle({ depositHeld: 0 });

    assert.equal(settlement.tenantPays, 350000);
    assert.equal(settlement.depositApplied, 0);
  });

  test('refundUnusedRent on: refunds 21–30/11 (10/30) of each prepaid line', () => {
    const settlement = settle({ refundUnusedRent: true });
    const refunds = settlement.lines.filter((item) => item.type === 'refund');

    assert.deepEqual(
      refunds.map((item) => item.amount),
      [-1000000, -33333, -10000, -33333, -33333],
    );

    for (const refund of refunds) {
      assert.equal(refund.ratioNum, 10);
      assert.equal(refund.ratioDen, 30);
      assert.equal(refund.period, '2026-11');
      assert.deepEqual(
        [refund.meta.coveredFrom, refund.meta.coveredTo],
        ['2026-11-21', '2026-11-30'],
      );
      assert.equal(refund.meta.sourceInvoiceId, 'inv-2026-11');
    }

    assert.equal(refunds[0].description.key, 'invoiceLine.refundRent');
    assert.equal(refunds[1].description.key, 'invoiceLine.refundService');
    assert.equal(refunds[3].quantity, 2);
  });

  test('refund larger than charges: negative total rounds away from zero, owner refunds more than the deposit', () => {
    const settlement = settle({ refundUnusedRent: true });

    // 200.000 utilities + 150.000 surcharge − 1.109.999 refunds = −759.999 → −760.000
    assert.equal(settlement.subtotal, -759999);
    assert.equal(settlement.rounding, -1);
    assert.equal(settlement.total, -760000);
    assertBalanced(settlement);
    assert.equal(settlement.amountDue, -760000);
    assert.equal(settlement.depositApplied, 0);
    assert.equal(settlement.depositRefunded, 3000000);
    assert.equal(settlement.ownerRefunds, 3760000);
    assert.equal(settlement.tenantPays, 0);
  });

  test('the deposit is never an invoice line', () => {
    for (const settlement of [settle(), settle({ refundUnusedRent: true })]) {
      assert.equal(
        settlement.lines.some((item) => item.type === 'deposit'),
        false,
      );
    }
  });
});

describe('computeSettlement — outstanding invoices', () => {
  const OUTSTANDING = [
    {
      invoiceId: 'inv-2026-09',
      code: 'A-202609-001',
      period: '2026-09',
      total: 3910000,
      paidTotal: 0,
    },
    {
      invoiceId: 'inv-2026-10',
      code: 'A-202610-004',
      period: '2026-10',
      total: 3500000,
      paidTotal: 1500000,
    },
  ];

  test('two unpaid periods are listed, not added as lines, and offset by the deposit', () => {
    const settlement = settle({ outstandingInvoices: OUTSTANDING });

    assert.deepEqual(
      settlement.outstandingInvoices.map((item) => [item.invoiceId, item.code, item.remaining]),
      [
        ['inv-2026-09', 'A-202609-001', 3910000],
        ['inv-2026-10', 'A-202610-004', 2000000],
      ],
    );
    assert.equal(settlement.total, 350000);
    assert.equal(settlement.lines.length, 3);
    assert.equal(settlement.outstandingTotal, 5910000);
    assert.equal(settlement.amountDue, 6260000);
    assert.equal(settlement.depositApplied, 3000000);
    assert.equal(settlement.ownerRefunds, 0);
    assert.equal(settlement.tenantPays, 3260000);
    assertBalanced(settlement);
  });

  test('outstanding debt smaller than the deposit still results in an owner refund', () => {
    const settlement = settle({
      outstandingInvoices: [{ invoiceId: 'inv-x', total: 500000, paidTotal: 300000 }],
    });

    assert.equal(settlement.amountDue, 550000);
    assert.equal(settlement.ownerRefunds, 2450000);
  });

  test('an invoice with nothing left to collect is rejected, not silently dropped', () => {
    assertBillingError(
      () => settle({ outstandingInvoices: [{ invoiceId: 'paid', total: 100, paidTotal: 100 }] }),
      'INVALID_OUTSTANDING_INVOICE',
      { invoiceId: 'paid' },
    );
    assertBillingError(
      () => settle({ outstandingInvoices: [{ total: 100, paidTotal: 0 }] }),
      'INVALID_OUTSTANDING_INVOICE',
    );
  });
});

describe('computeSettlement — dates and refunds', () => {
  test('move-out on the last day of the month: nothing to refund even when enabled', () => {
    const settlement = settle({ moveOutDate: '2026-11-30', refundUnusedRent: true });

    assert.equal(
      settlement.lines.some((item) => item.type === 'refund'),
      false,
    );
    assert.equal(settlement.total, 350000);
  });

  test('the move-out day itself is a day of stay (refund starts the next day)', () => {
    const settlement = settle({
      moveOutDate: '2026-11-29',
      refundUnusedRent: true,
      surcharges: [],
    });
    const rentRefund = line(settlement, (item) => item.type === 'refund');

    assert.equal(rentRefund.ratioNum, 1);
    assert.equal(rentRefund.amount, -100000);
  });

  test('contract that started and ended in the same month, refunding the move-in invoice', () => {
    const moveIn = computeMoveInInvoice({
      contract: { startDate: '2026-11-20', rent: 3000000 },
      occupantCount: 2,
      vehicleCount: 1,
      services: SERVICES,
    });
    const settlement = settle({
      contract: { startDate: '2026-11-20' },
      moveOutDate: '2026-11-25',
      refundUnusedRent: true,
      prepaidLines: toPrepaidLines(moveIn.lines, 'inv-move-in'),
      utilities: [
        electricity([{ startReading: 1250, endReading: 1262 }]),
        water([{ startReading: 88, endReading: 89 }]),
      ],
      surcharges: [],
    });

    // 26–30/11 = 5/30 refunded; utilities 12 × 3.500 + 1 × 20.000 = 62.000.
    assert.deepEqual(amounts(settlement), [
      ['electricity', 42000],
      ['water', 20000],
      ['refund', -500000],
      ['refund', -16667],
      ['refund', -5000],
      ['refund', -16667],
      ['refund', -16667],
      ['rounding', 1],
    ]);
    // −493.001 rounds half-up (away from zero) to −493.000.
    assert.equal(settlement.total, -493000);
    assertBalanced(settlement);
  });

  test('move-out on the contract start date (start == end): refunds the 10 later days', () => {
    const moveIn = computeMoveInInvoice({
      contract: { startDate: '2026-11-20', rent: 3000000 },
      occupantCount: 1,
      vehicleCount: 0,
      services: SERVICES,
    });
    const settlement = settle({
      contract: { startDate: '2026-11-20' },
      moveOutDate: '2026-11-20',
      refundUnusedRent: true,
      prepaidLines: toPrepaidLines(moveIn.lines),
      utilities: [],
      surcharges: [],
    });

    assert.equal(line(settlement, (item) => item.type === 'refund').ratioNum, 10);
    assert.equal(line(settlement, (item) => item.type === 'refund').amount, -1000000);
    assertBalanced(settlement);
  });

  test('leap February 2028: move-out 10/02 refunds 19/29', () => {
    const february = computeMonthlyInvoice(fullMonthInput({ period: '2028-02', utilities: [] }));
    const settlement = settle({
      moveOutDate: '2028-02-10',
      refundUnusedRent: true,
      prepaidLines: toPrepaidLines(february.lines),
      utilities: [],
      surcharges: [],
      depositHeld: 0,
    });
    const rentRefund = line(settlement, (item) => item.type === 'refund');

    assert.equal(rentRefund.ratioNum, 19);
    assert.equal(rentRefund.ratioDen, 29);
    assert.equal(rentRefund.amount, -1965517);
    assert.equal(settlement.period, '2028-02');
    assertBalanced(settlement);
  });

  test('meter replaced before move-out: two segments', () => {
    const settlement = settle({
      utilities: [
        electricity([
          { meterId: 'old', startReading: 1250, endReading: 1270 },
          { meterId: 'new', startReading: 5, endReading: 25 },
        ]),
      ],
      surcharges: [],
    });

    assert.equal(line(settlement, (item) => item.type === 'electricity').quantity, 40);
    assert.equal(settlement.total, 140000);
  });

  test('zero consumption at move-out', () => {
    const settlement = settle({
      utilities: [electricity([{ startReading: 1250, endReading: 1250 }])],
      surcharges: [],
    });

    assert.equal(settlement.total, 0);
    assert.equal(settlement.ownerRefunds, 3000000);
  });

  test('negative consumption at move-out blocks the settlement', () => {
    assertBillingError(
      () => settle({ utilities: [water([{ startReading: 88, endReading: 87 }])] }),
      'NEGATIVE_CONSUMPTION',
      { kind: 'water' },
    );
  });

  test('missing move-out reading blocks the settlement', () => {
    assertBillingError(
      () => settle({ utilities: [electricity([{ startReading: 1250, endReading: undefined }])] }),
      'MISSING_READING',
    );
  });

  test('settlement totals use the building roundingUnit', () => {
    const settlement = settle({
      roundingUnit: 1000,
      utilities: [electricity([{ startReading: 1250, endReading: 1251 }])],
      surcharges: [],
    });

    assert.equal(settlement.subtotal, 3500);
    assert.equal(settlement.total, 4000);
    assert.equal(settlement.rounding, 500);
    assertBalanced(settlement);
  });
});

describe('computeSettlement — validation', () => {
  test('move-out before the contract start', () => {
    assertBillingError(
      () => settle({ contract: { startDate: '2026-11-21' } }),
      'MOVE_OUT_BEFORE_START',
    );
  });

  test('refundUnusedRent on requires prepaid lines', () => {
    assertBillingError(
      () => settle({ refundUnusedRent: true, prepaidLines: undefined }),
      'MISSING_PREPAID_LINES',
    );
  });

  test('refundUnusedRent must be explicit', () => {
    assertBillingError(() => settle({ refundUnusedRent: undefined }), 'INVALID_SETTING');
  });

  test('prepaid line coverage must stay inside its period', () => {
    assertBillingError(
      () =>
        settle({
          refundUnusedRent: true,
          prepaidLines: [
            {
              type: 'rent',
              period: '2026-11',
              unitPrice: 3000000,
              quantity: 1,
              coveredFrom: '2026-11-01',
              coveredTo: '2026-12-01',
            },
          ],
        }),
      'INVALID_PREPAID_LINE',
    );
  });

  test('surcharges need a reason; deposit must be a non-negative integer', () => {
    assertBillingError(
      () => settle({ surcharges: [{ type: 'surcharge', amount: 50000, reason: '' }] }),
      'MISSING_REASON',
    );
    assertBillingError(() => settle({ depositHeld: -1 }), 'INVALID_AMOUNT');
    assertBillingError(() => settle({ moveOutDate: '2026-11-31' }), 'INVALID_DATE');
  });
});
