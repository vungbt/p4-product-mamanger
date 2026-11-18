import { periodOfIsoDate, previousPeriod } from '@stay/shared';
import { BillingError, withBillingErrors } from './errors.js';
import { finalizeInvoice, manualLines, rentLine, serviceLines, utilityLines } from './lines.js';
import { dayRatio } from './ratio.js';
import type { ComputedInvoice, MonthlyInvoiceInput, MoveInInvoiceInput } from './types.js';
import { requireDate, requirePeriod, requireRoundingUnit } from './validate.js';

/**
 * Monthly invoice of period M: rent of M + services of M (both prorated by the day ratio when
 * the contract starts/ends in M) + electricity/water consumed in M−1 + manual lines.
 * Older debt is never added.
 */
export function computeMonthlyInvoice(input: MonthlyInvoiceInput): ComputedInvoice {
  return withBillingErrors(() => {
    const period = requirePeriod(input.period, 'period');
    const roundingUnit = requireRoundingUnit(input.roundingUnit);
    const ratio = dayRatio(input.contract, period);

    if (ratio.numerator === 0) {
      throw new BillingError(
        'NO_OCCUPANCY_IN_PERIOD',
        `The contract has no day of stay in ${period}`,
        {
          period,
          startDate: input.contract.startDate,
          endDate: input.contract.endDate ?? null,
        },
      );
    }

    const lines = [
      rentLine(input.contract.rent, period, ratio),
      ...serviceLines(input.services ?? [], input, period, ratio),
      ...utilityLines(input.utilities ?? [], previousPeriod(period)),
      ...manualLines(input.manualLines ?? [], 'manualLines'),
    ];

    return finalizeInvoice('monthly', period, lines, roundingUnit);
  });
}

/**
 * Move-in invoice, issued when the contract is activated: rent and services from the start
 * date to the end of that month (or the contract end, if earlier), prorated. No utilities and
 * no deposit (the deposit is recorded in the deposit ledger).
 */
export function computeMoveInInvoice(input: MoveInInvoiceInput): ComputedInvoice {
  return withBillingErrors(() => {
    const startDate = requireDate(input.contract.startDate, 'contract.startDate');
    const period = periodOfIsoDate(startDate);
    const roundingUnit = requireRoundingUnit(input.roundingUnit);
    const ratio = dayRatio(input.contract, period);
    const lines = [
      rentLine(input.contract.rent, period, ratio),
      ...serviceLines(input.services ?? [], input, period, ratio),
      ...manualLines(input.manualLines ?? [], 'manualLines'),
    ];

    return finalizeInvoice('move_in', period, lines, roundingUnit);
  });
}
