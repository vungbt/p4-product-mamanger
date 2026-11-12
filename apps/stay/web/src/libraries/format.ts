import { formatCurrency } from '@itclabs/react-ui';
import {
  BILLING_DAY_END_OF_MONTH,
  BILLING_DAY_MAX_FIXED,
  type BillingCycle,
  invoiceCalendar,
  isoDateInTimeZone,
  nextPeriod,
  parseIsoDate,
  periodOfIsoDate,
} from '@stay/shared';

/** Money as screens.md shows it: `3.910.000 ₫` (integer VND). */
export function formatVnd(amount: number): string {
  return formatCurrency(amount, 'VND', { locale: 'vi-VN', maximumFractionDigits: 0 });
}

const compactNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

const COMPACT_UNITS = [
  { size: 1_000_000_000, unit: 'tỷ' },
  { size: 1_000_000, unit: 'tr' },
  { size: 1_000, unit: 'N' },
] as const;

/** Chart axis ticks: `1,2 tỷ`, `40 tr`, `500 N` (nghìn), `0`; tooltips keep `formatVnd`. */
export function formatVndCompact(amount: number): string {
  const unit = COMPACT_UNITS.find(({ size }) => Math.abs(amount) >= size);

  return unit
    ? `${compactNumber.format(amount / unit.size)} ${unit.unit}`
    : compactNumber.format(amount);
}

const pad = (value: number) => String(value).padStart(2, '0');

/** `YYYY-MM-DD` → `dd/MM/yyyy`. */
export function displayDate(date: string): string {
  const { year, month, day } = parseIsoDate(date);

  return `${pad(day)}/${pad(month)}/${year}`;
}

/** Today in Asia/Ho_Chi_Minh as `YYYY-MM-DD` (business dates, price effective dates). */
export function todayIsoDate(): string {
  return isoDateInTimeZone(new Date());
}

/** Billing day choices: 1–28 and 31 meaning "end of month" (`BillingDay`). */
export const BILLING_DAYS: readonly number[] = [
  ...Array.from({ length: BILLING_DAY_MAX_FIXED }, (_, index) => index + 1),
  BILLING_DAY_END_OF_MONTH,
];

export type BillingDays = Pick<
  BillingCycle,
  'readingDay' | 'readingDayMonth' | 'issueDay' | 'dueDay' | 'graceDays'
>;

/** `YYYY-MM-DD` → `dd/MM`. */
const dayMonth = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

/**
 * Dates of the next billing period M (screens.md O-03 preview), from the shared billing
 * calendar: the reading that closes consumption month M−1, issue, due and first overdue day.
 */
export function billingPreview(cycle: BillingDays, today = todayIsoDate()) {
  const calendar = invoiceCalendar(nextPeriod(periodOfIsoDate(today)), cycle);

  return {
    period: calendar.period.slice(5),
    usageMonth: calendar.consumptionPeriod.slice(5),
    reading: dayMonth(calendar.readingOn),
    issue: dayMonth(calendar.issueOn),
    due: dayMonth(calendar.dueOn),
    overdue: dayMonth(calendar.overdueFrom),
  };
}
