import type { CouponInput } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as couponsService from './coupons.service.js';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.jsonApi(StatusCodes.OK, { data: await couponsService.listCoupons() });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await couponsService.createCoupon(req.body as CouponInput);
    return res.jsonApi(StatusCodes.CREATED, { data, message: 'message:coupon_created' });
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await couponsService.updateCoupon(
      String(req.params.id),
      req.body as Partial<CouponInput>,
    );
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:coupon_updated' });
  } catch (error) {
    return next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await couponsService.deleteCoupon(String(req.params.id));
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:coupon_deleted' });
  } catch (error) {
    return next(error);
  }
}

export async function preview(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, subtotal } = req.body as { code: string; subtotal: number };
    const data = await couponsService.previewCoupon(code, Number(subtotal));
    return res.jsonApi(StatusCodes.OK, { data });
  } catch (error) {
    return next(error);
  }
}
