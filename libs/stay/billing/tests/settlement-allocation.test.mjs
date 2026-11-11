import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { allocateSettlementDeposit, computeSettlement } from '../dist/index.js';
import { assertBillingError, electricity, water } from './fixtures.mjs';

const OUTSTANDING = [
  { invoiceId: 'inv-2026-09', remaining: 3910000 },
  { invoiceId: 'inv-2026-10', remaining: 2000000 },
];

function allocate(overrides = {}) {
  return allocateSettlementDeposit({
    depositHeld: 3000000,
    settlementTotal: 350000,
    outstandingInvoices: [],
    ...overrides,
  });
}

/** The allocation's net always equals computeSettlement's owner refund / tenant payment. */
function assertSameNet(allocation, settlement) {
  assert.equal(allocation.ownerRefunds, settlement.ownerRefunds);
  assert.equal(allocation.tenantPays, settlement.tenantPays);
}

describe('allocateSettlementDeposit', () => {
  test('deposit greater than the settlement total: applied to it, the rest refunded', () => {
    const allocation = allocate();

    assert.deepEqual(allocation.allocations, [{ invoiceId: null, amount: 350000, remaining: 0 }]);
    assert.equal(allocation.depositApplied, 350000);
    assert.equal(allocation.settlementDepositApplied, 350000);
    assert.equal(allocation.depositRefunded, 2650000);
    assert.equal(allocation.remainingDue, 0);
    assert.equal(allocation.ownerRefunds, 2650000);
    assert.equal(allocation.tenantPays, 0);
  });

  test('deposit smaller than the amount due: the rest stays due on the settlement invoice', () => {
    const allocation = allocate({ depositHeld: 100000 });

    assert.deepEqual(allocation.allocations, [
      { invoiceId: null, amount: 100000, remaining: 250000 },
    ]);
    assert.equal(allocation.depositRefunded, 0);
    assert.equal(allocation.remainingDue, 250000);
    assert.equal(allocation.tenantPays, 250000);
  });

  test('two unpaid periods: oldest first, payments land on the original invoices', () => {
    const allocation = allocate({ outstandingInvoices: OUTSTANDING, depositHeld: 7000000 });

    assert.deepEqual(allocation.allocations, [
      { invoiceId: 'inv-2026-09', amount: 3910000, remaining: 0 },
      { invoiceId: 'inv-2026-10', amount: 2000000, remaining: 0 },
      { invoiceId: null, amount: 350000, remaining: 0 },
    ]);
    assert.equal(allocation.depositApplied, 6260000);
    assert.equal(allocation.depositRefunded, 740000);
    assert.equal(allocation.ownerRefunds, 740000);
  });

  test('deposit runs out on the older invoices: later ones get 0 and keep their balance', () => {
    const allocation = allocate({ outstandingInvoices: OUTSTANDING });

    assert.deepEqual(allocation.allocations, [
      { invoiceId: 'inv-2026-09', amount: 3000000, remaining: 910000 },
      { invoiceId: 'inv-2026-10', amount: 0, remaining: 2000000 },
      { invoiceId: null, amount: 0, remaining: 350000 },
    ]);
    assert.equal(allocation.settlementDepositApplied, 0);
    assert.equal(allocation.remainingDue, 3260000);
    assert.equal(allocation.tenantPays, 3260000);
  });

  test('negative settlement total is a credit, never paid from the deposit', () => {
    const allocation = allocate({ settlementTotal: -1300000 });

    assert.deepEqual(allocation.allocations, []);
    assert.equal(allocation.depositApplied, 0);
    assert.equal(allocation.depositRefunded, 3000000);
    assert.equal(allocation.settlementCredit, 1300000);
    assert.equal(allocation.ownerRefunds, 4300000);
  });

  test('credit with older debt and no deposit: the net is what the tenant still owes', () => {
    const allocation = allocate({
      depositHeld: 0,
      settlementTotal: -500000,
      outstandingInvoices: [{ invoiceId: 'inv-x', remaining: 1000000 }],
    });

    assert.equal(allocation.remainingDue, 1000000);
    assert.equal(allocation.settlementCredit, 500000);
    assert.equal(allocation.tenantPays, 500000);
    assert.equal(allocation.ownerRefunds, 0);
  });

  test('zero total and no debt: the whole deposit is refunded', () => {
    const allocation = allocate({ settlementTotal: 0 });

    assert.deepEqual(allocation.allocations, []);
    assert.equal(allocation.depositRefunded, 3000000);
    assert.equal(allocation.ownerRefunds, 3000000);
  });

  test('net equals computeSettlement for refunds, debts and short deposits', () => {
    const base = {
      contract: { startDate: '2026-01-01' },
      moveOutDate: '2026-11-30',
      invoicedPeriods: ['2026-11'],
      charges: { rent: 3000000, occupantCount: 1, vehicleCount: 0 },
      utilities: [
        electricity([{ startReading: 1250, endReading: 1290 }]),
        water([{ startReading: 88, endReading: 91 }]),
      ],
      refundUnusedRent: false,
      surcharges: [],
    };

    for (const depositHeld of [0, 100000, 200000, 5000000, 9000000]) {
      for (const outstanding of [
        [],
        [{ invoiceId: 'inv-a', total: 3000000, paidTotal: 1000000 }],
      ]) {
        const settlement = computeSettlement({
          ...base,
          depositHeld,
          outstandingInvoices: outstanding,
        });
        const allocation = allocateSettlementDeposit({
          depositHeld,
          settlementTotal: settlement.total,
          outstandingInvoices: settlement.outstandingInvoices,
        });

        assertSameNet(allocation, settlement);
        assert.equal(allocation.depositApplied + allocation.depositRefunded, depositHeld);
      }
    }
  });

  test('invalid amounts are rejected', () => {
    assertBillingError(() => allocate({ depositHeld: -1 }), 'INVALID_AMOUNT');
    assertBillingError(() => allocate({ settlementTotal: 1.5 }), 'INVALID_AMOUNT');
    assertBillingError(
      () => allocate({ outstandingInvoices: [{ invoiceId: 'inv-x', remaining: 0 }] }),
      'INVALID_AMOUNT',
    );
    assertBillingError(
      () => allocate({ outstandingInvoices: [{ invoiceId: '', remaining: 10 }] }),
      'INVALID_OUTSTANDING_INVOICE',
    );
  });
});
