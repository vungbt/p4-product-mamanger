import type { ServiceKind } from './constants.js';
import { daysInMonth } from './period.js';

/**
 * Day of month of a billing step: `1`–`28`, or `31` for "end of month" (clamped to the
 * month's last day by `billingDayOf`).
 */
export type BillingDay = number;

/** `BillingDay` value meaning "last day of the month". */
export const BILLING_DAY_END_OF_MONTH = 31;
export const BILLING_DAY_MAX_FIXED = 28;

/** Rounding units offered for invoice totals (VND). */
export const ROUNDING_UNITS = [1, 100, 1000] as const;
export type RoundingUnit = (typeof ROUNDING_UNITS)[number];

/** Maximum length of a service description. */
export const SERVICE_DESCRIPTION_MAX = 500;

/** Placeholder replaced by the invoice code in the bank transfer content. */
export const TRANSFER_CONTENT_INVOICE_CODE = '{invoiceCode}';

/**
 * Month the meter reading day falls in (rules.md "Lịch thu"): `same` = the consumption month
 * M−1 itself (e.g. the last day of November for November), `next` = the following month M, the
 * month the invoice is issued (e.g. 5 December for November).
 */
export const READING_DAY_MONTHS = ['same', 'next'] as const;
export type ReadingDayMonth = (typeof READING_DAY_MONTHS)[number];

/** Days after the due date before an invoice counts as overdue (`graceDays`), 0–31. */
export const GRACE_DAYS_MAX = 31;

/** System billing defaults (rules.md "Giá trị mặc định"); buildings may override each one. */
export const DEFAULT_BILLING_SETTINGS = {
  readingDay: BILLING_DAY_END_OF_MONTH,
  readingDayMonth: 'same',
  issueDay: 1,
  dueDay: 5,
  graceDays: 0,
  roundingUnit: 1000,
  refundUnusedRent: false,
  transferContentTemplate: TRANSFER_CONTENT_INVOICE_CODE,
} as const satisfies Omit<StaySettings, 'version'>;

export function isBillingDay(value: unknown): value is BillingDay {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    (value === BILLING_DAY_END_OF_MONTH || (value >= 1 && value <= BILLING_DAY_MAX_FIXED))
  );
}

export function isReadingDayMonth(value: unknown): value is ReadingDayMonth {
  return (READING_DAY_MONTHS as readonly unknown[]).includes(value);
}

export function isGraceDays(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= GRACE_DAYS_MAX
  );
}

export function isRoundingUnit(value: unknown): value is RoundingUnit {
  return (ROUNDING_UNITS as readonly unknown[]).includes(value);
}

/** Calendar day of `day` in a month (`31` → the month's last day). */
export function billingDayOf(day: BillingDay, year: number, month: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/** Billing cycle parameters (`GET /api/settings`, effective values of a building). */
export interface BillingSettings {
  /**
   * Meter reading day closing consumption month M−1: a day of M−1 (`readingDayMonth: 'same'`)
   * or of M (`'next'`, then on or before `issueDay`).
   */
  readingDay: BillingDay;
  /** Month of `readingDay`: the consumption month (`same`) or the month after it (`next`). */
  readingDayMonth: ReadingDayMonth;
  /** Issue day of the invoice of month M. */
  issueDay: BillingDay;
  /** Payment due day of month M (on or after `issueDay`), printed as "Hạn thanh toán". */
  dueDay: BillingDay;
  /** Days after `dueOn` before an unpaid invoice counts as overdue (0 = the day after `dueOn`). */
  graceDays: number;
  roundingUnit: RoundingUnit;
  /** Refund prepaid rent/services of unused days on early move-out. */
  refundUnusedRent: boolean;
}

/** `GET /api/settings`: system billing defaults (`system_settings` key `billing`). */
export interface StaySettings extends BillingSettings {
  /** Bank transfer content; `{invoiceCode}` is replaced by the invoice code. */
  transferContentTemplate: string;
  /** Optimistic lock: send it back with `PUT /api/settings`. */
  version: number;
}

/** `GET /api/services`: a service of the system catalogue (`service_definitions`). */
export interface StayService {
  id: string;
  /** Stable machine code (`electricity`, `internet`…), generated from the name when created. */
  code: string;
  name: string;
  /** Optional note shown under the name (e.g. "Thang máy, máy giặt, rác"), at most 500 characters. */
  description: string | null;
  /** How the service is billed; immutable after creation. */
  kind: ServiceKind;
  unit: string;
  /** Integer VND; buildings may override it from a date. */
  defaultPrice: number;
  active: boolean;
  sortOrder: number;
  version: number;
}
