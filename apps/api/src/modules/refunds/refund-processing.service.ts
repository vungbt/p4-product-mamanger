import { randomUUID } from 'node:crypto';
import type { User } from '@p4/shared';
import { Op, type Transaction } from 'sequelize';
import { permissionsFor } from '@/middlewares/permission.middleware.js';
import {
  type DomainEventModel,
  OrderItemModel,
  OrderModel,
  PaymentAttemptModel,
  PaymentLedgerModel,
  RefundModel,
  ReturnRequestModel,
  sequelize,
} from '@/sequelize/models/index.js';
import { enqueueEvent, recordAudit, runIdempotent } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { Forbidden, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';
import { quantityAmount } from '../orders/order-lifecycle.service.js';
import { getStripe } from '../payments/stripe.service.js';

export function refundDto(row: RefundModel) {
  return {
    ...selectFields(row, [
      'id',
      'orderId',
      'amount',
      'status',
      'reason',
      'processingStatus',
      'returnId',
      'version',
    ]),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function ownedRefund(user: User, id: string) {
  const row = await RefundModel.findByPk(id);
  if (!row) throw new NotFound();
  const order = await OrderModel.findByPk(row.orderId);
  if (!order || (order.userId !== user.id && !permissionsFor(user).includes('refund:read')))
    throw new Forbidden();
  return row;
}

export async function requestRefund(
  actorId: string,
  orderId: string,
  key: string,
  input: { amount?: number; returnId?: string; reason: string },
) {
  if (input.returnId && !/^[a-f0-9-]{36}$/i.test(input.returnId))
    throw new BaseError('invalid_return_id');
  const result = await runIdempotent(
    { scope: 'refund.create', actorId, key, payload: { orderId, ...input } },
    async (transaction) => {
      const order = await OrderModel.findByPk(orderId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!order) throw new NotFound();
      const attempt = await PaymentAttemptModel.findOne({
        where: { orderId, status: 'paid', reconciliation: 'matched' },
        transaction,
        lock: transaction.LOCK.UPDATE,
        order: [['createdAt', 'ASC']],
      });
      if (!attempt)
        throw new BaseError('captured_payment_required', 409, 'captured_payment_required');
      let amount = input.amount;
      if (input.returnId) {
        const returned = await ReturnRequestModel.findOne({
          where: { id: input.returnId, orderId, status: { [Op.in]: ['inspected', 'completed'] } },
          transaction,
        });
        if (!returned)
          throw new BaseError('return_inspection_required', 409, 'return_inspection_required');
        amount = 0;
        for (const line of returned.items) {
          const item = await OrderItemModel.findByPk(line.orderItemId, { transaction });
          if (!item) throw new NotFound();
          const previousReturns = await ReturnRequestModel.findAll({
            where: { orderId, status: { [Op.in]: ['inspected', 'completed'] } },
            transaction,
            order: [
              ['createdAt', 'ASC'],
              ['id', 'ASC'],
            ],
          });
          let offset = item.cancelledQuantity;
          for (const previous of previousReturns) {
            if (previous.id === returned.id) break;
            offset += previous.items
              .filter((entry) => entry.orderItemId === item.id)
              .reduce((sum, entry) => sum + entry.quantity, 0);
          }
          amount += quantityAmount(item.lineTotal, item.quantity, offset, line.quantity);
        }
      }
      const pending =
        (await RefundModel.sum('amount', {
          where: { paymentId: attempt.paymentId, status: { [Op.in]: ['pending', 'completed'] } },
          transaction,
        })) || 0;
      if (
        amount === undefined ||
        !Number.isSafeInteger(amount) ||
        amount <= 0 ||
        amount > attempt.amount - pending
      )
        throw new BaseError('refund_exceeds_captured', 409, 'refund_exceeds_captured');
      const row = await RefundModel.create(
        {
          paymentId: attempt.paymentId,
          attemptId: attempt.id,
          orderId,
          amount,
          status: 'pending',
          processingStatus: 'requested',
          reason: input.reason,
          returnId: input.returnId ?? null,
        },
        { transaction },
      );
      await enqueueEvent(
        {
          type: 'refund.requested',
          aggregateType: 'refund',
          aggregateId: row.id,
          payload: { refundId: row.id },
        },
        transaction,
      );
      await recordAudit(
        {
          actorId,
          action: 'refund.requested',
          resourceType: 'refund',
          resourceId: row.id,
          changes: { amount },
        },
        transaction,
      );
      return { refundId: row.id };
    },
  );
  const value = result.result;
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof value.refundId !== 'string'
  )
    throw new Error('Invalid refund result');
  const row = await RefundModel.findByPk(value.refundId);
  if (!row) throw new NotFound();
  return { ...refundDto(row), replayed: result.replayed };
}

async function lockedRefund(id: string, transaction: Transaction) {
  const pointer = await RefundModel.findByPk(id, { transaction });
  if (!pointer) throw new NotFound();
  await OrderModel.findByPk(pointer.orderId, { transaction, lock: transaction.LOCK.UPDATE });
  const row = await RefundModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!row) throw new NotFound();
  const attempt = row.attemptId
    ? await PaymentAttemptModel.findByPk(row.attemptId, { transaction })
    : await PaymentAttemptModel.findOne({
        where: { paymentId: row.paymentId, status: 'paid' },
        transaction,
        order: [['createdAt', 'DESC']],
      });
  if (!attempt) throw new BaseError('captured_payment_required', 409, 'captured_payment_required');
  if (!row.attemptId) await row.update({ attemptId: attempt.id }, { transaction });
  return { row, attempt };
}

export async function processRefund(event: DomainEventModel) {
  const prepared = await sequelize.transaction(async (transaction) => {
    const { row, attempt } = await lockedRefund(event.aggregateId, transaction);
    if (
      row.processingStatus === 'succeeded' ||
      row.processingStatus === 'failed' ||
      row.processingStatus === 'cancelled'
    )
      return null;
    if (attempt.provider === 'cod') return null; // A staff member must confirm an actual transfer.
    await row.update({ processingStatus: 'processing', version: row.version + 1 }, { transaction });
    return { row, attempt };
  });
  if (!prepared) return;
  const { row, attempt } = prepared;
  if (attempt.provider === 'mock') {
    const { env } = await import('@/configs/env.js');
    if (env.isProd) throw new BaseError('mock_disabled');
    await settleRefund(row.id, 'succeeded', `mock_refund:${row.id}`);
    return;
  }
  if (!attempt.providerTransactionId) throw new BaseError('provider_transaction_missing');
  const result = row.externalId
    ? await getStripe().refunds.retrieve(row.externalId)
    : await getStripe().refunds.create(
        {
          payment_intent: attempt.providerTransactionId,
          amount: row.amount,
          metadata: { refundId: row.id, orderId: row.orderId },
        },
        { idempotencyKey: `refund:${row.id}:${row.attemptNumber}` },
      );
  await sequelize.transaction(async (transaction) => {
    const locked = await lockedRefund(row.id, transaction);
    if (locked.row.processingStatus === 'succeeded') return;
    await locked.row.update({ externalId: result.id }, { transaction });
  });
  if (result.status === 'succeeded') await settleRefund(row.id, 'succeeded', result.id);
  else if (result.status === 'failed' || result.status === 'canceled')
    await settleRefund(row.id, 'failed', result.id);
  else throw new BaseError('refund_provider_pending');
}

export async function settleRefund(
  id: string,
  status: 'succeeded' | 'failed',
  reference: string,
  actorId: string | null = null,
  expectedVersion?: number,
) {
  return sequelize.transaction(async (transaction) => {
    const { row, attempt } = await lockedRefund(id, transaction);
    if (row.processingStatus === 'succeeded') return refundDto(row);
    if (expectedVersion !== undefined) assertVersion(row.version, expectedVersion);
    await row.update(
      {
        processingStatus: status,
        status: status === 'succeeded' ? 'completed' : 'failed',
        manualReference: attempt.provider === 'cod' ? reference : null,
        version: row.version + 1,
      },
      { transaction },
    );
    if (status === 'succeeded')
      await PaymentLedgerModel.create(
        {
          id: randomUUID(),
          attemptId: attempt.id,
          orderId: row.orderId,
          kind: 'refund',
          amount: row.amount,
          currency: attempt.currency,
          provider: attempt.provider,
          reference,
        },
        { transaction },
      );
    await recordAudit(
      {
        actorId,
        action: `refund.${status}`,
        resourceType: 'refund',
        resourceId: id,
        changes: { amount: row.amount },
      },
      transaction,
    );
    await enqueueEvent(
      {
        type: `refund.${status}`,
        aggregateType: 'refund',
        aggregateId: id,
        payload: { refundId: id, orderId: row.orderId },
      },
      transaction,
    );
    return refundDto(row);
  });
}

export async function manualRefund(
  actorId: string,
  id: string,
  expectedVersion: number,
  reference: string,
  amount: number,
) {
  const row = await RefundModel.findByPk(id);
  if (!row) throw new NotFound();
  if (row.processingStatus === 'succeeded') return refundDto(row);
  assertVersion(row.version, expectedVersion);
  const attempt = row.attemptId
    ? await PaymentAttemptModel.findByPk(row.attemptId)
    : await PaymentAttemptModel.findOne({ where: { paymentId: row.paymentId, status: 'paid' } });
  if (attempt?.provider !== 'cod' || row.amount !== amount)
    throw new BaseError('manual_refund_invalid');
  return settleRefund(id, 'succeeded', reference, actorId, expectedVersion);
}

export async function reconcileRefund(actorId: string, id: string) {
  const row = await RefundModel.findByPk(id);
  if (!row?.externalId) throw new NotFound();
  const result = await getStripe().refunds.retrieve(row.externalId);
  if (result.amount !== row.amount)
    throw new BaseError('refund_provider_mismatch', 409, 'refund_provider_mismatch');
  if (result.status === 'succeeded') return settleRefund(id, 'succeeded', result.id, actorId);
  if (result.status === 'failed' || result.status === 'canceled')
    return settleRefund(id, 'failed', result.id, actorId);
  return refundDto(row);
}

export async function retryRefund(actorId: string, id: string, expectedVersion: number) {
  return sequelize.transaction(async (transaction) => {
    const { row } = await lockedRefund(id, transaction);
    assertVersion(row.version, expectedVersion);
    if (!['processing', 'requested', 'failed'].includes(row.processingStatus))
      throw new BaseError('refund_not_retryable', 409, 'refund_not_retryable');
    if (row.processingStatus === 'failed') {
      const reserved =
        (await RefundModel.sum('amount', {
          where: { paymentId: row.paymentId, status: { [Op.in]: ['pending', 'completed'] } },
          transaction,
        })) || 0;
      const attempt = await PaymentAttemptModel.findByPk(row.attemptId ?? '', { transaction });
      if (!attempt || row.amount > attempt.amount - reserved)
        throw new BaseError('refund_exceeds_captured', 409, 'refund_exceeds_captured');
      await row.update(
        {
          status: 'pending',
          processingStatus: 'requested',
          externalId: null,
          attemptNumber: row.attemptNumber + 1,
          version: row.version + 1,
        },
        { transaction },
      );
    }
    await enqueueEvent(
      {
        type: 'refund.requested',
        aggregateType: 'refund',
        aggregateId: id,
        payload: { refundId: id },
      },
      transaction,
    );
    await recordAudit(
      { actorId, action: 'refund.retry_requested', resourceType: 'refund', resourceId: id },
      transaction,
    );
    return refundDto(row);
  });
}
