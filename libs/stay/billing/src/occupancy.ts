import { compareIsoDates, type IsoDate } from '@stay/shared';
import { BillingError, withBillingErrors } from './errors.js';
import { requireDate } from './validate.js';

/** A `contract_occupants` / `contract_vehicles` row; `toDate` is inclusive, `null` = still on. */
export interface DatedRegistration {
  fromDate: IsoDate;
  toDate?: IsoDate | null;
}

/**
 * Number of registrations active on `on` (the issue date), used for `per_person` and
 * `per_vehicle` quantities. It is the count on that day, not the maximum over the month.
 */
export function countActiveOn(registrations: readonly DatedRegistration[], on: IsoDate): number {
  return withBillingErrors(() => {
    const day = requireDate(on, 'on');

    return registrations.filter((registration, index) => {
      const from = requireDate(registration.fromDate, `registrations[${index}].fromDate`);
      const to =
        registration.toDate == null
          ? null
          : requireDate(registration.toDate, `registrations[${index}].toDate`);

      if (to !== null && compareIsoDates(to, from) < 0) {
        throw new BillingError(
          'END_BEFORE_START',
          `registrations[${index}] ends before it starts`,
          {
            index,
            fromDate: from,
            toDate: to,
          },
        );
      }

      return compareIsoDates(from, day) <= 0 && (to === null || compareIsoDates(day, to) <= 0);
    }).length;
  });
}
