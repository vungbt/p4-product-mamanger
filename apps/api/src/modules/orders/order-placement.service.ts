import { randomUUID } from 'node:crypto';
import { BaseError, NotFound } from '@p4/server-core';
import type { CheckoutQuoteInput, User } from '@p4/shared';
import type { Transaction } from 'sequelize';
import {
  CheckoutQuoteModel,
  InventoryReservationModel,
  OrderCouponModel,
  OrderEventModel,
  OrderItemModel,
  OrderModel,
  ProductModel,
  ProductVariantModel,
} from '@/sequelize/models/index.js';
import { recordAudit } from '@/shared/audit/audited-command.js';
import { enqueueEvent, jsonValue, runIdempotent } from '@/shared/commerce/persistence.js';
import { selectFields } from '@/utils/select-fields.js';
import { buildQuoteSnapshot, quoteFingerprint } from '../checkout/checkout.service.js';
import { moveInventory } from '../inventory/inventory.service.js';
import { reserveCoupon } from '../promotions/promotions.service.js';
import { settings } from '../settings/settings.service.js';
import { getOrderById } from './orders.service.js';

async function placeQuote(user: User, quoteId: string, transaction: Transaction) {
  const quote = await CheckoutQuoteModel.findOne({
    where: { id: quoteId, userId: user.id },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!quote) throw new NotFound();
  if (quote.status !== 'active' || quote.expiresAt.getTime() <= Date.now())
    throw new BaseError('quote_expired_or_consumed', 409, 'quote_expired_or_consumed');
  const snapshot = quote.snapshot;
  const productIds = [...new Set(snapshot.items.map((item) => item.productId))].sort();
  for (const id of productIds)
    await ProductModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  for (const id of snapshot.items.map((item) => item.variantId).sort())
    await ProductVariantModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  const current = await buildQuoteSnapshot(
    user.id,
    {
      items: snapshot.items.map((item) => selectFields(item, ['variantId', 'quantity'])),
      addressId: snapshot.addressId ?? undefined,
      shippingAddress: snapshot.shippingAddress,
      shippingMethodId: snapshot.shipping.methodId,
      couponCode: snapshot.discount.code ?? undefined,
    },
    transaction,
  );
  if (quoteFingerprint(current) !== quote.fingerprint)
    throw new BaseError('quote_changed', 409, 'quote_changed', {
      quoteId: ['Prices or checkout policies changed. Request a new quote.'],
    });
  const order = await OrderModel.create(
    {
      userId: user.id,
      userEmail: user.email,
      status: 'pending',
      lifecycleStatus: 'pending_confirmation',
      currency: snapshot.currency,
      quoteId: quote.id,
      snapshot,
      addressId: snapshot.addressId,
      shippingFullName: snapshot.shippingAddress.fullName,
      shippingPhone: snapshot.shippingAddress.phone,
      shippingLine1: snapshot.shippingAddress.line1,
      shippingCity: snapshot.shippingAddress.city,
      subtotal: snapshot.subtotal,
      discountAmount: snapshot.discountAmount,
      shippingFee: snapshot.shippingFee,
      total: snapshot.total,
    },
    { transaction },
  );
  for (const item of [...snapshot.items].sort(
    (a, b) => a.productId.localeCompare(b.productId) || a.variantId.localeCompare(b.variantId),
  )) {
    await moveInventory(
      {
        variantId: item.variantId,
        kind: 'reserve',
        quantity: item.quantity,
        actorId: user.id,
        reason: 'Order placement',
        reference: `order:${order.id}`,
      },
      transaction,
    );
    await OrderItemModel.create(
      {
        orderId: order.id,
        ...selectFields(item, [
          'productId',
          'productName',
          'variantId',
          'quantity',
          'unitPrice',
          'sku',
          'size',
          'color',
          'imageUrl',
          'discountAmount',
          'lineTotal',
        ]),
      },
      { transaction },
    );
    await InventoryReservationModel.create(
      {
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        status: 'reserved',
        expiresAt: new Date(Date.now() + snapshot.reservationTtlSeconds * 1000),
      },
      { transaction },
    );
  }
  await reserveCoupon(user.id, order.id, snapshot.discount, transaction);
  if (snapshot.discount.couponId && snapshot.discount.code)
    await OrderCouponModel.create(
      {
        orderId: order.id,
        couponId: snapshot.discount.couponId,
        code: snapshot.discount.code,
        discountAmount: snapshot.discountAmount,
      },
      { transaction },
    );
  await quote.update({ status: 'consumed', orderId: order.id }, { transaction });
  await OrderEventModel.create(
    {
      id: randomUUID(),
      orderId: order.id,
      actorId: user.id,
      type: 'order.placed',
      detail: { total: order.total, currency: order.currency },
      public: true,
    },
    { transaction },
  );
  await recordAudit(
    {
      actorId: user.id,
      action: 'order.placed',
      resourceType: 'order',
      resourceId: order.id,
      changes: { total: order.total, quoteId },
    },
    transaction,
  );
  await enqueueEvent(
    {
      type: 'order.placed',
      aggregateType: 'order',
      aggregateId: order.id,
      payload: { orderId: order.id, userId: user.id },
    },
    transaction,
  );
  return { orderId: order.id };
}

function resultOrderId(result: import('@p4/shared').JsonValue) {
  if (
    !result ||
    typeof result !== 'object' ||
    Array.isArray(result) ||
    typeof result.orderId !== 'string'
  )
    throw new Error('Invalid order idempotency result.');
  return result.orderId;
}

export async function placeOrder(user: User, quoteId: string, key: string) {
  const result = await runIdempotent(
    { scope: 'order.place', actorId: user.id, key, payload: { quoteId } },
    async (transaction) => placeQuote(user, quoteId, transaction),
  );
  return {
    order: await getOrderById(resultOrderId(result.result), user),
    replayed: result.replayed,
  };
}

export async function placeLegacyOrder(user: User, input: CheckoutQuoteInput, key: string) {
  const result = await runIdempotent(
    { scope: 'order.place_legacy', actorId: user.id, key, payload: jsonValue(input) },
    async (transaction) => {
      const snapshot = await buildQuoteSnapshot(user.id, input, transaction);
      const config = await settings(transaction);
      const quote = await CheckoutQuoteModel.create(
        {
          id: randomUUID(),
          userId: user.id,
          status: 'active',
          snapshot,
          fingerprint: quoteFingerprint(snapshot),
          expiresAt: new Date(Date.now() + config.quoteTtlSeconds * 1000),
          orderId: null,
        },
        { transaction },
      );
      return placeQuote(user, quote.id, transaction);
    },
  );
  return getOrderById(resultOrderId(result.result), user);
}
