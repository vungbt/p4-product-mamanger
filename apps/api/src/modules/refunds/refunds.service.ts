import { buildPaginationMeta, dateRange, numberRange, searchPattern } from '@p4/server-core';
import type { Refund, RefundListQuery } from '@p4/shared';
import { cast, col, Op, where as sqlWhere, type WhereOptions } from 'sequelize';
import { RefundModel } from '@/sequelize/models/index.js';
import type { RefundAttributes } from '@/sequelize/models/refund.model.js';
import type { ModelOrder } from '@/types/database.js';
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
