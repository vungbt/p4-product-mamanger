import type { Coupon, CouponInput } from '@p4/shared';
import type { Transaction } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import { CouponModel } from '@/sequelize/models/index.js';
import { BadRequest, NotFound } from '@/utils/errors/index.js';

function toCoupon(row: CouponModel): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    minOrderAmount: row.minOrderAmount,
    maxDiscount: row.maxDiscount,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    startsAt: row.startsAt ? row.startsAt.toISOString() : null,
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    isActive: row.isActive,
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

export async function listCoupons() {
  const rows = await CouponModel.findAll({ order: [['createdAt', 'DESC']] });
  return rows.map(toCoupon);
}

export async function createCoupon(input: CouponInput) {
  const row = await CouponModel.create({
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value: input.value,
    minOrderAmount: input.minOrderAmount ?? 0,
    maxDiscount: input.maxDiscount ?? null,
    usageLimit: input.usageLimit ?? null,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    isActive: input.isActive ?? true,
  });
  return toCoupon(row);
}

export async function updateCoupon(id: string, input: Partial<CouponInput>) {
  const row = await CouponModel.findByPk(id);
  if (!row) throw new NotFound(errorKeys.couponNotFound);
  await row.update({
    code: input.code != null ? input.code.trim().toUpperCase() : row.code,
    type: input.type ?? row.type,
    value: input.value ?? row.value,
    minOrderAmount: input.minOrderAmount ?? row.minOrderAmount,
    maxDiscount: input.maxDiscount !== undefined ? input.maxDiscount : row.maxDiscount,
    usageLimit: input.usageLimit !== undefined ? input.usageLimit : row.usageLimit,
    startsAt:
      input.startsAt !== undefined
        ? input.startsAt
          ? new Date(input.startsAt)
          : null
        : row.startsAt,
    endsAt:
      input.endsAt !== undefined ? (input.endsAt ? new Date(input.endsAt) : null) : row.endsAt,
    isActive: input.isActive ?? row.isActive,
  });
  return toCoupon(row);
}

export async function deleteCoupon(id: string) {
  const row = await CouponModel.findByPk(id);
  if (!row) throw new NotFound(errorKeys.couponNotFound);
  const data = toCoupon(row);
  await row.destroy();
  return data;
}

export async function previewCoupon(code: string, subtotal: number) {
  const row = await findValidCouponByCode(code);
  const discountAmount = computeDiscount(row, subtotal);
  return { coupon: toCoupon(row), discountAmount };
}
