import { randomUUID } from 'node:crypto';
import type {
  CancellationRequest,
  OrderLifecycleStatus,
  OrderQuantityInput,
  User,
} from '@p4/shared';
import { Op, type Transaction } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import {
  CancellationRequestModel,
  InventoryReservationModel,
  OrderEventModel,
  OrderItemModel,
  OrderModel,
  PaymentAttemptModel,
  PaymentModel,
  RefundModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { recordAudit } from '@/shared/audit/record.js';
import { enqueueEvent, jsonValue } from '@/shared/commerce/persistence.js';
import { assertTransition, assertVersion } from '@/shared/commerce/transitions.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { Forbidden, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';
import { moveInventory } from '../inventory/inventory.service.js';
import { settleCoupon } from '../promotions/promotions.service.js';

export async function ownedOrder(user: User, id: string, transaction?: Transaction, lock = false) {
  const row = await OrderModel.findByPk(id, {
    transaction,
    ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!row) throw new NotFound();
  if (!canAccessRecord(user, 'read', 'Order', row)) throw new Forbidden();
  return row;
}

export async function orderEvent(
  orderId: string,
  actorId: string | null,
  type: string,
  detail: import('@p4/shared').JsonValue,
  transaction: Transaction,
) {
  await OrderEventModel.create(
    { id: randomUUID(), orderId, actorId, type, detail, public: true },
    { transaction },
  );
  await enqueueEvent(
    {
      type,
      aggregateType: 'order',
      aggregateId: orderId,
      payload: {
        orderId,
        ...(typeof detail === 'object' && detail !== null && !Array.isArray(detail) ? detail : {}),
      },
    },
    transaction,
  );
}

export async function transitionOrder(
  actorId: string,
  id: string,
  status: OrderLifecycleStatus,
  expectedVersion: number,
) {
  return auditedTransaction(async (transaction) => {
    const row = await OrderModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new NotFound();
    assertVersion(row.version, expectedVersion);
    assertTransition('order', row.lifecycleStatus, status);
    const reservations = await InventoryReservationModel.findAll({
      where: { orderId: id, status: 'reserved' },
      transaction,
    });
    if (
      reservations.some(
        (reservation) => reservation.expiresAt && reservation.expiresAt.getTime() <= Date.now(),
      )
    )
      throw new BaseError('reservation_expired', 409, 'reservation_expired');
    if (status === 'processing') {
      const payment = await PaymentModel.findOne({
        where: { orderId: id, status: 'paid' },
        transaction,
      });
      const cod = await PaymentAttemptModel.findOne({
        where: { orderId: id, provider: 'cod', status: 'pending' },
        transaction,
      });
      if (!payment && !cod) throw new BaseError('payment_required', 409, 'payment_required');
    }
    if (
      status === 'confirmed' &&
      (await PaymentAttemptModel.count({
        where: { orderId: id, provider: 'cod', status: 'pending' },
        transaction,
      }))
    )
      await InventoryReservationModel.update(
        { expiresAt: null },
        { where: { orderId: id, status: 'reserved' }, transaction },
      );
    await row.update({ lifecycleStatus: status, version: row.version + 1 }, { transaction });
    await orderEvent(id, actorId, `order.${status}`, { status }, transaction);
    await recordAudit(
      { actorId, action: `order.${status}`, resourceType: 'order', resourceId: id },
      transaction,
    );
    return { id: row.id, lifecycleStatus: row.lifecycleStatus, version: row.version };
  });
}

export function cancellationDto(row: CancellationRequestModel): CancellationRequest {
  return {
    ...selectFields(row, ['id', 'orderId', 'status', 'reason', 'resolution', 'items', 'version']),
    createdAt: row.createdAt.toISOString(),
  };
}

function cancellable(order: OrderModel) {
  if (!['pending_confirmation', 'confirmed'].includes(order.lifecycleStatus))
    throw new BaseError('order_not_cancellable', 409, 'order_not_cancellable');
}

export async function requestCancellation(
  user: User,
  orderId: string,
  expectedVersion: number,
  items: OrderQuantityInput[],
  reason: string,
) {
  return auditedTransaction(async (transaction) => {
    const order = await ownedOrder(user, orderId, transaction, true);
    if (!canAccessRecord(user, 'manage', 'Order', order)) throw new Forbidden();
    assertVersion(order.version, expectedVersion);
    cancellable(order);
    for (const input of items) {
      const item = await OrderItemModel.findOne({
        where: { id: input.orderItemId, orderId },
        transaction,
      });
      if (!item || input.quantity > item.quantity - item.cancelledQuantity - item.fulfilledQuantity)
        throw new BaseError('invalid_cancellation_quantity', 409, 'invalid_cancellation_quantity');
    }
    const row = await CancellationRequestModel.create(
      {
        id: randomUUID(),
        orderId,
        userId: user.id,
        status: 'requested',
        reason,
        resolution: null,
        items,
        version: 1,
      },
      { transaction },
    );
    await orderEvent(
      orderId,
      user.id,
      'order.cancellation_requested',
      { cancellationId: row.id },
      transaction,
    );
    await recordAudit(
      {
        actorId: user.id,
        action: 'cancellation.requested',
        resourceType: 'cancellation',
        resourceId: row.id,
      },
      transaction,
    );
    return cancellationDto(row);
  });
}

/** Partition integer line totals into unit amounts, assigning remainder to the first units. */
export function quantityAmount(total: number, quantity: number, offset: number, count: number) {
  if (
    ![total, quantity, offset, count].every(Number.isSafeInteger) ||
    total < 0 ||
    quantity < 1 ||
    offset < 0 ||
    count < 0 ||
    offset + count > quantity
  )
    throw new BaseError('invalid_quantity_allocation');
  const base = Math.floor(total / quantity);
  return base * count + Math.max(0, Math.min(offset + count, total % quantity) - offset);
}

async function approveCancellation(
  actor: User,
  row: CancellationRequestModel,
  order: OrderModel,
  transaction: Transaction,
) {
  cancellable(order);
  if (
    await PaymentAttemptModel.count({
      where: {
        orderId: order.id,
        provider: { [Op.ne]: 'cod' },
        status: { [Op.in]: ['pending', 'processing'] },
      },
      transaction,
    })
  )
    throw new BaseError('payment_in_progress', 409, 'payment_in_progress');
  let amount = 0;
  const changedItems = [];
  for (const input of row.items) {
    const item = await OrderItemModel.findOne({
      where: { id: input.orderItemId, orderId: order.id },
      transaction,
    });
    if (
      !item?.variantId ||
      input.quantity > item.quantity - item.cancelledQuantity - item.fulfilledQuantity
    )
      throw new BaseError('invalid_cancellation_quantity', 409, 'invalid_cancellation_quantity');
    amount += quantityAmount(item.lineTotal, item.quantity, item.cancelledQuantity, input.quantity);
    changedItems.push({ item, quantity: input.quantity });
  }
  changedItems.sort(
    (a, b) =>
      a.item.productId.localeCompare(b.item.productId) ||
      (a.item.variantId ?? '').localeCompare(b.item.variantId ?? ''),
  );
  for (const { item, quantity } of changedItems) {
    const reservation = await InventoryReservationModel.findOne({
      where: {
        orderId: order.id,
        variantId: item.variantId,
        status: { [Op.in]: ['reserved', 'committed'] },
      },
      transaction,
    });
    if (!reservation || reservation.quantity < quantity || !item.variantId)
      throw new BaseError('reservation_mismatch');
    await moveInventory(
      {
        variantId: item.variantId,
        kind: reservation.status === 'reserved' ? 'release' : 'return',
        quantity,
        actorId: actor.id,
        reason: 'Unshipped cancellation',
        reference: `cancellation:${row.id}`,
      },
      transaction,
    );
    await reservation.update(
      reservation.quantity === quantity
        ? { status: 'released' }
        : { quantity: reservation.quantity - quantity },
      { transaction },
    );
    await item.update({ cancelledQuantity: item.cancelledQuantity + quantity }, { transaction });
  }
  const items = await OrderItemModel.findAll({ where: { orderId: order.id }, transaction });
  const allCancelled = items.every((item) => item.cancelledQuantity === item.quantity);
  if (allCancelled) amount += order.shippingFee;
  const payment = await PaymentModel.findOne({
    where: { orderId: order.id, status: 'paid' },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (payment && amount > 0) {
    const refunded =
      (await RefundModel.sum('amount', {
        where: { paymentId: payment.id, status: { [Op.in]: ['pending', 'completed'] } },
        transaction,
      })) || 0;
    if (amount > payment.amount - refunded)
      throw new BaseError('refund_exceeds_captured', 409, 'refund_exceeds_captured');
    const refund = await RefundModel.create(
      {
        paymentId: payment.id,
        orderId: order.id,
        amount,
        reason: `Cancellation ${row.id}`,
        status: 'pending',
      },
      { transaction },
    );
    await enqueueEvent(
      {
        type: 'refund.requested',
        aggregateType: 'refund',
        aggregateId: refund.id,
        payload: { refundId: refund.id, cancellationId: row.id },
      },
      transaction,
    );
  }
  if (allCancelled) {
    await order.update(
      { lifecycleStatus: 'cancelled', status: 'cancelled', version: order.version + 1 },
      { transaction },
    );
    await PaymentModel.update(
      { status: 'failed' },
      { where: { orderId: order.id, status: 'pending' }, transaction },
    );
    await settleCoupon(order.id, 'released', transaction);
    await PaymentAttemptModel.update(
      { status: 'cancelled' },
      { where: { orderId: order.id, status: { [Op.in]: ['pending', 'processing'] } }, transaction },
    );
  } else {
    await order.update({ version: order.version + 1 }, { transaction });
    const cod = await PaymentAttemptModel.findOne({
      where: { orderId: order.id, provider: 'cod', status: 'pending' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (cod) {
      const payable =
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
        ) + order.shippingFee;
      await cod.update({ amount: payable, version: cod.version + 1 }, { transaction });
      await PaymentModel.update({ amount: payable }, { where: { id: cod.paymentId }, transaction });
    }
  }
  await row.update({ status: 'approved', version: row.version + 1 }, { transaction });
  await orderEvent(
    order.id,
    actor.id,
    'order.cancellation_approved',
    { cancellationId: row.id, allCancelled, amount },
    transaction,
  );
  await recordAudit(
    {
      actorId: actor.id,
      action: 'cancellation.approved',
      resourceType: 'cancellation',
      resourceId: row.id,
      changes: { amount, items: jsonValue(row.items) },
    },
    transaction,
  );
  return cancellationDto(row);
}

export async function resolveCancellation(
  actor: User,
  id: string,
  expectedVersion: number,
  approved: boolean,
  reason: string,
) {
  const pointer = await CancellationRequestModel.findByPk(id);
  if (!pointer) throw new NotFound();
  return auditedTransaction(async (transaction) => {
    const order = await OrderModel.findByPk(pointer.orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const row = await CancellationRequestModel.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row || !order) throw new NotFound();
    if (row.status === (approved ? 'approved' : 'rejected')) return cancellationDto(row);
    assertVersion(row.version, expectedVersion);
    if (row.status !== 'requested')
      throw new BaseError('cancellation_already_resolved', 409, 'cancellation_already_resolved');
    if (approved) return approveCancellation(actor, row, order, transaction);
    await row.update(
      { status: 'rejected', resolution: reason, version: row.version + 1 },
      { transaction },
    );
    await orderEvent(
      order.id,
      actor.id,
      'order.cancellation_rejected',
      { cancellationId: row.id, reason },
      transaction,
    );
    await recordAudit(
      {
        actorId: actor.id,
        action: 'cancellation.rejected',
        resourceType: 'cancellation',
        resourceId: id,
      },
      transaction,
    );
    return cancellationDto(row);
  });
}

export async function cancelAll(user: User, id: string) {
  return auditedTransaction(async (transaction) => {
    const order = await ownedOrder(user, id, transaction, true);
    if (!canAccessRecord(user, 'manage', 'Order', order)) throw new Forbidden();
    if (order.lifecycleStatus === 'cancelled') return { id, cancelled: true };
    if (
      order.lifecycleStatus !== 'pending_confirmation' ||
      (await PaymentModel.count({ where: { orderId: id, status: 'paid' }, transaction }))
    )
      throw new BaseError('use_cancellation_request', 409, 'use_cancellation_request');
    const items = await OrderItemModel.findAll({ where: { orderId: id }, transaction });
    const input = items
      .filter((item) => item.quantity > item.cancelledQuantity)
      .map((item) => ({ orderItemId: item.id, quantity: item.quantity - item.cancelledQuantity }));
    const row = await CancellationRequestModel.create(
      {
        id: randomUUID(),
        orderId: id,
        userId: user.id,
        status: 'requested',
        reason: 'Customer cancellation',
        resolution: null,
        items: input,
        version: 1,
      },
      { transaction },
    );
    await approveCancellation(user, row, order, transaction);
    return { id, cancelled: true };
  });
}
