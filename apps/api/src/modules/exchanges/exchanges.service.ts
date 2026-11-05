import { randomUUID } from 'node:crypto';
import type { ExchangeLine, ExchangeRequest, User } from '@p4/shared';
import { permissionsFor } from '@/middlewares/permission.middleware.js';
import {
  CheckoutQuoteModel,
  ExchangeRequestModel,
  OrderItemModel,
  OrderModel,
  RefundModel,
  ReturnRequestModel,
  sequelize,
} from '@/sequelize/models/index.js';
import { enqueueEvent, recordAudit } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { Forbidden, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';
import { getMe } from '../auth/auth.service.js';
import { buildQuoteSnapshot, quoteFingerprint } from '../checkout/checkout.service.js';
import { quantityAmount } from '../orders/order-lifecycle.service.js';
import { placeOrder } from '../orders/order-placement.service.js';
import { requestRefund } from '../refunds/refund-processing.service.js';
import { settings } from '../settings/settings.service.js';

export function exchangeDto(row: ExchangeRequestModel): ExchangeRequest {
  return {
    ...selectFields(row, [
      'id',
      'orderId',
      'returnId',
      'status',
      'items',
      'reason',
      'priceDifference',
      'originalRefundAmount',
      'quoteId',
      'replacementOrderId',
      'refundId',
      'version',
    ]),
    settlementPolicy: 'refund_and_repurchase',
  };
}
export async function ownedExchange(user: User, id: string) {
  const row = await ExchangeRequestModel.findByPk(id);
  if (!row) throw new NotFound();
  if (row.userId !== user.id && !permissionsFor(user).includes('return:read'))
    throw new Forbidden();
  return row;
}
export async function requestExchange(
  user: User,
  orderId: string,
  returnId: string,
  items: ExchangeLine[],
  reason: string,
) {
  return sequelize.transaction(async (transaction) => {
    const order = await OrderModel.findOne({
      where: { id: orderId, userId: user.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!order) throw new NotFound();
    const returned = await ReturnRequestModel.findOne({
      where: { id: returnId, orderId, userId: user.id },
      transaction,
    });
    if (!returned || ['rejected', 'cancelled'].includes(returned.status)) throw new NotFound();
    if (
      items.length !== returned.items.length ||
      new Set(items.map((line) => line.orderItemId)).size !== items.length
    )
      throw new BaseError('exchange_items_mismatch');
    for (const line of items) {
      const source = returned.items.find((entry) => entry.orderItemId === line.orderItemId);
      if (!source || source.quantity !== line.quantity)
        throw new BaseError('exchange_items_mismatch');
    }
    const row = await ExchangeRequestModel.create(
      {
        id: randomUUID(),
        userId: user.id,
        orderId,
        returnId,
        items,
        reason,
        status: 'requested',
        priceDifference: null,
        originalRefundAmount: null,
        quoteId: null,
        replacementOrderId: null,
        refundId: null,
        version: 1,
      },
      { transaction },
    );
    await recordAudit(
      {
        actorId: user.id,
        action: 'exchange.requested',
        resourceType: 'exchange',
        resourceId: row.id,
      },
      transaction,
    );
    return exchangeDto(row);
  });
}
export async function approveExchange(actorId: string, id: string, expectedVersion: number) {
  return sequelize.transaction(async (transaction) => {
    const pointer = await ExchangeRequestModel.findByPk(id, { transaction });
    if (!pointer) throw new NotFound();
    const order = await OrderModel.findByPk(pointer.orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const row = await ExchangeRequestModel.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row || !order) throw new NotFound();
    assertVersion(row.version, expectedVersion);
    if (!['requested', 'awaiting_return'].includes(row.status) || row.replacementOrderId)
      throw new BaseError('exchange_not_approvable', 409, 'exchange_not_approvable');
    const returned = await ReturnRequestModel.findByPk(row.returnId, { transaction });
    if (!returned || ['rejected', 'cancelled'].includes(returned.status))
      throw new BaseError('return_unavailable');
    let refundAmount = 0;
    for (const line of row.items) {
      const item = await OrderItemModel.findByPk(line.orderItemId, { transaction });
      if (!item) throw new NotFound();
      refundAmount += quantityAmount(
        item.lineTotal,
        item.quantity,
        item.cancelledQuantity,
        line.quantity,
      );
    }
    if (
      !order.shippingFullName ||
      !order.shippingPhone ||
      !order.shippingLine1 ||
      !order.shippingCity
    )
      throw new BaseError('shipping_address_missing');
    const snapshot = await buildQuoteSnapshot(
      row.userId,
      {
        items: row.items.map((line) => selectFields(line, ['variantId', 'quantity'])),
        shippingAddress: {
          fullName: order.shippingFullName,
          phone: order.shippingPhone,
          line1: order.shippingLine1,
          city: order.shippingCity,
        },
        shippingMethodId: order.snapshot?.shipping.methodId,
      },
      transaction,
    );
    const config = await settings(transaction);
    const quote = await CheckoutQuoteModel.create(
      {
        id: randomUUID(),
        userId: row.userId,
        status: 'active',
        snapshot,
        fingerprint: quoteFingerprint(snapshot),
        expiresAt: new Date(Date.now() + config.quoteTtlSeconds * 1000),
        orderId: null,
      },
      { transaction },
    );
    await row.update(
      {
        status: 'awaiting_return',
        quoteId: quote.id,
        originalRefundAmount: refundAmount,
        priceDifference: snapshot.total - refundAmount,
        version: row.version + 1,
      },
      { transaction },
    );
    await recordAudit(
      {
        actorId,
        action: 'exchange.approved',
        resourceType: 'exchange',
        resourceId: id,
        changes: { priceDifference: row.priceDifference },
      },
      transaction,
    );
    return exchangeDto(row);
  });
}
export async function rejectExchange(
  actorId: string,
  id: string,
  expectedVersion: number,
  reason: string,
) {
  return sequelize.transaction(async (transaction) => {
    const row = await ExchangeRequestModel.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new NotFound();
    assertVersion(row.version, expectedVersion);
    if (!['requested', 'awaiting_return'].includes(row.status))
      throw new BaseError('exchange_already_processed', 409, 'exchange_already_processed');
    await row.update({ status: 'rejected', reason, version: row.version + 1 }, { transaction });
    await recordAudit(
      { actorId, action: 'exchange.rejected', resourceType: 'exchange', resourceId: id, reason },
      transaction,
    );
    return exchangeDto(row);
  });
}
export async function createReplacement(actorId: string, id: string, expectedVersion: number) {
  const row = await ExchangeRequestModel.findByPk(id);
  if (!row) throw new NotFound();
  if (row.replacementOrderId) return exchangeDto(row);
  assertVersion(row.version, expectedVersion);
  if (row.status !== 'awaiting_return' || !row.quoteId)
    throw new BaseError('exchange_not_ready', 409, 'exchange_not_ready');
  const returned = await ReturnRequestModel.findByPk(row.returnId);
  if (!returned || !['inspected', 'completed'].includes(returned.status))
    throw new BaseError('return_inspection_required', 409, 'return_inspection_required');
  // Use real original refund and replacement payment independently. priceDifference is their net;
  // no synthetic payment or hidden credit is created for the replacement order.
  const priorRefund = await RefundModel.findOne({ where: { returnId: row.returnId } });
  const refund =
    priorRefund ??
    (await requestRefund(actorId, row.orderId, `exchange-refund:${id}`, {
      returnId: row.returnId,
      reason: `Exchange ${id}`,
    }));
  const customer = (await getMe(row.userId)).user;
  const replacement = await placeOrder(customer, row.quoteId, `exchange-replacement:${id}`);
  return sequelize.transaction(async (transaction) => {
    const locked = await ExchangeRequestModel.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!locked) throw new NotFound();
    if (!locked.replacementOrderId) {
      await locked.update(
        {
          replacementOrderId: replacement.order.id,
          refundId: refund.id,
          status: 'replacement_processing',
          version: locked.version + 1,
        },
        { transaction },
      );
      await recordAudit(
        {
          actorId,
          action: 'exchange.replacement_created',
          resourceType: 'exchange',
          resourceId: id,
          changes: { orderId: replacement.order.id, refundId: refund.id },
        },
        transaction,
      );
      await enqueueEvent(
        {
          type: 'exchange.replacement_created',
          aggregateType: 'exchange',
          aggregateId: id,
          payload: { exchangeId: id, orderId: replacement.order.id, userId: locked.userId },
        },
        transaction,
      );
    }
    return exchangeDto(locked);
  });
}
export async function finishExchanges() {
  const rows = await ExchangeRequestModel.findAll({
    where: { status: 'replacement_processing' },
    limit: 100,
  });
  for (const row of rows) {
    const order = row.replacementOrderId ? await OrderModel.findByPk(row.replacementOrderId) : null;
    const refund = row.refundId ? await RefundModel.findByPk(row.refundId) : null;
    if (order?.lifecycleStatus === 'completed' && refund?.processingStatus === 'succeeded')
      await row.update({ status: 'completed', version: row.version + 1 });
  }
}
