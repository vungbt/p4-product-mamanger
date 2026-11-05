import { randomUUID } from 'node:crypto';
import type {
  OrderQuantityInput,
  ReturnInspection,
  ReturnRequest,
  ReturnStatus,
  User,
} from '@p4/shared';
import { Op } from 'sequelize';
import { permissionsFor } from '@/middlewares/permission.middleware.js';
import {
  FileModel,
  OrderItemModel,
  OrderModel,
  ReturnRequestModel,
  ShipmentItemModel,
  ShipmentModel,
  sequelize,
} from '@/sequelize/models/index.js';
import { jsonValue, recordAudit } from '@/shared/commerce/persistence.js';
import { assertTransition, assertVersion } from '@/shared/commerce/transitions.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { Forbidden, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';
import { moveInventory } from '../inventory/inventory.service.js';
import { orderEvent, ownedOrder } from '../orders/order-lifecycle.service.js';
import { settings } from '../settings/settings.service.js';

export function returnDto(row: ReturnRequestModel): ReturnRequest {
  return {
    ...selectFields(row, [
      'id',
      'orderId',
      'status',
      'reason',
      'resolution',
      'items',
      'evidenceIds',
      'inspection',
      'version',
    ]),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getReturn(user: User, id: string) {
  const row = await ReturnRequestModel.findByPk(id);
  if (!row) throw new NotFound();
  if (row.userId !== user.id && !permissionsFor(user).includes('return:read'))
    throw new Forbidden();
  return row;
}

export async function requestReturn(
  user: User,
  orderId: string,
  expectedVersion: number,
  items: OrderQuantityInput[],
  evidenceIds: string[],
  reason: string,
) {
  return sequelize.transaction(async (transaction) => {
    const order = await ownedOrder(user, orderId, transaction, true);
    if (order.userId !== user.id) throw new Forbidden();
    assertVersion(order.version, expectedVersion);
    const days = order.snapshot?.returnWindowDays ?? (await settings(transaction)).returnWindowDays;
    const delivered = await ShipmentModel.findAll({
      where: { orderId, fulfillmentStatus: 'delivered' },
      transaction,
    });
    const deliveredIds = delivered.map((row) => row.id);
    if (!deliveredIds.length)
      throw new BaseError('return_not_delivered', 409, 'return_not_delivered');
    const pending = await ReturnRequestModel.findAll({
      where: {
        orderId,
        status: { [Op.notIn]: ['rejected', 'cancelled', 'completed', 'inspected'] },
      },
      transaction,
    });
    for (const input of items) {
      const item = await OrderItemModel.findOne({
        where: { id: input.orderItemId, orderId },
        transaction,
      });
      const allocations = await ShipmentItemModel.findAll({
        where: { orderItemId: input.orderItemId, shipmentId: deliveredIds },
        transaction,
      });
      const eligible = allocations
        .filter((allocation) => {
          const delivery = delivered.find(
            (shipment) => shipment.id === allocation.shipmentId,
          )?.deliveredAt;
          return delivery && delivery.getTime() + days * 86400000 >= Date.now();
        })
        .reduce((sum, row) => sum + row.quantity, 0);
      const requested = pending.reduce(
        (sum, row) =>
          sum +
          row.items
            .filter((line) => line.orderItemId === input.orderItemId)
            .reduce((count, line) => count + line.quantity, 0),
        0,
      );
      if (!item || input.quantity > eligible - item.returnedQuantity - requested)
        throw new BaseError(
          'return_quantity_or_window_invalid',
          409,
          'return_quantity_or_window_invalid',
        );
    }
    for (const id of evidenceIds) {
      const file = await FileModel.findByPk(id, { transaction });
      if (
        !file ||
        file.metadata?.ownerId !== user.id ||
        file.metadata?.purpose !== 'return' ||
        file.metadata?.private !== true
      )
        throw new Forbidden();
    }
    const row = await ReturnRequestModel.create(
      {
        id: randomUUID(),
        orderId,
        userId: user.id,
        status: 'requested',
        reason,
        resolution: null,
        items,
        evidenceIds,
        inspection: null,
        version: 1,
      },
      { transaction },
    );
    await order.update({ version: order.version + 1 }, { transaction });
    await orderEvent(orderId, user.id, 'order.return_requested', { returnId: row.id }, transaction);
    await recordAudit(
      { actorId: user.id, action: 'return.requested', resourceType: 'return', resourceId: row.id },
      transaction,
    );
    return returnDto(row);
  });
}

export async function transitionReturn(
  actorId: string,
  id: string,
  status: ReturnStatus,
  expectedVersion: number,
  reason: string,
  inspection?: ReturnInspection[],
) {
  const pointer = await ReturnRequestModel.findByPk(id);
  if (!pointer) throw new NotFound();
  return sequelize.transaction(async (transaction) => {
    const order = await OrderModel.findByPk(pointer.orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const row = await ReturnRequestModel.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row || !order) throw new NotFound();
    if (row.status === status) return returnDto(row);
    assertVersion(row.version, expectedVersion);
    assertTransition('return', row.status, status);
    if (status === 'inspected') {
      if (
        !inspection ||
        inspection.length !== row.items.length ||
        new Set(inspection.map((line) => line.orderItemId)).size !== inspection.length
      )
        throw new BaseError('invalid_inspection');
      const changes = [];
      for (const line of row.items) {
        const result = inspection.find((entry) => entry.orderItemId === line.orderItemId);
        if (
          !result ||
          !Number.isInteger(result.saleableQuantity) ||
          !Number.isInteger(result.damagedQuantity) ||
          result.saleableQuantity < 0 ||
          result.damagedQuantity < 0 ||
          result.saleableQuantity + result.damagedQuantity !== line.quantity
        )
          throw new BaseError('invalid_inspection');
        const item = await OrderItemModel.findByPk(line.orderItemId, { transaction });
        if (!item?.variantId || item.returnedQuantity + line.quantity > item.fulfilledQuantity)
          throw new BaseError('return_quantity_exceeded', 409, 'return_quantity_exceeded');
        changes.push({ item, result, quantity: line.quantity });
      }
      changes.sort(
        (a, b) =>
          a.item.productId.localeCompare(b.item.productId) ||
          (a.item.variantId ?? '').localeCompare(b.item.variantId ?? ''),
      );
      for (const { item, result, quantity } of changes) {
        if (result.saleableQuantity && item.variantId)
          await moveInventory(
            {
              variantId: item.variantId,
              kind: 'return',
              quantity: result.saleableQuantity,
              actorId,
              reason: 'Inspected saleable return',
              reference: `return:${row.id}`,
            },
            transaction,
          );
        await item.update({ returnedQuantity: item.returnedQuantity + quantity }, { transaction });
      }
    }
    await row.update(
      {
        status,
        resolution: reason || row.resolution,
        inspection: inspection ?? row.inspection,
        version: row.version + 1,
      },
      { transaction },
    );
    await order.update({ version: order.version + 1 }, { transaction });
    await orderEvent(
      order.id,
      actorId,
      `order.return_${status}`,
      { returnId: row.id },
      transaction,
    );
    await recordAudit(
      {
        actorId,
        action: `return.${status}`,
        resourceType: 'return',
        resourceId: id,
        changes: inspection ? jsonValue(inspection) : {},
      },
      transaction,
    );
    return returnDto(row);
  });
}
