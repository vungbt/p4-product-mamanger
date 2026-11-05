import type { RefundListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import type { ListLocals } from '@/shared/list-query.js';
import { requestRefund } from './refund-processing.service.js';
import * as refundsService from './refunds.service.js';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = requestBody(req);
    const data = await requestRefund(
      currentUser(req).id,
      uuidRouteId(req),
      req.header('Idempotency-Key') ?? '',
      {
        amount: body.data.amount === undefined ? undefined : body.integer('amount', 1),
        returnId: body.optionalText('returnId', 36),
        reason: body.text('reason', 1000),
      },
    );
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
