import type { Request } from 'express';
import { requestBody } from '@/shared/http-input.js';

export function ruleInput(req: Request) {
  const body = requestBody(req);
  const type = body.enum('type', ['percent', 'fixed']);
  const value = body.integer('value', 1, type === 'percent' ? 100 : 2_147_483_647);
  const date = (field: string) => {
    if (body.data[field] === undefined || body.data[field] === null) return null;
    const value = body.text(field, 30);
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value) ||
      Number.isNaN(Date.parse(value))
    )
      return body.invalid(field);
    return new Date(value);
  };
  const startsAt = date('startsAt');
  const endsAt = date('endsAt');
  if (startsAt && endsAt && endsAt <= startsAt) return body.invalid('endsAt');
  const ids = (field: string) => {
    const values = body.data[field] === undefined ? [] : body.strings(field, 100, 36);
    if (
      values.some(
        (value) => !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value),
      )
    )
      return body.invalid(field);
    return [...new Set(values)];
  };
  return {
    type,
    value,
    startsAt,
    endsAt,
    variantIds: ids('variantIds'),
    categoryIds: ids('categoryIds'),
    minOrderAmount: body.data.minOrderAmount === undefined ? 0 : body.integer('minOrderAmount'),
    maxDiscount:
      body.data.maxDiscount === undefined || body.data.maxDiscount === null
        ? null
        : body.integer('maxDiscount'),
    isActive: body.data.isActive === undefined ? true : body.boolean('isActive'),
  };
}
