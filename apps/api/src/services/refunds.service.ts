import type { Refund } from '@p4/shared';
import { errorKeys } from '@/constants/index.js';
import { sequelize } from '@/sequelize/index.js';
import {
  InventoryReservationModel,
  OrderModel,
  PaymentModel,
  ProductModel,
  RefundModel,
} from '@/sequelize/models/index.js';
import { BadRequest, NotFound } from '@/utils/errors/index.js';

function toRefund(row: RefundModel): Refund {
  return {
    id: row.id,
    paymentId: row.paymentId,
    orderId: row.orderId,
    amount: row.amount,
    status: row.status,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createRefund(orderId: string, input: { amount?: number; reason?: string }) {
  return sequelize.transaction(async (transaction) => {
    const order = await OrderModel.findByPk(orderId, { transaction });
    if (!order) throw new NotFound(errorKeys.orderNotFound);
    if (!['paid', 'shipping', 'completed'].includes(order.status)) {
      throw new BadRequest(errorKeys.refundInvalid);
    }

    const payment = await PaymentModel.findOne({
      where: { orderId, status: 'paid' },
      transaction,
    });
    if (!payment) throw new NotFound(errorKeys.paymentNotFound);

    const amount = input.amount != null ? Number(input.amount) : payment.amount;
    if (amount <= 0 || amount > payment.amount) throw new BadRequest(errorKeys.refundInvalid);

    const existing = await RefundModel.findOne({
      where: { orderId, status: 'completed' },
      transaction,
    });
    if (existing) throw new BadRequest(errorKeys.refundInvalid);

    const refund = await RefundModel.create(
      {
        paymentId: payment.id,
        orderId,
        amount,
        status: 'completed',
        reason: input.reason ?? null,
      },
      { transaction },
    );

    // Restock from committed reservations
    const reservations = await InventoryReservationModel.findAll({
      where: { orderId, status: 'committed' },
      transaction,
    });
    for (const res of reservations) {
      const product = await ProductModel.findByPk(res.productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (product) {
        await product.update({ stock: product.stock + res.quantity }, { transaction });
      }
      await res.update({ status: 'released' }, { transaction });
    }

    await order.update({ status: 'cancelled' }, { transaction });
    return toRefund(refund);
  });
}

export async function listRefunds(orderId?: string) {
  const rows = await RefundModel.findAll({
    where: orderId ? { orderId } : undefined,
    order: [['createdAt', 'DESC']],
  });
  return rows.map(toRefund);
}
