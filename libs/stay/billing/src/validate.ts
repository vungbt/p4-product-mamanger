import {
  DEFAULT_ROUNDING_UNIT,
  type IsoDate,
  isIsoDate,
  isPeriod,
  isVnd,
  type Period,
  type Vnd,
} from '@stay/shared';
import { BillingError } from './errors.js';

export function requireDate(value: unknown, field: string): IsoDate {
  if (!isIsoDate(value)) {
    throw new BillingError('INVALID_DATE', `${field} must be a valid YYYY-MM-DD date`, {
      field,
      value,
    });
  }

  return value;
}

export function requirePeriod(value: unknown, field: string): Period {
  if (!isPeriod(value)) {
    throw new BillingError('INVALID_PERIOD', `${field} must be a YYYY-MM period`, {
      field,
      value,
    });
  }

  return value;
}

export function requireVnd(value: unknown, field: string, options: { min?: number } = {}): Vnd {
  if (!isVnd(value) || (options.min !== undefined && value < options.min)) {
    throw new BillingError(
      'INVALID_AMOUNT',
      `${field} must be an integer VND amount${options.min !== undefined ? ` ≥ ${options.min}` : ''}`,
      { field, value },
    );
  }

  return value;
}

export function requireCount(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new BillingError('INVALID_QUANTITY', `${field} must be a non-negative integer`, {
      field,
      value,
    });
  }

  return value as number;
}

export function requireRoundingUnit(value: unknown): Vnd {
  if (value === undefined) {
    return DEFAULT_ROUNDING_UNIT;
  }

  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new BillingError('INVALID_ROUNDING_UNIT', 'roundingUnit must be a positive integer', {
      value,
    });
  }

  return value as number;
}
