import {
  buildPaginationMeta,
  dateRange,
  Forbidden,
  NotFound,
  numberRange,
  searchPattern,
} from '@p4/server-core';
import type { Order, OrderItem, OrderListQuery, Payment, Shipment, User } from '@p4/shared';
import { cast, col, literal, Op, type WhereOptions, where } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import { sequelize } from '@/sequelize/index.js';
import {
  OrderCouponModel,
  OrderItemModel,
  OrderModel,
  PaymentModel,
  ShipmentModel,
} from '@/sequelize/models/index.js';
import type { OrderAttributes } from '@/sequelize/models/order.model.js';
import type { ModelOrder } from '@/types/database.js';
import { selectFields } from '@/utils/select-fields.js';

type OrderEager = OrderModel & {
  items?: OrderItemModel[];
  payment?: PaymentModel | null;
  shipments?: ShipmentModel[];
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
      checkoutUrl = undefined;
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
  'lifecycleStatus',
  'version',
  'currency',
  'snapshot',
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
    items: items.map(
      (item): OrderItem =>
        selectFields(item, [
          'id',
          'variantId',
          ...orderItemFields,
          'sku',
          'size',
          'color',
          'imageUrl',
          'discountAmount',
          'lineTotal',
          'cancelledQuantity',
          'fulfilledQuantity',
          'returnedQuantity',
        ]),
    ),
    payment: row.payment ? toPayment(row.payment) : null,
    shipment: row.shipments?.[0] ? toShipment(row.shipments[0]) : null,
    coupon: row.orderCoupon
      ? selectFields(row.orderCoupon, ['code', 'discountAmount', 'couponId'])
      : null,
  };
}

const orderInclude = [
  { model: OrderItemModel, as: 'items' as const },
  { model: PaymentModel, as: 'payment' as const },
  { model: ShipmentModel, as: 'shipments' as const, separate: true },
  { model: OrderCouponModel, as: 'orderCoupon' as const },
];

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
        as: 'shipments',
        ...(query.shipmentStatus
          ? { where: { status: query.shipmentStatus }, required: true }
          : { separate: true }),
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
  if (user && !canAccessRecord(user, 'read', 'Order', row)) {
    throw new Forbidden(errorKeys.forbidden);
  }
  return toOrder(row);
}
