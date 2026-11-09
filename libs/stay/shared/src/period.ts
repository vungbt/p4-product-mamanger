import { StayValueError } from './errors.js';

/** Billing month in `YYYY-MM` form (stored as `CHAR(7)`). */
export type Period = string;

export interface PeriodParts {
  year: number;
  /** 1–12 */
  month: number;
}

const PERIOD_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isPeriod(value: unknown): value is Period {
  return typeof value === 'string' && PERIOD_PATTERN.test(value);
}

export function parsePeriod(period: Period): PeriodParts {
  const match = typeof period === 'string' ? PERIOD_PATTERN.exec(period) : null;

  if (!match) {
    throw new StayValueError('INVALID_PERIOD', `Invalid period "${String(period)}"`, period);
  }

  return { year: Number(match[1]), month: Number(match[2]) };
}

export function formatPeriod(year: number, month: number): Period {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new StayValueError('INVALID_PERIOD', `Invalid year ${year}`, year);
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new StayValueError('INVALID_PERIOD', `Invalid month ${month}`, month);
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Adds `months` (may be negative) to a period. */
export function addMonths(period: Period, months: number): Period {
  if (!Number.isInteger(months)) {
    throw new StayValueError('INVALID_PERIOD', `Invalid month offset ${months}`, months);
  }

  const { year, month } = parsePeriod(period);
  const index = year * 12 + (month - 1) + months;

  return formatPeriod(Math.floor(index / 12), (index % 12) + 1);
}

export function previousPeriod(period: Period): Period {
  return addMonths(period, -1);
}

export function nextPeriod(period: Period): Period {
  return addMonths(period, 1);
}

/** Negative, zero or positive like `Array.prototype.sort` comparators. */
export function comparePeriods(a: Period, b: Period): number {
  parsePeriod(a);
  parsePeriod(b);

  return a < b ? -1 : a > b ? 1 : 0;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Actual number of days in a calendar month (February 28/29). */
export function daysInMonth(year: number, month: number): number {
  formatPeriod(year, month);

  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function daysInPeriod(period: Period): number {
  const { year, month } = parsePeriod(period);

  return daysInMonth(year, month);
}
