import { formatCurrency } from '@itclabs/react-ui';
import {
  BILLING_DAY_END_OF_MONTH,
  BILLING_DAY_MAX_FIXED,
  billingDayOf,
  isoDateInTimeZone,
  nextPeriod,
  parseIsoDate,
  parsePeriod,
  periodOfIsoDate,
} from '@stay/shared';

/** Money as screens.md shows it: `3.910.000 ₫` (integer VND). */
export function formatVnd(amount: number): string {
  return formatCurrency(amount, 'VND', { locale: 'vi-VN', maximumFractionDigits: 0 });
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

export type BillingDays = { readingDay: number; issueDay: number; dueDay: number };

/**
 * Dates of the next billing period M (screens.md O-03 preview): meters are read in M−1 (the
 * current month), the invoice is issued and due in M.
 */
export function billingPreview(
  { readingDay, issueDay, dueDay }: BillingDays,
  today = todayIsoDate(),
) {
  const usage = parsePeriod(periodOfIsoDate(today));
  const { year, month } = parsePeriod(nextPeriod(periodOfIsoDate(today)));

  return {
    period: `${pad(month)}/${year}`,
    usageMonth: `${pad(usage.month)}/${usage.year}`,
    reading: `${pad(billingDayOf(readingDay, usage.year, usage.month))}/${pad(usage.month)}`,
    issue: `${pad(billingDayOf(issueDay, year, month))}/${pad(month)}`,
    due: `${pad(billingDayOf(dueDay, year, month))}/${pad(month)}`,
  };
}
