import {
  compareIsoDates,
  daysBetweenInclusive,
  daysInPeriod,
  firstDayOfPeriod,
  type IsoDate,
  lastDayOfPeriod,
  type Period,
} from '@stay/shared';
import { BillingError, withBillingErrors } from './errors.js';
import type { ContractTerm } from './types.js';
import { requireDate, requirePeriod } from './validate.js';

export interface DayRatio {
  /** Days of stay inside the period, counting both the first and the last day. */
  numerator: number;
  /** Actual number of days in the period's month. */
  denominator: number;
  /** First and last covered day; `null` when the term does not overlap the period. */
  coveredFrom: IsoDate | null;
  coveredTo: IsoDate | null;
}

/**
 * Day ratio of a stay inside period M: `days stayed in M / days in M`, inclusive of both the
 * start and end day (move-in on 20/11 → 11/30).
 */
export function dayRatio(term: ContractTerm, period: Period): DayRatio {
  return withBillingErrors(() => {
    const start = requireDate(term.startDate, 'startDate');
    const end = term.endDate == null ? null : requireDate(term.endDate, 'endDate');

    requirePeriod(period, 'period');

    if (end !== null && compareIsoDates(end, start) < 0) {
      throw new BillingError('END_BEFORE_START', 'endDate is before startDate', {
        startDate: start,
        endDate: end,
      });
    }

    const periodStart = firstDayOfPeriod(period);
    const periodEnd = lastDayOfPeriod(period);
    const from = compareIsoDates(start, periodStart) > 0 ? start : periodStart;
    const to = end !== null && compareIsoDates(end, periodEnd) < 0 ? end : periodEnd;
    const numerator = daysBetweenInclusive(from, to);

    return {
      numerator,
      denominator: daysInPeriod(period),
      coveredFrom: numerator > 0 ? from : null,
      coveredTo: numerator > 0 ? to : null,
    };
  });
}
