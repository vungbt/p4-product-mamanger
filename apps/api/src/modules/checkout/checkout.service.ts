import { createHash, randomUUID } from 'node:crypto';
import type {
  CartLineInput,
  CheckoutQuote,
  CheckoutQuoteInput,
  CheckoutQuoteSnapshot,
  QuoteItemSnapshot,
} from '@p4/shared';
import { Transaction } from 'sequelize';
import {
  AddressModel,
  CheckoutQuoteModel,
  FileModel,
  ProductModel,
  ProductVariantModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { jsonValue } from '@/shared/commerce/persistence.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';
import { calculateDiscount } from '../promotions/promotions.service.js';
import { quoteShipping, settings } from '../settings/settings.service.js';

export async function priceLines(
  lines: CartLineInput[],
  transaction?: Transaction,
): Promise<QuoteItemSnapshot[]> {
  const items: QuoteItemSnapshot[] = [];
  let subtotal = 0;
  for (const line of lines) {
    const variant = await ProductVariantModel.findByPk(line.variantId, { transaction });
    const product = variant
      ? await ProductModel.findByPk(variant.productId, { transaction })
      : null;
    if (variant?.status !== 'active' || !product || product.status !== 'active')
      throw new BaseError('variant_unavailable', 409, 'variant_unavailable', {
        items: ['An item is no longer for sale.'],
      });
    if (line.quantity > variant.onHand - variant.reserved)
      throw new BaseError('insufficient_inventory', 409, 'insufficient_inventory', {
        items: ['An item has insufficient stock.'],
      });
    const lineTotal = variant.price * line.quantity;
    subtotal += lineTotal;
    if (!Number.isSafeInteger(subtotal) || subtotal > 2_147_483_647)
      throw new BaseError('amount_too_large');
    const coverId = variant.imageIds[0] ?? product.imageId;
    const cover = coverId ? await FileModel.findByPk(coverId, { transaction }) : null;
    items.push({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      categoryId: product.categoryId,
      unitPrice: variant.price,
      quantity: line.quantity,
      imageUrl: cover?.url ?? '',
      discountAmount: 0,
      lineTotal,
    });
  }
  return items;
}

export async function buildQuoteSnapshot(
  userId: string,
  input: CheckoutQuoteInput,
  transaction: Transaction,
): Promise<CheckoutQuoteSnapshot> {
  const items = await priceLines(input.items, transaction);
  const config = await settings(transaction);
  let addressId: string | null = null;
  let shippingAddress = input.shippingAddress;
  if (input.addressId) {
    const address = await AddressModel.findOne({
      where: { id: input.addressId, userId },
      transaction,
    });
    if (!address) throw new NotFound('address_not_found');
    addressId = address.id;
    shippingAddress = selectFields(address, ['fullName', 'phone', 'line1', 'city']);
  }
  if (!shippingAddress) throw new BaseError('address_required');
  const discount = await calculateDiscount(userId, items, input.couponCode, transaction);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shipping = (
    await quoteShipping(
      shippingAddress.city,
      subtotal - discount.amount,
      input.shippingMethodId,
      transaction,
    )
  )[0];
  if (!shipping) throw new BaseError('shipping_zone_unsupported');
  const total = subtotal - discount.amount + shipping.fee;
  if (!Number.isSafeInteger(total) || total > 2_147_483_647)
    throw new BaseError('amount_too_large');
  return {
    items: items.map((item, index) => ({
      ...item,
      discountAmount: discount.allocations[index] ?? 0,
      lineTotal: item.lineTotal - (discount.allocations[index] ?? 0),
    })),
    addressId,
    shippingAddress,
    shipping,
    discount,
    subtotal,
    discountAmount: discount.amount,
    shippingFee: shipping.fee,
    total,
    currency: config.currency,
    policyVersion: config.version,
    reservationTtlSeconds: config.reservationTtlSeconds,
    returnWindowDays: config.returnWindowDays,
  };
}

export function quoteFingerprint(snapshot: CheckoutQuoteSnapshot) {
  return createHash('sha256')
    .update(JSON.stringify(jsonValue(snapshot)))
    .digest('hex');
}

export function quoteDto(row: CheckoutQuoteModel): CheckoutQuote {
  return {
    ...row.snapshot,
    id: row.id,
    status:
      row.status === 'active' && row.expiresAt.getTime() <= Date.now() ? 'expired' : row.status,
    expiresAt: row.expiresAt.toISOString(),
  };
}

export async function createQuote(userId: string, input: CheckoutQuoteInput) {
  return auditedTransaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (transaction) => {
      const snapshot = await buildQuoteSnapshot(userId, input, transaction);
      const config = await settings(transaction);
      const row = await CheckoutQuoteModel.create(
        {
          id: randomUUID(),
          userId,
          snapshot,
          fingerprint: quoteFingerprint(snapshot),
          status: 'active',
          expiresAt: new Date(Date.now() + config.quoteTtlSeconds * 1000),
          orderId: null,
        },
        { transaction },
      );
      return quoteDto(row);
    },
  );
}

export async function getQuote(userId: string, id: string) {
  const row = await CheckoutQuoteModel.findOne({ where: { id, userId } });
  if (!row) throw new NotFound();
  return quoteDto(row);
}
