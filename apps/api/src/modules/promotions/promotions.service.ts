import { randomUUID } from 'node:crypto';
import { BaseError } from '@p4/server-core';
import type { DiscountLine, DiscountResult, Promotion } from '@p4/shared';
import { Op, type Transaction } from 'sequelize';
import { CouponModel, CouponRedemptionModel, PromotionModel } from '@/sequelize/models/index.js';
import { selectFields } from '@/utils/select-fields.js';

export function promotionDto(row: PromotionModel): Promotion {
  return {
    ...selectFields(row, [
      'id',
      'name',
      'type',
      'value',
      'minOrderAmount',
      'maxDiscount',
      'variantIds',
      'categoryIds',
      'priority',
      'isActive',
      'version',
    ]),
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
  };
}

export function allocateDiscount(amount: number, weights: number[]) {
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (
    !Number.isSafeInteger(amount) ||
    amount < 0 ||
    amount > total ||
    weights.some((v) => !Number.isSafeInteger(v) || v < 0)
  )
    throw new BaseError('invalid_discount_allocation');
  if (!amount || !total) return weights.map(() => 0);
  const rows = weights.map((weight, index) => {
    const product = BigInt(amount) * BigInt(weight);
    return { index, value: Number(product / BigInt(total)), remainder: product % BigInt(total) };
  });
  let remainder = amount - rows.reduce((sum, row) => sum + row.value, 0);
  for (const row of [...rows].sort((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  )) {
    if (remainder-- <= 0) break;
    row.value++;
  }
  return rows.map((row) => row.value);
}

type Rule = Pick<
  PromotionModel,
  'type' | 'value' | 'minOrderAmount' | 'maxDiscount' | 'variantIds' | 'categoryIds'
>;
function calculate(rule: Rule, lines: DiscountLine[]) {
  const weights = lines.map((line) =>
    (!rule.variantIds.length && !rule.categoryIds.length) ||
    rule.variantIds.includes(line.variantId) ||
    (line.categoryId !== null && rule.categoryIds.includes(line.categoryId))
      ? line.quantity * line.unitPrice
      : 0,
  );
  const subtotal = weights.reduce((sum, value) => sum + value, 0);
  if (subtotal < rule.minOrderAmount) return { amount: 0, allocations: weights.map(() => 0) };
  const discount = rule.type === 'percent' ? Math.floor((subtotal * rule.value) / 100) : rule.value;
  const amount = Math.max(0, Math.min(subtotal, discount, rule.maxDiscount ?? subtotal));
  return { amount, allocations: allocateDiscount(amount, weights) };
}

export async function calculateDiscount(
  userId: string,
  lines: DiscountLine[],
  code?: string,
  transaction?: Transaction,
): Promise<DiscountResult> {
  const now = new Date();
  if (code?.trim()) {
    const row = await CouponModel.findOne({
      where: { code: code.trim().toUpperCase(), isActive: true },
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });
    if (
      !row ||
      (row.startsAt && row.startsAt > now) ||
      (row.endsAt && row.endsAt <= now) ||
      (row.usageLimit !== null && row.usedCount >= row.usageLimit)
    )
      throw new BaseError('coupon_unavailable', 409, 'coupon_unavailable', {
        couponCode: ['Coupon is unavailable.'],
      });
    if (row.perUserLimit !== null) {
      const used = await CouponRedemptionModel.count({
        where: { couponId: row.id, userId, status: { [Op.in]: ['reserved', 'committed'] } },
        transaction,
      });
      if (used >= row.perUserLimit)
        throw new BaseError('coupon_user_limit', 409, 'coupon_user_limit', {
          couponCode: ['Coupon usage limit reached.'],
        });
    }
    const result = calculate(row, lines);
    if (!result.amount)
      throw new BaseError('coupon_not_applicable', 409, 'coupon_not_applicable', {
        couponCode: ['Coupon does not apply to these items.'],
      });
    return {
      ...result,
      couponId: row.id,
      promotionId: null,
      code: row.code,
      ruleVersion: row.version,
    };
  }
  // Explicit coupon replaces automatic promotion. Without a code, select one best offer;
  // priority and ID break ties deterministically. Discounts never stack implicitly.
  const promotions = await PromotionModel.findAll({
    where: {
      isActive: true,
      [Op.and]: [
        { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
        { [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gt]: now } }] },
      ],
    },
    transaction,
    order: [
      ['priority', 'DESC'],
      ['id', 'ASC'],
    ],
  });
  let result: DiscountResult = {
    amount: 0,
    allocations: lines.map(() => 0),
    couponId: null,
    promotionId: null,
    code: null,
    ruleVersion: null,
  };
  for (const row of promotions) {
    const candidate = calculate(row, lines);
    if (candidate.amount > result.amount)
      result = {
        ...candidate,
        couponId: null,
        promotionId: row.id,
        code: null,
        ruleVersion: row.version,
      };
  }
  return result;
}

export async function reserveCoupon(
  userId: string,
  orderId: string,
  discount: DiscountResult,
  transaction: Transaction,
) {
  if (!discount.couponId || discount.ruleVersion === null) return;
  const row = await CouponModel.findByPk(discount.couponId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (
    !row ||
    row.version !== discount.ruleVersion ||
    (row.usageLimit !== null && row.usedCount >= row.usageLimit)
  )
    throw new BaseError('coupon_unavailable', 409, 'coupon_unavailable');
  await CouponRedemptionModel.create(
    {
      id: randomUUID(),
      userId,
      orderId,
      couponId: row.id,
      status: 'reserved',
      amount: discount.amount,
      ruleVersion: row.version,
    },
    { transaction },
  );
  await row.update({ usedCount: row.usedCount + 1 }, { transaction });
}

export async function settleCoupon(
  orderId: string,
  status: 'committed' | 'released',
  transaction: Transaction,
) {
  const pointer = await CouponRedemptionModel.findOne({ where: { orderId }, transaction });
  if (!pointer) return;
  const coupon = await CouponModel.findByPk(pointer.couponId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const row = await CouponRedemptionModel.findByPk(pointer.id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!coupon || !row || row.status !== 'reserved') return;
  await row.update({ status }, { transaction });
  if (status === 'released')
    await coupon.update({ usedCount: Math.max(0, coupon.usedCount - 1) }, { transaction });
}
