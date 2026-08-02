import Stripe from 'stripe';
import { env } from '@/configs/env.js';
import { errorKeys } from '@/constants/index.js';
import { BadRequest } from '@/utils/errors/index.js';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.payment.stripeSecretKey) {
    throw new BadRequest(errorKeys.stripeNotConfigured);
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.payment.stripeSecretKey);
  }
  return stripeClient;
}

function fillOrderId(template: string, orderId: string): string {
  return template.replaceAll('{ORDER_ID}', orderId);
}

export async function createCheckoutSession(input: {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  description: string;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    client_reference_id: input.orderId,
    metadata: {
      orderId: input.orderId,
      paymentId: input.paymentId,
    },
    success_url: fillOrderId(env.payment.checkoutSuccessUrl, input.orderId),
    cancel_url: fillOrderId(env.payment.checkoutCancelUrl, input.orderId),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency,
          unit_amount: input.amount,
          product_data: {
            name: input.description,
          },
        },
      },
    ],
  });

  if (!session.url) {
    throw new BadRequest(errorKeys.stripeSessionFailed);
  }

  return { sessionId: session.id, url: session.url };
}

export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const stripe = getStripe();
  if (!env.payment.stripeWebhookSecret) {
    throw new BadRequest(errorKeys.stripeNotConfigured);
  }
  return stripe.webhooks.constructEvent(rawBody, signature, env.payment.stripeWebhookSecret);
}
