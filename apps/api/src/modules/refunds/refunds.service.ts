import type { Refund, RefundListQuery } from '@p4/shared';
import { cast, col, Op, where as sqlWhere, type WhereOptions } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import { sequelize } from '@/sequelize/index.js';
import {
  InventoryReservationModel,
  OrderModel,
  PaymentModel,
  ProductModel,
  RefundModel,
} from '@/sequelize/models/index.js';
import type { RefundAttributes } from '@/sequelize/models/refund.model.js';
import { dateRange, numberRange, searchPattern } from '@/shared/list-filters.js';
import type { ModelOrder } from '@/types/database.js';
import { BadRequest, NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';

const refundFields = [
  'id',
  'paymentId',
  'orderId',
  'amount',
  'status',
  'reason',
] satisfies (keyof Refund)[];

function toRefund(row: RefundModel): Refund {
  return {
    ...selectFields(row, refundFields),
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

export async function listRefunds(orderId?: string, query?: RefundListQuery) {
  const conditions: WhereOptions<RefundAttributes>[] = [];
  if (orderId) conditions.push({ orderId });
  if (query?.status) conditions.push({ status: query.status });
  if (query?.minAmount !== undefined || query?.maxAmount !== undefined)
    conditions.push({ amount: numberRange(query.minAmount, query.maxAmount) });
  if (query?.createdFrom || query?.createdTo)
    conditions.push({ createdAt: dateRange(query.createdFrom, query.createdTo) });
  if (query?.q) {
    const pattern = searchPattern(query.q);
    conditions.push({
      [Op.or]: [
        { reason: { [Op.iLike]: pattern } },
        sqlWhere(cast(col('order_id'), 'text'), { [Op.iLike]: pattern }),
      ],
    });
  }
  const where = conditions.length ? { [Op.and]: conditions } : undefined;
  const order: ModelOrder<RefundAttributes> = [
    [query?.sortBy ?? 'createdAt', query?.sortOrder === 'asc' ? 'ASC' : 'DESC'],
    ['id', 'ASC'],
  ];

  if (!query) return { data: (await RefundModel.findAll({ where, order })).map(toRefund) };

  const { rows, count } = await RefundModel.findAndCountAll({
    where,
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });
  return { data: rows.map(toRefund), meta: buildPaginationMeta(query.page, query.pageSize, count) };
}
