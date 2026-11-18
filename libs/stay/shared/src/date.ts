import { STAY_TIME_ZONE } from './constants.js';
import { StayValueError } from './errors.js';
import { daysInMonth, formatPeriod, type Period, parsePeriod } from './period.js';

/** Business date in `YYYY-MM-DD` form (stored as `DATE`), with no time or zone. */
export type IsoDate = string;

export interface IsoDateParts {
  year: number;
  month: number;
  day: number;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function matchDate(value: unknown): IsoDateParts | null {
  const match = typeof value === 'string' ? DATE_PATTERN.exec(value) : null;

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }

  return { year, month, day };
}

export function isIsoDate(value: unknown): value is IsoDate {
  return matchDate(value) !== null;
}

export function parseIsoDate(date: IsoDate): IsoDateParts {
  const parts = matchDate(date);

  if (!parts) {
    throw new StayValueError('INVALID_DATE', `Invalid date "${String(date)}"`, date);
  }

  return parts;
}

export function formatIsoDate(year: number, month: number, day: number): IsoDate {
  const value = `${formatPeriod(year, month)}-${String(day).padStart(2, '0')}`;

  parseIsoDate(value);

  return value;
}

/** Days since 1970-01-01 (calendar arithmetic, independent of time zones). */
export function toEpochDay(date: IsoDate): number {
  const { year, month, day } = parseIsoDate(date);

  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

export function fromEpochDay(epochDay: number): IsoDate {
  if (!Number.isSafeInteger(epochDay)) {
    throw new StayValueError('INVALID_DATE', `Invalid epoch day ${epochDay}`, epochDay);
  }

  const value = new Date(epochDay * MS_PER_DAY);

  return formatIsoDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromEpochDay(toEpochDay(date) + days);
}

export function compareIsoDates(a: IsoDate, b: IsoDate): number {
  return Math.sign(toEpochDay(a) - toEpochDay(b));
}

/** Number of days from `start` to `end`, counting both; 0 when `end` is before `start`. */
export function daysBetweenInclusive(start: IsoDate, end: IsoDate): number {
  return Math.max(0, toEpochDay(end) - toEpochDay(start) + 1);
}

export function periodOfIsoDate(date: IsoDate): Period {
  const { year, month } = parseIsoDate(date);

  return formatPeriod(year, month);
}

export function firstDayOfPeriod(period: Period): IsoDate {
  const { year, month } = parsePeriod(period);

  return formatIsoDate(year, month, 1);
}

export function lastDayOfPeriod(period: Period): IsoDate {
  const { year, month } = parsePeriod(period);

  return formatIsoDate(year, month, daysInMonth(year, month));
}

/** Calendar date of an instant in `timeZone` (default `Asia/Ho_Chi_Minh`). */
export function isoDateInTimeZone(instant: Date, timeZone: string = STAY_TIME_ZONE): IsoDate {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
    throw new StayValueError('INVALID_DATE', 'Invalid Date instance', instant);
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return formatIsoDate(read('year'), read('month'), read('day'));
}

/** Billing period an instant falls into, in `timeZone` (default `Asia/Ho_Chi_Minh`). */
export function periodOfDate(instant: Date, timeZone: string = STAY_TIME_ZONE): Period {
  return periodOfIsoDate(isoDateInTimeZone(instant, timeZone));
}
