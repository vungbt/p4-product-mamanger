import { isIsoDate, isoDateInTimeZone } from '@stay/shared';
import type { FormBody } from '@/shared/input.js';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readExpenseInput(body: FormBody) {
  const buildingId = body.text('buildingId', 36);
  const categoryId = body.text('categoryId', 36);
  const roomId = body.optionalText('roomId', 36) || null;
  const receiptFileId = body.optionalText('receiptFileId', 36) || null;
  const amount = body.integer('amount', 1, Number.MAX_SAFE_INTEGER);
  const rawDate = body.text('spentOn', 40);
  let spentOn = rawDate;

  // Calendar dates are already Vietnamese business dates. Instants need an explicit offset.
  if (
    rawDate.length > 10 &&
    isIsoDate(rawDate.slice(0, 10)) &&
    /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(rawDate) &&
    Number.isFinite(Date.parse(rawDate))
  )
    spentOn = isoDateInTimeZone(new Date(rawDate));
  body.check('spentOn', isIsoDate(spentOn));
  for (const [field, value] of Object.entries({ buildingId, categoryId, roomId, receiptFileId }))
    if (value) body.check(field, UUID_PATTERN.test(value));
  const note = body.optionalText('note', 2000) || null;

  body.assertValid();
  return { buildingId, categoryId, roomId, receiptFileId, amount, spentOn, note };
}

export function readCategoryInput(body: FormBody) {
  const name = body.text('name', 120);
  const active = body.isEmpty('active') ? true : body.boolean('active');

  body.assertValid();
  return { name, active };
}
