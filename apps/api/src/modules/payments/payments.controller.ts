import { BadRequest, currentUser, uuidRouteId } from '@p4/server-core';
import type { NextFunction, Request, Response } from 'express';
import { errorKeys } from '@/constants/index.js';
import { handleStripeEvent, markMockPaid } from './payment-attempts.service.js';
import { constructWebhookEvent } from './stripe.service.js';

export async function mockPay(req: Request, res: Response, next: NextFunction) {
  try {
    return res.jsonApi(200, { data: await markMockPaid(currentUser(req), uuidRouteId(req)) });
  } catch (error) {
    return next(error);
  }
}

export async function stripeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['stripe-signature'];
    const raw: unknown = req.body;
    if (typeof signature !== 'string' || !Buffer.isBuffer(raw))
      throw new BadRequest(errorKeys.stripeWebhookInvalid);
    let event: import('stripe').default.Event;
    try {
      event = constructWebhookEvent(raw, signature);
    } catch {
      throw new BadRequest(errorKeys.stripeWebhookInvalid);
    }
    return res.status(200).json(await handleStripeEvent(event, raw));
  } catch (error) {
    return next(error);
  }
}
