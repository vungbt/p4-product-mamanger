import { InputValidError } from '@p4/server-core';
import type { CartLineInput } from '@p4/shared';

export function cartLines(value: unknown): CartLineInput[] {
  const invalid = (): never => {
    throw new InputValidError('input_valid_error', {
      items: ['Expected 1–100 unique SKU lines with quantities 1–99.'],
    });
  };
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) return invalid();
  const lines = value.map((raw: unknown): CartLineInput => {
    if (
      !raw ||
      typeof raw !== 'object' ||
      Array.isArray(raw) ||
      !('variantId' in raw) ||
      !('quantity' in raw)
    )
      return invalid();
    const { variantId, quantity } = raw;
    if (
      typeof variantId !== 'string' ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(variantId) ||
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    )
      return invalid();
    return { variantId, quantity };
  });
  if (new Set(lines.map((line) => line.variantId)).size !== lines.length) return invalid();
  return lines;
}

export function orderQuantities(value: unknown): import('@p4/shared').OrderQuantityInput[] {
  if (!Array.isArray(value)) throw new InputValidError('input_valid_error');
  const mapped = value.map((item: unknown) => {
    if (!item || typeof item !== 'object' || !('orderItemId' in item) || !('quantity' in item))
      throw new InputValidError('input_valid_error');
    return { variantId: item.orderItemId, quantity: item.quantity };
  });
  return cartLines(mapped).map((line) => ({
    orderItemId: line.variantId,
    quantity: line.quantity,
  }));
}
