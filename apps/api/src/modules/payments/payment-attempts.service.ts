import { createHash, randomUUID } from 'node:crypto';
import type { PaymentAttempt, PaymentProvider, User } from '@p4/shared';
import { Op, type Transaction } from 'sequelize';
import type Stripe from 'stripe';
import { env } from '@/configs/env.js';
import { permissionsFor } from '@/middlewares/permission.middleware.js';
import {
  type DomainEventModel,
  InventoryReservationModel,
  OrderItemModel,
  OrderModel,
  PaymentAttemptModel,
  PaymentLedgerModel,
  PaymentModel,
  RefundModel,
  sequelize,
  WebhookReceiptModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { recordAudit } from '@/shared/audit/record.js';
import { enqueueEvent, runIdempotent } from '@/shared/commerce/persistence.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { Forbidden, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';
import { moveInventory } from '../inventory/inventory.service.js';
import { expireOrder } from '../jobs/jobs.service.js';
import { orderEvent, ownedOrder, quantityAmount } from '../orders/order-lifecycle.service.js';
import { settleCoupon } from '../promotions/promotions.service.js';
import { createCheckoutSession, getStripe } from './stripe.service.js';

export function paymentAttemptDto(row: PaymentAttemptModel): PaymentAttempt {
  return {
    ...selectFields(row, [
      'id',
      'orderId',
      'provider',
      'status',
      'amount',
      'currency',
      'checkoutUrl',
      'reconciliation',
      'version',
    ]),
    expiresAt: row.expiresAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null,
  };
}

export async function payableAmount(order: OrderModel, transaction: Transaction) {
  if (!order.snapshot) return order.total;
  const items = await OrderItemModel.findAll({ where: { orderId: order.id }, transaction });
  return (
    items.reduce(
      (sum, item) =>
        sum +
        quantityAmount(
          item.lineTotal,
          item.quantity,
          item.cancelledQuantity,
          item.quantity - item.cancelledQuantity,
        ),
      0,
    ) + (items.some((item) => item.cancelledQuantity < item.quantity) ? order.shippingFee : 0)
  );
}

export async function createPaymentAttempt(
  user: User,
  orderId: string,
  provider: PaymentProvider,
  key: string,
) {
  if (provider === 'mock' && env.isProd) throw new NotFound();
  if (provider === 'stripe') getStripe();
  const result = await runIdempotent(
    { scope: 'payment.create', actorId: user.id, key, payload: { orderId, provider } },
    async (transaction) => {
      const order = await ownedOrder(user, orderId, transaction, true);
      if (order.userId !== user.id) throw new Forbidden();
      if (!['pending_confirmation', 'confirmed'].includes(order.lifecycleStatus))
        throw new BaseError('order_not_payable', 409, 'order_not_payable');
      if (provider === 'cod' && !order.snapshot?.shipping.codEnabled)
        throw new BaseError('cod_unavailable', 409, 'cod_unavailable');
      if (
        await PaymentAttemptModel.count({
          where: { orderId, status: { [Op.in]: ['pending', 'processing', 'paid'] } },
          transaction,
        })
      )
        throw new BaseError('payment_attempt_exists', 409, 'payment_attempt_exists');
      const reservations = await InventoryReservationModel.findAll({
        where: { orderId, status: 'reserved' },
        transaction,
      });
      if (
        !reservations.length ||
        reservations.some((row) => row.expiresAt && row.expiresAt.getTime() <= Date.now())
      )
        throw new BaseError('reservation_expired', 409, 'reservation_expired');
      const amount = await payableAmount(order, transaction);
      let payment = await PaymentModel.findOne({
        where: { orderId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!payment)
        payment = await PaymentModel.create(
          { orderId, provider, amount, status: 'pending' },
          { transaction },
        );
      else
        await payment.update(
          { provider, amount, status: 'pending', externalId: null, checkoutUrl: null },
          { transaction },
        );
      const id = randomUUID();
      const expiresAt = new Date(
        Math.min(...reservations.map((row) => row.expiresAt?.getTime() ?? Date.now() + 86400_000)),
      );
      await PaymentAttemptModel.create(
        {
          id,
          paymentId: payment.id,
          orderId,
          provider,
          amount,
          currency: order.currency,
          status: provider === 'cod' ? 'pending' : 'processing',
          checkoutUrl: provider === 'mock' ? `/api/payments/${id}/mock-pay` : null,
          externalId: null,
          providerTransactionId: null,
          reconciliation: 'unreconciled',
          paidAt: null,
          expiresAt,
          version: 1,
        },
        { transaction },
      );
      if (provider === 'stripe')
        await enqueueEvent(
          {
            type: 'payment.checkout_requested',
            aggregateType: 'payment_attempt',
            aggregateId: id,
            payload: { attemptId: id },
          },
          transaction,
        );
      await recordAudit(
        {
          actorId: user.id,
          action: 'payment.created',
          resourceType: 'payment_attempt',
          resourceId: id,
          changes: { orderId, provider, amount },
        },
        transaction,
      );
      return { attemptId: id };
    },
  );
  const data = result.result;
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    typeof data.attemptId !== 'string'
  )
    throw new Error('Invalid payment idempotency result.');
  const row = await PaymentAttemptModel.findByPk(data.attemptId);
  if (!row) throw new NotFound();
  return { ...paymentAttemptDto(row), replayed: result.replayed };
}

export async function provisionCheckout(event: DomainEventModel) {
  const row = await PaymentAttemptModel.findByPk(event.aggregateId);
  if (row?.provider !== 'stripe' || row.externalId || row.status !== 'processing') return;
  if (row.expiresAt.getTime() <= Date.now()) throw new BaseError('payment_expired');
  const session = await createCheckoutSession({
    orderId: row.orderId,
    paymentId: row.id,
    amount: row.amount,
    currency: row.currency.toLowerCase(),
    description: `Order ${row.orderId}`,
    idempotencyKey: row.id,
  });
  await auditedTransaction(async (transaction) => {
    await OrderModel.findByPk(row.orderId, { transaction, lock: transaction.LOCK.UPDATE });
    const locked = await PaymentAttemptModel.findByPk(row.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!locked || locked.externalId || locked.status !== 'processing') return;
    await locked.update(
      { externalId: session.sessionId, checkoutUrl: session.url, version: locked.version + 1 },
      { transaction },
    );
    await PaymentModel.update(
      { externalId: session.sessionId, checkoutUrl: session.url },
      { where: { id: locked.paymentId }, transaction },
    );
  });
}

export async function capturePayment(
  input: {
    attemptId: string;
    reference: string;
    transactionId: string | null;
    amount: number;
    currency: string;
    actorId: string | null;
  },
  transaction: Transaction,
) {
  const pointer = await PaymentAttemptModel.findByPk(input.attemptId, { transaction });
  if (!pointer) throw new NotFound();
  const order = await OrderModel.findByPk(pointer.orderId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const payment = await PaymentModel.findByPk(pointer.paymentId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const attempt = await PaymentAttemptModel.findByPk(input.attemptId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!attempt || !order || !payment) throw new NotFound();
  if (
    attempt.amount !== input.amount ||
    attempt.currency.toLowerCase() !== input.currency.toLowerCase()
  ) {
    await attempt.update({ reconciliation: 'mismatch' }, { transaction });
    await recordAudit(
      {
        actorId: input.actorId,
        action: 'payment.mismatch',
        resourceType: 'payment_attempt',
        resourceId: attempt.id,
        outcome: 'failure',
      },
      transaction,
    );
    return { accepted: false, reason: 'amount_or_currency_mismatch' };
  }
  if (attempt.status === 'paid') return { accepted: true, replayed: true };
  const reservations = await InventoryReservationModel.findAll({
    where: { orderId: order.id, status: 'reserved' },
    transaction,
    order: [
      ['productId', 'ASC'],
      ['variantId', 'ASC'],
    ],
  });
  const expired =
    attempt.provider !== 'cod' &&
    (attempt.expiresAt.getTime() <= Date.now() ||
      reservations.some((row) => row.expiresAt && row.expiresAt.getTime() <= Date.now()));
  if (expired && order.status === 'pending') await expireOrder(order.id, new Date(), transaction);
  await order.reload({ transaction });
  const duplicate = payment.status === 'paid';
  const late = order.lifecycleStatus === 'cancelled' || expired;
  await attempt.update(
    {
      status: 'paid',
      paidAt: new Date(),
      providerTransactionId: input.transactionId,
      reconciliation: duplicate ? 'duplicate_charge' : late ? 'late_paid' : 'matched',
      version: attempt.version + 1,
    },
    { transaction },
  );
  await PaymentLedgerModel.create(
    {
      id: randomUUID(),
      attemptId: attempt.id,
      orderId: order.id,
      kind: 'capture',
      amount: attempt.amount,
      currency: attempt.currency,
      provider: attempt.provider,
      reference: input.reference,
    },
    { transaction },
  );
  if (!duplicate)
    await payment.update(
      {
        status: 'paid',
        amount: attempt.amount,
        provider: attempt.provider,
        paidAt: new Date(),
        externalId: attempt.externalId,
        checkoutUrl: null,
      },
      { transaction },
    );
  if (late || duplicate) {
    const refund = await RefundModel.create(
      {
        paymentId: payment.id,
        orderId: order.id,
        amount: attempt.amount,
        status: 'pending',
        reason: duplicate ? 'Duplicate charge' : 'Late payment after reservation expiry',
      },
      { transaction },
    );
    await enqueueEvent(
      {
        type: 'refund.requested',
        aggregateType: 'refund',
        aggregateId: refund.id,
        payload: { refundId: refund.id, attemptId: attempt.id, exception: true },
      },
      transaction,
    );
  } else {
    for (const reservation of reservations) {
      if (!reservation.variantId) throw new BaseError('reservation_variant_missing');
      await moveInventory(
        {
          variantId: reservation.variantId,
          kind: 'commit',
          quantity: reservation.quantity,
          actorId: input.actorId,
          reason: 'Payment captured',
          reference: `payment:${attempt.id}`,
        },
        transaction,
      );
      await reservation.update({ status: 'committed' }, { transaction });
    }
    await settleCoupon(order.id, 'committed', transaction);
    await order.update(
      { status: order.status === 'pending' ? 'paid' : order.status, version: order.version + 1 },
      { transaction },
    );
  }
  await orderEvent(
    order.id,
    input.actorId,
    'order.payment_received',
    { amount: attempt.amount, late, duplicate },
    transaction,
  );
  await recordAudit(
    {
      actorId: input.actorId,
      action: 'payment.captured',
      resourceType: 'payment_attempt',
      resourceId: attempt.id,
      changes: { amount: attempt.amount, late, duplicate },
    },
    transaction,
  );
  return { accepted: true, late, duplicate };
}

export async function markMockPaid(user: User, id: string) {
  if (env.isProd) throw new NotFound();
  const attempt = await PaymentAttemptModel.findByPk(id);
  if (attempt?.provider !== 'mock') throw new NotFound();
  const order = await ownedOrder(user, attempt.orderId);
  if (order.userId !== user.id && !permissionsFor(user).includes('payment:manage'))
    throw new Forbidden();
  return auditedTransaction(async (transaction) =>
    capturePayment(
      {
        attemptId: attempt.id,
        reference: `mock:${attempt.id}`,
        transactionId: `mock:${attempt.id}`,
        amount: attempt.amount,
        currency: attempt.currency,
        actorId: user.id,
      },
      transaction,
    ),
  );
}

async function processStripeSession(session: Stripe.Checkout.Session, transaction: Transaction) {
  const id = session.metadata?.paymentId;
  const attempt = id
    ? await PaymentAttemptModel.findByPk(id, { transaction })
    : await PaymentAttemptModel.findOne({ where: { externalId: session.id }, transaction });
  if (attempt?.provider !== 'stripe') return { accepted: false, reason: 'unknown_payment' };
  if (
    (attempt.externalId && attempt.externalId !== session.id) ||
    session.metadata?.orderId !== attempt.orderId
  )
    return { accepted: false, reason: 'session_mismatch' };
  if (session.payment_status !== 'paid' || session.amount_total === null || !session.currency)
    return { accepted: false, reason: 'not_paid' };
  return capturePayment(
    {
      attemptId: attempt.id,
      reference: session.id,
      transactionId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      amount: session.amount_total,
      currency: session.currency,
      actorId: null,
    },
    transaction,
  );
}

export async function handleStripeEvent(event: Stripe.Event, raw: Buffer) {
  if (event.livemode !== env.payment.stripeSecretKey.startsWith('sk_live_'))
    throw new BaseError('stripe_mode_mismatch');
  return auditedTransaction(async (transaction) => {
    await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:key))', {
      replacements: { key: `webhook:stripe:${event.id}` },
      transaction,
    });
    const hash = createHash('sha256').update(raw).digest('hex');
    const previous = await WebhookReceiptModel.findByPk(event.id, { transaction });
    if (previous) {
      if (previous.payloadHash !== hash)
        throw new BaseError('webhook_payload_conflict', 409, 'webhook_payload_conflict');
      return { received: true, replayed: true };
    }
    const receipt = await WebhookReceiptModel.create(
      {
        id: event.id,
        provider: 'stripe',
        eventType: event.type,
        payloadHash: hash,
        status: 'received',
        errorCode: null,
      },
      { transaction },
    );
    let errorCode: string | null = null;
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const result = await processStripeSession(event.data.object, transaction);
      if (!result.accepted && 'reason' in result && typeof result.reason === 'string')
        errorCode = result.reason;
    } else if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const pointer = await PaymentAttemptModel.findOne({
        where: { externalId: event.data.object.id },
        transaction,
      });
      if (pointer) {
        await OrderModel.findByPk(pointer.orderId, { transaction, lock: transaction.LOCK.UPDATE });
        const attempt = await PaymentAttemptModel.findByPk(pointer.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (attempt && ['pending', 'processing'].includes(attempt.status)) {
          await attempt.update(
            {
              status: event.type === 'checkout.session.expired' ? 'expired' : 'failed',
              version: attempt.version + 1,
            },
            { transaction },
          );
          await PaymentModel.update(
            { status: 'failed' },
            { where: { id: attempt.paymentId, status: 'pending' }, transaction },
          );
        }
      }
    }
    await receipt.update(
      { status: errorCode ? 'rejected' : 'processed', errorCode },
      { transaction },
    );
    return { received: true, ...(errorCode ? { flagged: true } : {}) };
  });
}

export async function reconcilePayment(actorId: string, id: string) {
  const attempt = await PaymentAttemptModel.findByPk(id);
  if (attempt?.provider !== 'stripe' || !attempt.externalId) throw new NotFound();
  const session = await getStripe().checkout.sessions.retrieve(attempt.externalId);
  return auditedTransaction(async (transaction) => {
    const result = await processStripeSession(session, transaction);
    await recordAudit(
      {
        actorId,
        action: 'payment.reconciled',
        resourceType: 'payment_attempt',
        resourceId: attempt.id,
      },
      transaction,
    );
    return result;
  });
}

export async function collectCod(actorId: string, id: string, reference: string, amount: number) {
  return auditedTransaction(async (transaction) => {
    const attempt = await PaymentAttemptModel.findByPk(id, { transaction });
    if (attempt?.provider !== 'cod') throw new NotFound();
    const order = await OrderModel.findByPk(attempt.orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (order?.lifecycleStatus !== 'completed')
      throw new BaseError('cod_delivery_required', 409, 'cod_delivery_required');
    return capturePayment(
      {
        attemptId: id,
        reference,
        transactionId: reference,
        amount,
        currency: attempt.currency,
        actorId,
      },
      transaction,
    );
  });
}
