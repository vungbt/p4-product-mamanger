import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type Stripe from 'stripe';
import { errorKeys } from '@/constants/index.js';
import * as ordersService from '@/modules/orders/orders.service.js';
import { BadRequest, Forbidden } from '@/utils/errors/index.js';
import { logger } from '@/utils/logger.js';
import { constructWebhookEvent } from './stripe.service.js';

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

/** Stripe webhook — requires raw body (see index.ts) */
export async function stripeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string' || !signature) {
      throw new BadRequest(errorKeys.stripeWebhookInvalid);
    }
    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody)) {
      throw new BadRequest(errorKeys.stripeWebhookInvalid);
    }

    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(rawBody, signature);
    } catch (err) {
      logger.warn('[Stripe] Webhook signature verify failed', err);
      throw new BadRequest(errorKeys.stripeWebhookInvalid);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentId =
        typeof session.metadata?.paymentId === 'string' ? session.metadata.paymentId : '';
      if (paymentId) {
        await ordersService.confirmPaid(paymentId);
      } else if (session.id) {
        await ordersService.confirmPaidByStripeSession(session.id);
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      if (session.id) {
        await ordersService.markPaymentFailedByStripeSession(session.id);
      }
    }

    return res.status(StatusCodes.OK).json({ received: true });
  } catch (error) {
    return next(error);
  }
}
