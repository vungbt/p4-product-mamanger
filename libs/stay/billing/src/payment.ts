import type { Vnd } from '@stay/shared';
import { BillingError, withBillingErrors } from './errors.js';
import { requireVnd } from './validate.js';

export type IssuedInvoiceStatus = 'issued' | 'partially_paid' | 'paid';

/**
 * Status of an issued invoice, always recomputed from the sum of non-reversed payments
 * (rules.md "Hoá đơn"): nothing paid → `issued`, part → `partially_paid`, all → `paid`.
 */
export function invoicePaymentStatus(total: Vnd, paidTotal: Vnd): IssuedInvoiceStatus {
  return withBillingErrors(() => {
    const amount = requireVnd(total, 'total');
    const paid = requireVnd(paidTotal, 'paidTotal', { min: 0 });

    if (paid > Math.max(amount, 0)) {
      throw new BillingError('INVALID_AMOUNT', 'paidTotal exceeds the invoice total', {
        total: amount,
        paidTotal: paid,
      });
    }

    if (paid === 0) return amount <= 0 ? 'paid' : 'issued';

    return paid === amount ? 'paid' : 'partially_paid';
  });
}
