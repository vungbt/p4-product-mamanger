import { randomUUID } from 'node:crypto';
import { BaseError, NotFound } from '@p4/server-core';
import type { FulfillmentShipment, FulfillmentStatus, OrderQuantityInput, User } from '@p4/shared';
import { Op, type Transaction } from 'sequelize';
import {
  InventoryReservationModel,
  OrderItemModel,
  OrderModel,
  PaymentAttemptModel,
  PaymentModel,
  ShipmentEventModel,
  ShipmentItemModel,
  ShipmentModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit/audited-command.js';
import { assertTransition, assertVersion } from '@/shared/commerce/transitions.js';
import { selectFields } from '@/utils/select-fields.js';
import { moveInventory } from '../inventory/inventory.service.js';
import { orderEvent, ownedOrder } from '../orders/order-lifecycle.service.js';

export async function shipmentDto(
  row: ShipmentModel,
  transaction?: Transaction,
): Promise<FulfillmentShipment> {
  const items = await ShipmentItemModel.findAll({
    where: { shipmentId: row.id },
    transaction,
    order: [['id', 'ASC']],
  });
  return {
    ...selectFields(row, [
      'id',
      'orderId',
      'fulfillmentStatus',
      'carrier',
      'trackingCode',
      'version',
    ]),
    shippedAt: row.shippedAt?.toISOString() ?? null,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    items: items.map((item) => selectFields(item, ['id', 'orderItemId', 'quantity'])),
  };
}

export async function createShipment(
  actorId: string,
  orderId: string,
  expectedVersion: number,
  items: OrderQuantityInput[],
  carrier: string,
) {
  return auditedTransaction(async (transaction) => {
    const order = await OrderModel.findByPk(orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!order) throw new NotFound();
    assertVersion(order.version, expectedVersion);
    if (order.lifecycleStatus !== 'processing')
      throw new BaseError('order_not_processing', 409, 'order_not_processing');
    const shipments = await ShipmentModel.findAll({
      where: { orderId, fulfillmentStatus: { [Op.ne]: 'cancelled' } },
      transaction,
    });
    for (const input of items) {
      const item = await OrderItemModel.findOne({
        where: { id: input.orderItemId, orderId },
        transaction,
      });
      if (!item) throw new NotFound();
      const allocated = shipments.length
        ? (await ShipmentItemModel.sum('quantity', {
            where: { shipmentId: shipments.map((row) => row.id), orderItemId: item.id },
            transaction,
          })) || 0
        : 0;
      if (input.quantity > item.quantity - item.cancelledQuantity - allocated)
        throw new BaseError('shipment_quantity_exceeded', 409, 'shipment_quantity_exceeded');
    }
    const row = await ShipmentModel.create(
      { orderId, carrier, fulfillmentStatus: 'pending_pack' },
      { transaction },
    );
    for (const input of items)
      await ShipmentItemModel.create(
        { id: randomUUID(), shipmentId: row.id, ...input },
        { transaction },
      );
    await order.update({ version: order.version + 1 }, { transaction });
    await orderEvent(
      orderId,
      actorId,
      'order.shipment_created',
      { shipmentId: row.id },
      transaction,
    );
    await recordAudit(
      { actorId, action: 'shipment.created', resourceType: 'shipment', resourceId: row.id },
      transaction,
    );
    return shipmentDto(row, transaction);
  });
}

export async function transitionShipment(
  actorId: string,
  id: string,
  state: FulfillmentStatus,
  expectedVersion: number,
  reference: string,
  trackingCode?: string,
) {
  const pointer = await ShipmentModel.findByPk(id);
  if (!pointer) throw new NotFound();
  return auditedTransaction(async (transaction) => {
    const order = await OrderModel.findByPk(pointer.orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const row = await ShipmentModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row || !order) throw new NotFound();
    const previous = await ShipmentEventModel.findOne({
      where: { shipmentId: id, reference },
      transaction,
    });
    if (previous) {
      if (previous.type !== state)
        throw new BaseError('shipment_reference_conflict', 409, 'shipment_reference_conflict');
      return shipmentDto(row, transaction);
    }
    assertVersion(row.version, expectedVersion);
    assertTransition('shipment', row.fulfillmentStatus, state);
    if (state === 'in_transit' && !(trackingCode ?? row.trackingCode))
      throw new BaseError('tracking_required');
    const allocations = await ShipmentItemModel.findAll({ where: { shipmentId: id }, transaction });
    if (state === 'in_transit') {
      const paid = await PaymentModel.count({
        where: { orderId: order.id, status: 'paid' },
        transaction,
      });
      const cod = await PaymentAttemptModel.count({
        where: { orderId: order.id, provider: 'cod', status: 'pending' },
        transaction,
      });
      if (!paid && !cod) throw new BaseError('payment_required', 409, 'payment_required');
      const items = [];
      for (const allocation of allocations) {
        const item = await OrderItemModel.findByPk(allocation.orderItemId, { transaction });
        if (
          !item?.variantId ||
          item.fulfilledQuantity + allocation.quantity > item.quantity - item.cancelledQuantity
        )
          throw new BaseError('shipment_quantity_exceeded', 409, 'shipment_quantity_exceeded');
        items.push({ item, quantity: allocation.quantity });
      }
      items.sort(
        (a, b) =>
          a.item.productId.localeCompare(b.item.productId) ||
          (a.item.variantId ?? '').localeCompare(b.item.variantId ?? ''),
      );
      for (const { item, quantity } of items) {
        if (cod && !paid && item.variantId) {
          const reservation = await InventoryReservationModel.findOne({
            where: { orderId: order.id, variantId: item.variantId, status: 'reserved' },
            transaction,
          });
          if (!reservation || reservation.quantity < quantity)
            throw new BaseError('reservation_mismatch');
          await moveInventory(
            {
              variantId: item.variantId,
              kind: 'commit',
              quantity,
              actorId,
              reason: 'COD handover',
              reference: `shipment:${id}`,
            },
            transaction,
          );
          if (reservation.quantity === quantity)
            await reservation.update({ status: 'committed' }, { transaction });
          else {
            await reservation.update(
              { quantity: reservation.quantity - quantity },
              { transaction },
            );
            await InventoryReservationModel.create(
              {
                orderId: order.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity,
                status: 'committed',
                expiresAt: null,
              },
              { transaction },
            );
          }
        }
        await item.update(
          { fulfilledQuantity: item.fulfilledQuantity + quantity },
          { transaction },
        );
      }
    }
    const now = new Date();
    await row.update(
      {
        fulfillmentStatus: state,
        version: row.version + 1,
        trackingCode: trackingCode ?? row.trackingCode,
        status:
          state === 'delivered'
            ? 'delivered'
            : state === 'cancelled'
              ? 'cancelled'
              : ['in_transit', 'out_for_delivery', 'delivery_failed', 'returned', 'lost'].includes(
                    state,
                  )
                ? 'shipped'
                : 'pending',
        shippedAt: state === 'in_transit' ? now : row.shippedAt,
        deliveredAt: state === 'delivered' ? now : row.deliveredAt,
      },
      { transaction },
    );
    await ShipmentEventModel.create(
      { id: randomUUID(), shipmentId: id, type: state, reference, detail: {}, occurredAt: now },
      { transaction },
    );
    let completed = false;
    if (state === 'delivered') {
      const items = await OrderItemModel.findAll({ where: { orderId: order.id }, transaction });
      const shipments = await ShipmentModel.findAll({
        where: { orderId: order.id, fulfillmentStatus: { [Op.ne]: 'cancelled' } },
        transaction,
      });
      completed =
        shipments.every((shipment) => shipment.fulfillmentStatus === 'delivered') &&
        items.every((item) => item.fulfilledQuantity + item.cancelledQuantity === item.quantity);
    }
    await order.update(
      {
        version: order.version + 1,
        ...(completed
          ? { lifecycleStatus: 'completed', status: 'completed' }
          : state === 'in_transit'
            ? { status: 'shipping' }
            : {}),
      },
      { transaction },
    );
    await orderEvent(order.id, actorId, `order.shipment_${state}`, { shipmentId: id }, transaction);
    await recordAudit(
      { actorId, action: `shipment.${state}`, resourceType: 'shipment', resourceId: id },
      transaction,
    );
    return shipmentDto(row, transaction);
  });
}

export async function listShipments(user: User, orderId: string) {
  await ownedOrder(user, orderId);
  return Promise.all(
    (
      await ShipmentModel.findAll({
        where: { orderId },
        order: [
          ['createdAt', 'ASC'],
          ['id', 'ASC'],
        ],
      })
    ).map((row) => shipmentDto(row)),
  );
}
