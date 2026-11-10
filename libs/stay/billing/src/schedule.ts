import {
  compareIsoDates,
  daysInPeriod,
  formatIsoDate,
  type InvoiceKind,
  type IsoDate,
  type Period,
  parsePeriod,
  periodOfIsoDate,
} from '@stay/shared';
import { BillingError, withBillingErrors } from './errors.js';
import { requireDate, requirePeriod } from './validate.js';

/**
 * Day `day` of `period`. Billing days are `1`–`28` or `31`; a day past the end of the month
 * (31 = "end of month") falls on its last day.
 */
export function billingDate(period: Period, day: number): IsoDate {
  return withBillingErrors(() => {
    const { year, month } = parsePeriod(requirePeriod(period, 'period'));

    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new BillingError('INVALID_SETTING', 'Billing day must be an integer from 1 to 31', {
        field: 'day',
        value: day,
      });
    }

    return formatIsoDate(year, month, Math.min(day, daysInPeriod(period)));
  });
}

export interface InvoiceSchedule {
  issuedOn: IsoDate;
  dueOn: IsoDate;
}

/**
 * Issue and due dates of an invoice. A monthly invoice of period M is issued on the building's
 * issue day of M and due on its due day of M. Move-in and settlement invoices are issued on the
 * day they are issued (`today`) and due that day, or on the contract start/move-out date
 * (`eventDate`) when it is later.
 */
export function invoiceSchedule(input: {
  kind: InvoiceKind;
  period: Period;
  issueDay: number;
  dueDay: number;
  today: IsoDate;
  eventDate?: IsoDate | null;
}): InvoiceSchedule {
  return withBillingErrors(() => {
    const today = requireDate(input.today, 'today');

    if (input.kind === 'monthly') {
      return {
        issuedOn: billingDate(input.period, input.issueDay),
        dueOn: billingDate(input.period, input.dueDay),
      };
    }

    const eventDate = input.eventDate ? requireDate(input.eventDate, 'eventDate') : today;

    return { issuedOn: today, dueOn: compareIsoDates(eventDate, today) > 0 ? eventDate : today };
  });
}

/**
 * Period whose sequence numbers an invoice code uses (rules.md "Mã hoá đơn"): the billing period
 * for monthly invoices; the period of the issue date for move-in and settlement invoices.
 */
export function invoiceCodePeriod(kind: InvoiceKind, period: Period, issuedOn: IsoDate): Period {
  return withBillingErrors(() =>
    kind === 'monthly'
      ? requirePeriod(period, 'period')
      : periodOfIsoDate(requireDate(issuedOn, 'issuedOn')),
  );
}
