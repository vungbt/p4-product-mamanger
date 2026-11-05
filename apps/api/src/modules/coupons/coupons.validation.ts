import type { CouponListQuery } from '@p4/shared';
import { queryText, validateListQuery } from '@/shared/list-query.js';
import validate from '@/shared/validation.js';

export const validateCoupon = validate({
  rules: {
    code: 'required|string',
    type: 'required|string',
    value: 'required|integer|min:1',
    minOrderAmount: 'integer|min:0',
    maxDiscount: 'integer|min:0',
    usageLimit: 'integer|min:1',
    isActive: 'boolean',
  },
});

export const validatePreview = validate({
  rules: {
    code: 'required|string',
    subtotal: 'required|integer|min:0',
  },
});

const sortFields: NonNullable<CouponListQuery['sortBy']>[] = [
  'code',
  'type',
  'value',
  'usedCount',
  'startsAt',
  'endsAt',
  'createdAt',
];
const types: NonNullable<CouponListQuery['type']>[] = ['percent', 'fixed'];

export const validateCouponsListQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  legacy: true,
  rules: () => ({
    type: `sometimes|required|in:${types.join(',')}`,
    isActive: 'sometimes|required|in:true,false',
  }),
  normalize: (query, base): CouponListQuery => ({
    ...base,
    type: types.find((value) => value === queryText(query, 'type')),
    isActive:
      queryText(query, 'isActive') === undefined
        ? undefined
        : queryText(query, 'isActive') === 'true',
  }),
});
