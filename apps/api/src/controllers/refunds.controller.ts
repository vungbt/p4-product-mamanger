import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as refundsService from '@/services/refunds.service.js';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await refundsService.createRefund(String(req.params.id), req.body ?? {});
    return res.jsonApi(StatusCodes.CREATED, { data, message: 'message:refund_created' });
  } catch (error) {
    return next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
    return res.jsonApi(StatusCodes.OK, { data: await refundsService.listRefunds(orderId) });
  } catch (error) {
    return next(error);
  }
}
