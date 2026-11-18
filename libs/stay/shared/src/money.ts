import { StayValueError } from './errors.js';

/** Integer amount of VND (stored as `BIGINT`). Never a float. */
export type Vnd = number;

export function isVnd(value: unknown): value is Vnd {
  return Number.isSafeInteger(value);
}

export function assertVnd(value: unknown, label = 'amount'): asserts value is Vnd {
  if (!isVnd(value)) {
    throw new StayValueError('INVALID_AMOUNT', `${label} must be an integer VND amount`, value);
  }
}

function toSafeNumber(value: bigint): Vnd {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new StayValueError('AMOUNT_OUT_OF_RANGE', 'Amount exceeds the safe integer range', value);
  }

  return Number(value);
}

function toBigInt(value: number | bigint, label: string): bigint {
  if (typeof value === 'bigint') {
    return value;
  }

  if (!Number.isSafeInteger(value)) {
    throw new StayValueError('INVALID_AMOUNT', `${label} must be a safe integer`, value);
  }

  return BigInt(value);
}

/**
 * Exact `numerator / denominator` rounded half-up, where "up" means away from zero
 * (`2.5 → 3`, `-2.5 → -3`), so a negative line mirrors its positive counterpart.
 */
export function divideRoundHalfUp(numerator: number | bigint, denominator: number | bigint): Vnd {
  const n = toBigInt(numerator, 'numerator');
  const d = toBigInt(denominator, 'denominator');

  if (d <= 0n) {
    throw new StayValueError('INVALID_AMOUNT', 'denominator must be positive', denominator);
  }

  const negative = n < 0n;
  const absolute = negative ? -n : n;
  let quotient = absolute / d;

  if ((absolute % d) * 2n >= d) {
    quotient += 1n;
  }

  return toSafeNumber(negative ? -quotient : quotient);
}

/** `factors[0] × factors[1] × … / denominator`, exact, rounded half-up to whole VND. */
export function multiplyDivideRoundHalfUp(
  factors: readonly (number | bigint)[],
  denominator: number | bigint = 1,
): Vnd {
  const product = factors.reduce<bigint>(
    (total, factor, index) => total * toBigInt(factor, `factor ${index}`),
    1n,
  );

  return divideRoundHalfUp(product, denominator);
}

export function assertRoundingUnit(unit: unknown): asserts unit is Vnd {
  if (!Number.isSafeInteger(unit) || (unit as number) <= 0) {
    throw new StayValueError(
      'INVALID_ROUNDING_UNIT',
      'roundingUnit must be a positive integer',
      unit,
    );
  }
}

/** Rounds an integer amount to a multiple of `unit`, half-up (away from zero). */
export function roundToUnit(amount: Vnd, unit: Vnd): Vnd {
  assertVnd(amount);
  assertRoundingUnit(unit);

  return divideRoundHalfUp(amount, unit) * unit;
}

/** Sums integer VND amounts exactly; throws if a value or the result is not a safe integer. */
export function sumVnd(amounts: readonly Vnd[]): Vnd {
  let total = 0n;

  for (const [index, amount] of amounts.entries()) {
    assertVnd(amount, `amounts[${index}]`);
    total += BigInt(amount);
  }

  return toSafeNumber(total);
}
