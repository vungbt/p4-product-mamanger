import { compareIsoDates, type IsoDate, type Vnd } from '@stay/shared';
import { BillingError, withBillingErrors } from './errors.js';
import { requireDate, requireVnd } from './validate.js';

export interface PriceOverride {
  effectiveFrom: IsoDate;
  price: Vnd;
}

export interface ResolvePriceInput {
  /** System `default_price` of the service. */
  defaultPrice: Vnd;
  /** Building overrides (`building_service_prices`). */
  overrides?: readonly PriceOverride[];
  /** Usually the issue date of the invoice. */
  on: IsoDate;
}

export interface ResolvedPrice {
  price: Vnd;
  source: 'default' | 'override';
  effectiveFrom: IsoDate | null;
}

/** The override with the latest `effectiveFrom` ≤ `on`; otherwise the default price. */
export function resolvePrice(input: ResolvePriceInput): ResolvedPrice {
  return withBillingErrors(() => {
    const on = requireDate(input.on, 'on');

    if (input.defaultPrice === undefined || input.defaultPrice === null) {
      throw new BillingError('MISSING_DEFAULT_PRICE', 'defaultPrice is required');
    }

    const defaultPrice = requireVnd(input.defaultPrice, 'defaultPrice', { min: 0 });
    const seen = new Set<string>();
    let best: PriceOverride | null = null;

    for (const [index, override] of (input.overrides ?? []).entries()) {
      const effectiveFrom = requireDate(
        override.effectiveFrom,
        `overrides[${index}].effectiveFrom`,
      );

      requireVnd(override.price, `overrides[${index}].price`, { min: 0 });

      if (seen.has(effectiveFrom)) {
        throw new BillingError(
          'DUPLICATE_EFFECTIVE_FROM',
          `Two overrides share effectiveFrom ${effectiveFrom}`,
          { effectiveFrom },
        );
      }

      seen.add(effectiveFrom);

      const applies = compareIsoDates(effectiveFrom, on) <= 0;

      if (applies && (best === null || compareIsoDates(effectiveFrom, best.effectiveFrom) > 0)) {
        best = override;
      }
    }

    return best
      ? { price: best.price, source: 'override', effectiveFrom: best.effectiveFrom }
      : { price: defaultPrice, source: 'default', effectiveFrom: null };
  });
}
