import { randomUUID } from 'node:crypto';
import type {
  Order,
  OrderCouponInfo,
  OrderItem,
  Payment,
  Shipment,
  ShippingAddressInput,
  User,
} from '@p4/shared';
import { env } from '@/configs/env.js';
import { errorKeys } from '@/constants/index.js';
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
import { getAddressForUser } from '@/services/addresses.service.js';
import { computeDiscount, findValidCouponByCode } from '@/services/coupons.service.js';
import { BadRequest, Forbidden, NotFound } from '@/utils/errors/index.js';
import { paginateSlice } from '@/utils/pagination.js';

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

function toPayment(row: PaymentModel): Payment {
  return {
    id: row.id,
    orderId: row.orderId,
    provider: row.provider,
    amount: row.amount,
    status: row.status,
    externalId: row.externalId,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    checkoutUrl:
      row.status === 'pending'
        ? `/api/payments/${row.id}/mock-pay?secret=${env.payment.mockSecret}`
        : undefined,
  };
}

function toShipment(row: ShipmentModel): Shipment {
  return {
    id: row.id,
    orderId: row.orderId,
    status: row.status,
    carrier: row.carrier,
    trackingCode: row.trackingCode,
    shippedAt: row.shippedAt ? row.shippedAt.toISOString() : null,
    deliveredAt: row.deliveredAt ? row.deliveredAt.toISOString() : null,
  };
}

function toCouponInfo(row: OrderCouponModel): OrderCouponInfo {
  return {
    code: row.code,
    discountAmount: row.discountAmount,
    couponId: row.couponId,
  };
}

function toOrder(row: OrderEager): Order {
  const items = row.items ?? [];
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    status: row.status,
    subtotal: row.subtotal,
    discountAmount: row.discountAmount,
    shippingFee: row.shippingFee,
    total: row.total,
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
    items: items.map(
      (i): OrderItem => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }),
    ),
    payment: row.payment ? toPayment(row.payment) : null,
    shipment: row.shipment ? toShipment(row.shipment) : null,
    coupon: row.orderCoupon ? toCouponInfo(row.orderCoupon) : null,
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
      shipping: {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        city: address.city,
      },
      shippingFee,
    };
  }

  if (input.shippingAddress) {
    return { addressId: null, shipping: input.shippingAddress, shippingFee };
  }

  throw new BadRequest(errorKeys.addressRequired);
}

export async function listOrders(opts: { page: number; pageSize: number; q: string }) {
  const q = opts.q.trim();
  const rows = (await OrderModel.findAll({
    include: orderInclude,
    order: [['createdAt', 'DESC']],
  })) as OrderEager[];

  let orders = rows.map(toOrder);
  if (q) {
    const needle = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.userEmail.toLowerCase().includes(needle) ||
        o.id.toLowerCase().includes(needle) ||
        o.status.includes(needle) ||
        o.items.some((i) => i.productName.toLowerCase().includes(needle)),
    );
  }
  return paginateSlice(orders, opts.page, opts.pageSize);
}

export async function listMyOrders(userId: string, opts: { page: number; pageSize: number }) {
  const rows = (await OrderModel.findAll({
    where: { userId },
    include: orderInclude,
    order: [['createdAt', 'DESC']],
  })) as OrderEager[];
  return paginateSlice(rows.map(toOrder), opts.page, opts.pageSize);
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

  return sequelize.transaction(async (transaction) => {
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
      orderItems.map((i) => ({
        orderId: order.id,
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      { transaction },
    );

    await InventoryReservationModel.bulkCreate(
      orderItems.map((i) => ({
        orderId: order.id,
        productId: i.productId,
        quantity: i.quantity,
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

    await PaymentModel.create(
      {
        orderId: order.id,
        provider: 'mock',
        amount: total,
        status: 'pending',
        externalId: `mock_${randomUUID()}`,
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

/** Pay → commit reservations (stock already held) + shipment */
export async function confirmMockPayment(paymentId: string, secret: string) {
  if (secret !== env.payment.mockSecret) {
    throw new Forbidden(errorKeys.forbidden);
  }

  return sequelize.transaction(async (transaction) => {
    const payment = await PaymentModel.findByPk(paymentId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!payment) throw new NotFound(errorKeys.paymentNotFound);
    if (payment.status === 'paid') throw new BadRequest(errorKeys.paymentAlreadyPaid);

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
        carrier: 'mock-express',
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
