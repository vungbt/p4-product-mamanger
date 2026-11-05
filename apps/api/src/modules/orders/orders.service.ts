import { randomUUID } from 'node:crypto';
import type {
  Order,
  OrderItem,
  OrderListQuery,
  Payment,
  Shipment,
  ShippingAddressInput,
  User,
} from '@p4/shared';
import { cast, col, literal, Op, type WhereOptions, where } from 'sequelize';
import { env } from '@/configs/env.js';
import { errorKeys } from '@/constants/index.js';
import { getAddressForUser } from '@/modules/addresses/addresses.service.js';
import { computeDiscount, findValidCouponByCode } from '@/modules/coupons/coupons.service.js';
import { createCheckoutSession } from '@/modules/payments/stripe.service.js';
import { sequelize } from '@/sequelize/index.js';
import {
  InventoryReservationModel,
  OrderCouponModel,
  OrderItemModel,
  OrderModel,
  PaymentModel,
  ProductModel,
  ShipmentModel,
} from '@/sequelize/models/index.js';
import type { OrderAttributes } from '@/sequelize/models/order.model.js';
import { dateRange, numberRange, searchPattern } from '@/shared/list-filters.js';
import type { ModelOrder } from '@/types/database.js';
import { BadRequest, Forbidden, NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';

export type CheckoutItem = { productId: string; quantity: number };

export type CheckoutInput = {
  items: CheckoutItem[];
  addressId?: string;
  shippingAddress?: ShippingAddressInput;
  shippingFee?: number;
  couponCode?: string;
};

type OrderEager = OrderModel & {
  items?: OrderItemModel[];
  payment?: PaymentModel | null;
  shipment?: ShipmentModel | null;
  orderCoupon?: OrderCouponModel | null;
};

const paymentFields = [
  'id',
  'orderId',
  'provider',
  'amount',
  'status',
  'externalId',
] satisfies (keyof Payment)[];

function toPayment(row: PaymentModel): Payment {
  let checkoutUrl: string | undefined;
  if (row.status === 'pending') {
    if (row.checkoutUrl) {
      checkoutUrl = row.checkoutUrl;
    } else if (row.provider === 'mock') {
      checkoutUrl = `/api/payments/${row.id}/mock-pay?secret=${env.payment.mockSecret}`;
    }
  }
  return {
    ...selectFields(row, paymentFields),
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    checkoutUrl,
  };
}

const shipmentFields = [
  'id',
  'orderId',
  'status',
  'carrier',
  'trackingCode',
] satisfies (keyof Shipment)[];

function toShipment(row: ShipmentModel): Shipment {
  return {
    ...selectFields(row, shipmentFields),
    shippedAt: row.shippedAt ? row.shippedAt.toISOString() : null,
    deliveredAt: row.deliveredAt ? row.deliveredAt.toISOString() : null,
  };
}

const orderItemFields = [
  'productId',
  'productName',
  'quantity',
  'unitPrice',
] satisfies (keyof OrderItem)[];

const orderFields = [
  'id',
  'userId',
  'userEmail',
  'status',
  'subtotal',
  'discountAmount',
  'shippingFee',
  'total',
] satisfies (keyof Order)[];

function toOrder(row: OrderEager): Order {
  const items = row.items ?? [];
  return {
    ...selectFields(row, orderFields),
    createdAt: row.createdAt.toISOString(),
    shippingAddress:
      row.shippingFullName && row.shippingPhone && row.shippingLine1 && row.shippingCity
        ? {
            fullName: row.shippingFullName,
            phone: row.shippingPhone,
            line1: row.shippingLine1,
            city: row.shippingCity,
          }
        : null,
    items: items.map((item): OrderItem => selectFields(item, orderItemFields)),
    payment: row.payment ? toPayment(row.payment) : null,
    shipment: row.shipment ? toShipment(row.shipment) : null,
    coupon: row.orderCoupon
      ? selectFields(row.orderCoupon, ['code', 'discountAmount', 'couponId'])
      : null,
  };
}

const orderInclude = [
  { model: OrderItemModel, as: 'items' as const },
  { model: PaymentModel, as: 'payment' as const },
  { model: ShipmentModel, as: 'shipment' as const },
  { model: OrderCouponModel, as: 'orderCoupon' as const },
];

async function resolveShipping(
  user: User,
  input: CheckoutInput,
): Promise<{
  addressId: string | null;
  shipping: ShippingAddressInput;
  shippingFee: number;
}> {
  const shippingFee =
    input.shippingFee != null ? Number(input.shippingFee) : env.payment.defaultShippingFee;
  if (Number.isNaN(shippingFee) || shippingFee < 0) {
    throw new BadRequest(errorKeys.invalidQuantity);
  }

  if (input.addressId) {
    const address = await getAddressForUser(user.id, input.addressId);
    return {
      addressId: address.id,
      shipping: selectFields(address, ['fullName', 'phone', 'line1', 'city']),
      shippingFee,
    };
  }

  if (input.shippingAddress) {
    return { addressId: null, shipping: input.shippingAddress, shippingFee };
  }

  throw new BadRequest(errorKeys.addressRequired);
}

export async function listOrders(query: OrderListQuery, userId?: string) {
  const conditions: WhereOptions<OrderAttributes>[] = [];

  const order: ModelOrder<OrderAttributes> = [
    [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
    ['id', 'ASC'],
  ];

  if (userId) conditions.push({ userId });
  if (query.status) conditions.push({ status: query.status });
  if (query.minTotal !== undefined || query.maxTotal !== undefined)
    conditions.push({ total: numberRange(query.minTotal, query.maxTotal) });
  if (query.createdFrom || query.createdTo)
    conditions.push({ createdAt: dateRange(query.createdFrom, query.createdTo) });
  if (query.q) {
    const pattern = searchPattern(query.q);
    conditions.push({
      [Op.or]: [
        { userEmail: { [Op.iLike]: pattern } },
        where(cast(col('OrderModel.id'), 'text'), { [Op.iLike]: pattern }),
        where(cast(col('OrderModel.status'), 'text'), { [Op.iLike]: pattern }),
        // Escape the value through the dialect; identifiers are fixed, never client supplied.
        literal(
          `EXISTS (SELECT 1 FROM "order_items" AS "search_item" WHERE "search_item"."order_id" = "OrderModel"."id" AND "search_item"."product_name" ILIKE ${sequelize.escape(pattern)})`,
        ),
      ],
    });
  }

  const { rows, count } = await OrderModel.findAndCountAll({
    where: conditions.length ? { [Op.and]: conditions } : undefined,
    include: [
      { model: OrderItemModel, as: 'items', separate: true },
      {
        model: PaymentModel,
        as: 'payment',
        ...(query.paymentStatus ? { where: { status: query.paymentStatus }, required: true } : {}),
      },
      {
        model: ShipmentModel,
        as: 'shipment',
        ...(query.shipmentStatus
          ? { where: { status: query.shipmentStatus }, required: true }
          : {}),
      },
      { model: OrderCouponModel, as: 'orderCoupon' },
    ],
    distinct: true,
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return { data: rows.map(toOrder), meta: buildPaginationMeta(query.page, query.pageSize, count) };
}

export async function listMyOrders(userId: string, query: OrderListQuery) {
  return listOrders(query, userId);
}

export async function getOrderById(id: string, user?: User) {
  const row = (await OrderModel.findByPk(id, { include: orderInclude })) as OrderEager | null;
  if (!row) throw new NotFound(errorKeys.orderNotFound);
  if (user && user.role !== 'admin' && row.userId !== user.id) {
    throw new Forbidden(errorKeys.forbidden);
  }
  return toOrder(row);
}

/** Pending + reserve stock + optional coupon */
export async function createOrder(user: User, input: CheckoutInput) {
  const { addressId, shipping, shippingFee } = await resolveShipping(user, input);

  const created = await sequelize.transaction(async (transaction) => {
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const product = await ProductModel.findByPk(item.productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!product) throw new BadRequest(errorKeys.productNotFound);
      if (item.quantity <= 0) throw new BadRequest(errorKeys.invalidQuantity);
      if (product.stock < item.quantity) throw new BadRequest(errorKeys.invalidQuantity);

      await product.update({ stock: product.stock - item.quantity }, { transaction });

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    let discountAmount = 0;
    let couponRow = null as Awaited<ReturnType<typeof findValidCouponByCode>> | null;
    if (input.couponCode?.trim()) {
      couponRow = await findValidCouponByCode(input.couponCode, transaction);
      discountAmount = computeDiscount(couponRow, subtotal);
    }

    const total = Math.max(0, subtotal - discountAmount + shippingFee);
    const order = await OrderModel.create(
      {
        userId: user.id,
        userEmail: user.email,
        status: 'pending',
        addressId,
        shippingFullName: shipping.fullName,
        shippingPhone: shipping.phone,
        shippingLine1: shipping.line1,
        shippingCity: shipping.city,
        shippingFee,
        subtotal,
        discountAmount,
        total,
      },
      { transaction },
    );

    await OrderItemModel.bulkCreate(
      orderItems.map((item) => ({
        orderId: order.id,
        ...selectFields(item, orderItemFields),
      })),
      { transaction },
    );

    await InventoryReservationModel.bulkCreate(
      orderItems.map((i) => ({
        orderId: order.id,
        ...selectFields(i, ['productId', 'quantity']),
        status: 'reserved' as const,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      })),
      { transaction },
    );

    if (couponRow) {
      await OrderCouponModel.create(
        {
          orderId: order.id,
          couponId: couponRow.id,
          code: couponRow.code,
          discountAmount,
        },
        { transaction },
      );
      await couponRow.update({ usedCount: couponRow.usedCount + 1 }, { transaction });
    }

    const paymentId = randomUUID();
    const provider = env.payment.provider;

    await PaymentModel.create(
      {
        id: paymentId,
        orderId: order.id,
        provider,
        amount: total,
        status: 'pending',
        externalId: provider === 'mock' ? `mock_${randomUUID()}` : null,
        checkoutUrl:
          provider === 'mock'
            ? `/api/payments/${paymentId}/mock-pay?secret=${env.payment.mockSecret}`
            : null,
      },
      { transaction },
    );

    const full = (await OrderModel.findByPk(order.id, {
      include: orderInclude,
      transaction,
    })) as OrderEager;
    return { order: toOrder(full), paymentId, provider, total };
  });

  if (created.provider === 'stripe') {
    const session = await createCheckoutSession({
      orderId: created.order.id,
      paymentId: created.paymentId,
      amount: created.total,
      currency: env.payment.stripeCurrency,
      description: `Order ${created.order.id}`,
    });
    await PaymentModel.update(
      { externalId: session.sessionId, checkoutUrl: session.url },
      { where: { id: created.paymentId } },
    );
    return getOrderById(created.order.id);
  }

  return created.order;
}

/**
 * Commit reserved stock + mark payment/order paid + create shipment.
 * Idempotent when already paid (returns current order).
 */
export async function confirmPaid(paymentId: string) {
  return sequelize.transaction(async (transaction) => {
    const payment = await PaymentModel.findByPk(paymentId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!payment) throw new NotFound(errorKeys.paymentNotFound);
    if (payment.status === 'paid') {
      const full = (await OrderModel.findByPk(payment.orderId, {
        include: orderInclude,
        transaction,
      })) as OrderEager;
      return toOrder(full);
    }

    const order = await OrderModel.findByPk(payment.orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!order) throw new NotFound(errorKeys.orderNotFound);
    if (order.status !== 'pending') throw new BadRequest(errorKeys.orderNotPayable);

    await InventoryReservationModel.update(
      { status: 'committed' },
      { where: { orderId: order.id, status: 'reserved' }, transaction },
    );

    const now = new Date();
    await payment.update({ status: 'paid', paidAt: now }, { transaction });
    await order.update({ status: 'paid' }, { transaction });
    await ShipmentModel.create(
      {
        orderId: order.id,
        status: 'pending',
        carrier: payment.provider === 'stripe' ? 'stripe' : 'mock-express',
        trackingCode: null,
      },
      { transaction },
    );

    const full = (await OrderModel.findByPk(order.id, {
      include: orderInclude,
      transaction,
    })) as OrderEager;
    return toOrder(full);
  });
}

/** Mock pay → same as confirmPaid after secret check */
export async function confirmMockPayment(paymentId: string, secret: string) {
  if (secret !== env.payment.mockSecret) {
    throw new Forbidden(errorKeys.forbidden);
  }
  return confirmPaid(paymentId);
}

export async function confirmPaidByStripeSession(sessionId: string) {
  const payment = await PaymentModel.findOne({ where: { externalId: sessionId } });
  if (!payment) {
    // Fallback: metadata.paymentId may be used by webhook caller
    throw new NotFound(errorKeys.paymentNotFound);
  }
  return confirmPaid(payment.id);
}

export async function markPaymentFailedByStripeSession(sessionId: string) {
  const payment = await PaymentModel.findOne({ where: { externalId: sessionId } });
  if (!payment || payment.status === 'paid') return;
  await payment.update({ status: 'failed' });
}

export async function cancelOrder(orderId: string, user: User) {
  return sequelize.transaction(async (transaction) => {
    const order = await OrderModel.findByPk(orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!order) throw new NotFound(errorKeys.orderNotFound);
    if (user.role !== 'admin' && order.userId !== user.id) {
      throw new Forbidden(errorKeys.forbidden);
    }
    if (order.status !== 'pending') throw new BadRequest(errorKeys.orderNotCancellable);

    const reservations = await InventoryReservationModel.findAll({
      where: { orderId, status: 'reserved' },
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
    await PaymentModel.update(
      { status: 'failed' },
      { where: { orderId, status: 'pending' }, transaction },
    );

    const full = (await OrderModel.findByPk(orderId, {
      include: orderInclude,
      transaction,
    })) as OrderEager;
    return toOrder(full);
  });
}

export async function updateShipment(
  orderId: string,
  body: { status?: string; carrier?: string; trackingCode?: string },
) {
  const shipment = await ShipmentModel.findOne({ where: { orderId } });
  if (!shipment) throw new NotFound(errorKeys.shipmentNotFound);

  const allowed = ['pending', 'shipped', 'delivered', 'cancelled'] as const;
  if (body.status && !allowed.includes(body.status as (typeof allowed)[number])) {
    throw new BadRequest(errorKeys.invalidShipmentStatus);
  }

  const nextStatus = (body.status as (typeof allowed)[number] | undefined) ?? shipment.status;
  const now = new Date();
  await shipment.update({
    status: nextStatus,
    carrier: body.carrier ?? shipment.carrier,
    trackingCode: body.trackingCode ?? shipment.trackingCode,
    shippedAt: nextStatus === 'shipped' ? (shipment.shippedAt ?? now) : shipment.shippedAt,
    deliveredAt: nextStatus === 'delivered' ? (shipment.deliveredAt ?? now) : shipment.deliveredAt,
  });

  if (nextStatus === 'shipped') {
    await OrderModel.update({ status: 'shipping' }, { where: { id: orderId } });
  }
  if (nextStatus === 'delivered') {
    await OrderModel.update({ status: 'completed' }, { where: { id: orderId } });
  }
  if (nextStatus === 'cancelled') {
    await OrderModel.update({ status: 'cancelled' }, { where: { id: orderId } });
  }

  return getOrderById(orderId);
}
