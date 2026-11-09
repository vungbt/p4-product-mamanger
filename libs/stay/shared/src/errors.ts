export type StayValueErrorCode =
  | 'INVALID_PERIOD'
  | 'INVALID_DATE'
  | 'INVALID_AMOUNT'
  | 'INVALID_ROUNDING_UNIT'
  | 'AMOUNT_OUT_OF_RANGE'
  | 'INVALID_INVOICE_CODE';

/** Thrown by the helpers in this package when a value is malformed. */
export class StayValueError extends Error {
  readonly code: StayValueErrorCode;
  readonly value: unknown;

  constructor(code: StayValueErrorCode, message: string, value?: unknown) {
    super(message);
    this.name = 'StayValueError';
    this.code = code;
    this.value = value;
  }
}
