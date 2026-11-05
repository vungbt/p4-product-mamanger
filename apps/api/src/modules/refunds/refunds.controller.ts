import type { RefundListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { ListLocals } from '@/shared/list-query.js';
import * as refundsService from './refunds.service.js';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await refundsService.createRefund(String(req.params.id), req.body ?? {});
    return res.jsonApi(StatusCodes.CREATED, { data, message: 'message:refund_created' });
  } catch (error) {
    return next(error);
  }
}

export async function list(
  req: Request,
  res: Response<unknown, ListLocals<RefundListQuery | undefined>>,
  next: NextFunction,
) {
  try {
    const orderId = typeof req.query.orderId === 'string' ? req.query.orderId.trim() : undefined;
    return res.jsonApi(
      StatusCodes.OK,
      await refundsService.listRefunds(orderId, res.locals.listQuery),
    );
  } catch (error) {
    return next(error);
  }
}
