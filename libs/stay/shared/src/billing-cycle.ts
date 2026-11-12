import {
  addDays,
  compareIsoDates,
  firstDayOfPeriod,
  formatIsoDate,
  type IsoDate,
  lastDayOfPeriod,
  periodOfIsoDate,
  toEpochDay,
} from './date.js';
import { addMonths, nextPeriod, type Period, parsePeriod, previousPeriod } from './period.js';
import { type BillingSettings, billingDayOf, isGraceDays } from './settings.js';

/**
 * Billing calendar of a building (rules.md "Lịch thu"): one helper per date so the API (SQL
 * and services), the worker and the web compute the same days.
 */
export type BillingCycle = Pick<
  BillingSettings,
  'readingDay' | 'readingDayMonth' | 'issueDay' | 'dueDay' | 'graceDays'
>;

type ReadingCycle = Pick<BillingSettings, 'readingDay' | 'readingDayMonth'>;

/** Tenant reminder after the due date when there is no grace period (ST-26). */
export const AFTER_DUE_REMINDER_DAYS = 3;

/** Day `day` (1–28, 31 = end of month) of `period`. */
export function cycleDate(period: Period, day: number): IsoDate {
  const { year, month } = parsePeriod(period);

  return formatIsoDate(year, month, billingDayOf(day, year, month));
}

/**
 * Reading date that closes consumption month `consumption`: its own `readingDay` (`same`), or
 * the `readingDay` of the following month (`next`, e.g. 05/12 closes November).
 */
export function readingDateOf(consumption: Period, cycle: ReadingCycle): IsoDate {
  return cycleDate(
    cycle.readingDayMonth === 'next' ? nextPeriod(consumption) : consumption,
    cycle.readingDay,
  );
}

/** Dates a reading of consumption month P may carry (both ends included). */
export interface ReadingWindow {
  from: IsoDate;
  to: IsoDate;
}

/**
 * `same`: the consumption month itself. `next`: from the 1st of P through the reading day of
 * P+1, so 05/12 is accepted for November.
 */
export function readingWindow(consumption: Period, cycle: ReadingCycle): ReadingWindow {
  return {
    from: firstDayOfPeriod(consumption),
    to:
      cycle.readingDayMonth === 'next'
        ? readingDateOf(consumption, cycle)
        : lastDayOfPeriod(consumption),
  };
}

export function isInReadingWindow(readOn: IsoDate, window: ReadingWindow): boolean {
  return compareIsoDates(readOn, window.from) >= 0 && compareIsoDates(readOn, window.to) <= 0;
}

/**
 * Consumption month the readings screen opens on `today`: the current month (`same`); in `next`
 * mode the previous month until its reading day has passed (03/12 and 05/12 → November).
 */
export function defaultReadingPeriod(today: IsoDate, cycle: ReadingCycle): Period {
  const current = periodOfIsoDate(today);

  if (cycle.readingDayMonth !== 'next') return current;

  const previous = previousPeriod(current);

  return compareIsoDates(today, readingDateOf(previous, cycle)) <= 0 ? previous : current;
}

/**
 * Default "read on" date of a new reading: the window's last day (`same`: the month's last
 * day); in `next` mode today while it is inside the window.
 */
export function defaultReadOn(consumption: Period, cycle: ReadingCycle, today: IsoDate): IsoDate {
  const window = readingWindow(consumption, cycle);

  return cycle.readingDayMonth === 'next' && isInReadingWindow(today, window) ? today : window.to;
}

/** First day an unpaid invoice counts as overdue: `dueOn + graceDays + 1`. */
export function overdueFrom(dueOn: IsoDate, graceDays: number): IsoDate {
  return addDays(dueOn, graceDays + 1);
}

/**
 * Whole days `today` is past the grace period (`dueOn + graceDays`); 0 until then. With no
 * grace this is the number of days past `dueOn`. Mirrored by `invoiceOverdueDaysSql`.
 */
export function invoiceOverdueDays(dueOn: IsoDate, today: IsoDate, graceDays: number): number {
  return Math.max(0, toEpochDay(today) - toEpochDay(dueOn) - graceDays);
}

/**
 * SQL of `invoiceOverdueDays` for Postgres: arguments are SQL expressions (columns or
 * placeholders) for a `date`, an integer number of days and today's `date`.
 */
export function invoiceOverdueDaysSql(dueOn: string, graceDays: string, today: string): string {
  return `GREATEST(CAST(${today} AS date) - (${dueOn} + CAST(${graceDays} AS integer)), 0)`;
}

/** Tenant "quá hạn" reminder: the first overdue day with a grace period, else `dueOn + 3`. */
export function afterDueReminderOn(dueOn: IsoDate, graceDays: number): IsoDate {
  return graceDays > 0 ? overdueFrom(dueOn, graceDays) : addDays(dueOn, AFTER_DUE_REMINDER_DAYS);
}

/** Dates of invoice period M: reading that closes M−1, issue, due and first overdue day. */
export interface InvoiceCalendar {
  period: Period;
  /** Consumption month billed for electricity and water (M−1). */
  consumptionPeriod: Period;
  readingOn: IsoDate;
  issueOn: IsoDate;
  dueOn: IsoDate;
  overdueFrom: IsoDate;
}

export function invoiceCalendar(period: Period, cycle: BillingCycle): InvoiceCalendar {
  const consumptionPeriod = addMonths(period, -1);
  const dueOn = cycleDate(period, cycle.dueDay);

  return {
    period,
    consumptionPeriod,
    readingOn: readingDateOf(consumptionPeriod, cycle),
    issueOn: cycleDate(period, cycle.issueDay),
    dueOn,
    overdueFrom: overdueFrom(dueOn, cycle.graceDays),
  };
}

export type BillingCycleError = 'reading_after_issue' | 'due_before_issue' | 'grace_days_range';

/**
 * Cross-field rules of a cycle (API `error:` keys): due day on or after the issue day; in `next`
 * mode the reading day on or before the issue day; `graceDays` an integer 0–31.
 */
export function billingCycleErrors(
  cycle: BillingCycle,
): Partial<Record<'readingDay' | 'dueDay' | 'graceDays', BillingCycleError>> {
  const errors: Partial<Record<'readingDay' | 'dueDay' | 'graceDays', BillingCycleError>> = {};

  if (cycle.dueDay < cycle.issueDay) errors.dueDay = 'due_before_issue';
  if (cycle.readingDayMonth === 'next' && cycle.readingDay > cycle.issueDay)
    errors.readingDay = 'reading_after_issue';
  if (!isGraceDays(cycle.graceDays)) errors.graceDays = 'grace_days_range';
  return errors;
}
