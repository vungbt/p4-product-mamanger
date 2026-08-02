import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as ordersService from '@/services/orders.service.js';
import { Forbidden } from '@/utils/errors/index.js';

function readSecret(req: Request) {
  if (typeof req.query.secret === 'string' && req.query.secret) return req.query.secret;
  if (typeof req.body?.secret === 'string' && req.body.secret) return req.body.secret;
  return '';
}

/** Simulate payment redirect: GET|POST /api/payments/:id/mock-pay?secret=... */
export async function mockPay(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = readSecret(req);
    if (!secret) throw new Forbidden();
    const order = await ordersService.confirmMockPayment(String(req.params.id), secret);
    return res.jsonApi(StatusCodes.OK, { data: order, message: 'message:payment_paid' });
  } catch (error) {
    return next(error);
  }
}

/** Simulate provider webhook */
export async function mockWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const { paymentId, secret } = req.body as { paymentId?: string; secret?: string };
    const order = await ordersService.confirmMockPayment(
      String(paymentId || ''),
      String(secret || ''),
    );
    return res.jsonApi(StatusCodes.OK, { data: order, message: 'message:payment_paid' });
  } catch (error) {
    return next(error);
  }
}
