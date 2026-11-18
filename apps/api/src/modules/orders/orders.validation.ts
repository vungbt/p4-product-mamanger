import {
  dateFilters,
  dateQueryRule,
  queryNumber,
  queryText,
  validate,
  validateListQuery,
} from '@p4/server-core';
import type { OrderListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';

export const validateCheckoutBody = (req: Request, res: Response, next: NextFunction) => {
  const value: unknown = req.body;
  if (value && typeof value === 'object' && 'quoteId' in value)
    return validate({ rules: { quoteId: 'required|regex:/^[a-fA-F0-9-]{36}$/' } })(req, res, next);
  return validate({
    rules: {
      items: 'required|array|min:1',
      'items.*.productId': 'required|string',
      'items.*.quantity': 'required|integer|min:1',
      addressId: 'string',
      'shippingAddress.fullName': 'string',
      'shippingAddress.phone': 'string',
      'shippingAddress.line1': 'string',
      'shippingAddress.city': 'string',
      shippingFee: 'integer|min:0',
      couponCode: 'string',
    },
  })(req, res, next);
};

export const validateShipmentUpdateBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      status: 'string',
      carrier: 'string',
      trackingCode: 'string',
    },
  })(req, res, next);

const sortFields: NonNullable<OrderListQuery['sortBy']>[] = [
  'id',
  'userEmail',
  'status',
  'total',
  'createdAt',
];
const statuses: NonNullable<OrderListQuery['status']>[] = [
  'pending',
  'paid',
  'shipping',
  'completed',
  'cancelled',
];
const paymentStatuses: NonNullable<OrderListQuery['paymentStatus']>[] = [
  'pending',
  'paid',
  'failed',
];
const shipmentStatuses: NonNullable<OrderListQuery['shipmentStatus']>[] = [
  'pending',
  'shipped',
  'delivered',
  'cancelled',
];

export const validateOrdersListQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  legacy: false,
  rules: (query) => ({
    status: `sometimes|required|in:${statuses.join(',')}`,
    paymentStatus: `sometimes|required|in:${paymentStatuses.join(',')}`,
    shipmentStatus: `sometimes|required|in:${shipmentStatuses.join(',')}`,
    createdFrom: dateQueryRule,
    createdTo: dateQueryRule,
    minTotal: 'sometimes|required|numeric|min:0|max:2147483647',
    maxTotal: `sometimes|required|numeric|min:${queryNumber(query, 'minTotal') ?? 0}|max:2147483647`,
  }),
  normalize: (query, base, req): OrderListQuery => ({
    ...base,
    status: statuses.find((value) => value === queryText(query, 'status')),
    paymentStatus: paymentStatuses.find((value) => value === queryText(query, 'paymentStatus')),
    shipmentStatus: shipmentStatuses.find((value) => value === queryText(query, 'shipmentStatus')),
    ...dateFilters(query, req.t),
    minTotal: queryNumber(query, 'minTotal'),
    maxTotal: queryNumber(query, 'maxTotal'),
  }),
});
