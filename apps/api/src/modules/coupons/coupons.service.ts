import type { Coupon, CouponInput, CouponListQuery } from '@p4/shared';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import type { CouponAttributes } from '@/sequelize/models/coupon.model.js';
import { CouponModel } from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { recordAudit } from '@/shared/audit/record.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { searchPattern } from '@/shared/list-filters.js';
import { requestStore } from '@/shared/request-store.js';
import type { ModelOrder } from '@/types/database.js';
import { BadRequest, NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';

const couponFields = [
  'id',
  'perUserLimit',
  'variantIds',
  'categoryIds',
  'version',
  'code',
  'type',
  'value',
  'minOrderAmount',
  'maxDiscount',
  'usageLimit',
  'usedCount',
  'isActive',
] satisfies (keyof Coupon)[];

export function toCoupon(row: CouponModel): Coupon {
  return {
    ...selectFields(row, couponFields),
    startsAt: row.startsAt ? row.startsAt.toISOString() : null,
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
  };
}

export function computeDiscount(coupon: CouponModel, subtotal: number): number {
  if (subtotal < coupon.minOrderAmount) {
    throw new BadRequest(errorKeys.couponInvalid);
  }
  let discount =
    coupon.type === 'percent' ? Math.floor((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount != null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  return Math.max(0, Math.min(discount, subtotal));
}

export async function findValidCouponByCode(code: string, transaction?: Transaction) {
  const row = await CouponModel.findOne({
    where: {
      code: code.trim().toUpperCase(),
      isActive: true,
    },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!row) throw new BadRequest(errorKeys.couponNotFound);

  const now = Date.now();
  if (row.startsAt && row.startsAt.getTime() > now) throw new BadRequest(errorKeys.couponInvalid);
  if (row.endsAt && row.endsAt.getTime() < now) throw new BadRequest(errorKeys.couponInvalid);
  if (row.usageLimit != null && row.usedCount >= row.usageLimit) {
    throw new BadRequest(errorKeys.couponInvalid);
  }
  return row;
}

export async function listCoupons(query?: CouponListQuery) {
  const where: WhereOptions<CouponAttributes> = {
    ...(query?.q ? { code: { [Op.iLike]: searchPattern(query.q) } } : {}),
    ...(query?.type ? { type: query.type } : {}),
    ...(query?.isActive !== undefined ? { isActive: query.isActive } : {}),
  };
  const order: ModelOrder<CouponAttributes> = [
    [query?.sortBy ?? 'createdAt', query?.sortOrder === 'asc' ? 'ASC' : 'DESC'],
    ['id', 'ASC'],
  ];

  if (!query) return { data: (await CouponModel.findAll({ where, order })).map(toCoupon) };

  const { rows, count } = await CouponModel.findAndCountAll({
    where,
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });
  return { data: rows.map(toCoupon), meta: buildPaginationMeta(query.page, query.pageSize, count) };
}

export async function createCoupon(input: CouponInput) {
  return auditedTransaction(async (transaction) => {
    const row = await CouponModel.create(
      {
        code: input.code.trim().toUpperCase(),
        type: input.type,
        value: input.value,
        minOrderAmount: input.minOrderAmount ?? 0,
        maxDiscount: input.maxDiscount ?? null,
        usageLimit: input.usageLimit ?? null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        isActive: input.isActive ?? true,
        perUserLimit: input.perUserLimit ?? null,
        variantIds: input.variantIds ?? [],
        categoryIds: input.categoryIds ?? [],
      },
      { transaction },
    );
    await recordAudit(
      {
        actorId: requestStore.getStore()?.user?.id,
        action: 'coupon.created',
        resourceType: 'coupon',
        resourceId: row.id,
      },
      transaction,
    );
    return toCoupon(row);
  });
}

export async function updateCoupon(id: string, input: CouponInput) {
  return auditedTransaction(async (transaction) => {
    const row = await CouponModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new NotFound(errorKeys.couponNotFound);
    if (input.expectedVersion === undefined) throw new BadRequest('expected_version_required');
    assertVersion(row.version, input.expectedVersion);
    if (
      input.usageLimit !== null &&
      input.usageLimit !== undefined &&
      input.usageLimit < row.usedCount
    )
      throw new BadRequest('coupon_limit_below_usage');
    await row.update(
      {
        code: input.code.trim().toUpperCase(),
        type: input.type,
        value: input.value,
        minOrderAmount: input.minOrderAmount ?? 0,
        maxDiscount: input.maxDiscount ?? null,
        usageLimit: input.usageLimit ?? null,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        isActive: input.isActive ?? true,
        perUserLimit: input.perUserLimit ?? null,
        variantIds: input.variantIds ?? [],
        categoryIds: input.categoryIds ?? [],
        version: row.version + 1,
      },
      { transaction },
    );
    await recordAudit(
      {
        actorId: requestStore.getStore()?.user?.id,
        action: 'coupon.updated',
        resourceType: 'coupon',
        resourceId: row.id,
      },
      transaction,
    );
    return toCoupon(row);
  });
}

export async function deleteCoupon(id: string) {
  return auditedTransaction(async (transaction) => {
    const row = await CouponModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new NotFound(errorKeys.couponNotFound);
    await row.update({ isActive: false, version: row.version + 1 }, { transaction });
    await recordAudit(
      {
        actorId: requestStore.getStore()?.user?.id,
        action: 'coupon.disabled',
        resourceType: 'coupon',
        resourceId: row.id,
      },
      transaction,
    );
    return toCoupon(row);
  });
}

export async function previewCoupon(code: string, subtotal: number) {
  const row = await findValidCouponByCode(code);
  const discountAmount = computeDiscount(row, subtotal);
  return { coupon: toCoupon(row), discountAmount };
}
