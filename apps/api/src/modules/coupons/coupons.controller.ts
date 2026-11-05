import type { CouponInput, CouponListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { cartLines } from '@/shared/commerce/input.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import type { ListLocals } from '@/shared/list-query.js';
import { priceLines } from '../checkout/checkout.service.js';
import { calculateDiscount } from '../promotions/promotions.service.js';
import { ruleInput } from '../promotions/promotions.validation.js';
import * as couponsService from './coupons.service.js';

function couponInput(req: Request): CouponInput {
  const body = requestBody(req);
  const input = ruleInput(req);
  return {
    ...input,
    startsAt: input.startsAt?.toISOString() ?? null,
    endsAt: input.endsAt?.toISOString() ?? null,
    code: body.text('code', 80),
    usageLimit:
      body.data.usageLimit === undefined || body.data.usageLimit === null
        ? null
        : body.integer('usageLimit', 1),
    perUserLimit:
      body.data.perUserLimit === undefined || body.data.perUserLimit === null
        ? null
        : body.integer('perUserLimit', 1),
    expectedVersion:
      body.data.expectedVersion === undefined ? undefined : body.integer('expectedVersion', 1),
  };
}

export async function list(
  _req: Request,
  res: Response<unknown, ListLocals<CouponListQuery | undefined>>,
  next: NextFunction,
) {
  try {
    return res.jsonApi(StatusCodes.OK, await couponsService.listCoupons(res.locals.listQuery));
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await couponsService.createCoupon(couponInput(req));
    return res.jsonApi(StatusCodes.CREATED, { data, message: 'message:coupon_created' });
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await couponsService.updateCoupon(uuidRouteId(req), couponInput(req));
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:coupon_updated' });
  } catch (error) {
    return next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await couponsService.deleteCoupon(uuidRouteId(req));
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:coupon_deleted' });
  } catch (error) {
    return next(error);
  }
}

export async function preview(req: Request, res: Response, next: NextFunction) {
  try {
    const body = requestBody(req);
    const lines = await priceLines(cartLines(body.data.items));
    const discount = await calculateDiscount(currentUser(req).id, lines, body.text('code', 80));
    const data = {
      discountAmount: discount.amount,
      allocations: discount.allocations,
      couponId: discount.couponId,
      code: discount.code,
    };
    return res.jsonApi(StatusCodes.OK, { data });
  } catch (error) {
    return next(error);
  }
}
