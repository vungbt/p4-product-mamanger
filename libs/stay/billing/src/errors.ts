import { StayValueError, type StayValueErrorCode } from '@stay/shared';

export type BillingErrorCode =
  | StayValueErrorCode
  | 'END_BEFORE_START'
  | 'NO_OCCUPANCY_IN_PERIOD'
  | 'NO_METER_SEGMENTS'
  | 'MISSING_READING'
  | 'INVALID_READING'
  | 'NEGATIVE_CONSUMPTION'
  | 'INVALID_QUANTITY'
  | 'INVALID_SERVICE_KIND'
  | 'INVALID_MANUAL_LINE'
  | 'MISSING_REASON'
  | 'MISSING_REFERENCE'
  | 'MISSING_DEFAULT_PRICE'
  | 'DUPLICATE_EFFECTIVE_FROM'
  | 'MOVE_OUT_BEFORE_START'
  | 'INVALID_SETTING'
  | 'MISSING_PREPAID_LINES'
  | 'MISSING_INVOICED_PERIODS'
  | 'MISSING_CHARGES'
  | 'INVALID_PREPAID_LINE'
  | 'INVALID_OUTSTANDING_INVOICE';

export type BillingErrorDetails = Readonly<Record<string, unknown>>;

/** Every validation failure of `@stay/billing`. Inputs are never clamped or guessed. */
export class BillingError extends Error {
  readonly code: BillingErrorCode;
  readonly details: BillingErrorDetails;

  constructor(code: BillingErrorCode, message: string, details: BillingErrorDetails = {}) {
    super(message);
    this.name = 'BillingError';
    this.code = code;
    this.details = details;
  }
}

export function isBillingError(error: unknown): error is BillingError {
  return error instanceof BillingError;
}

/** Runs `compute`, converting `StayValueError`s from `@stay/shared` into `BillingError`s. */
export function withBillingErrors<T>(compute: () => T): T {
  try {
    return compute();
  } catch (error) {
    if (error instanceof StayValueError) {
      throw new BillingError(error.code, error.message, { value: error.value });
    }

    throw error;
  }
}
