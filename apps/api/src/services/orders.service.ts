import type { Order, OrderItem, User } from '@p4/shared';
import { errorKeys } from '@/constants/index.js';
import { sequelize } from '@/sequelize/index.js';
import { OrderItemModel, OrderModel, ProductModel } from '@/sequelize/models/index.js';
import { BadRequest } from '@/utils/errors/index.js';
import { paginateSlice } from '@/utils/pagination.js';

export type CheckoutItem = { productId: string; quantity: number };

function toOrder(row: OrderModel, items: OrderItemModel[]): Order {
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    total: row.total,
    createdAt: row.createdAt.toISOString(),
    items: items.map(
      (i): OrderItem => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }),
    ),
  };
}

export async function listOrders(opts: { page: number; pageSize: number; q: string }) {
  const q = opts.q.trim();

  const rows = await OrderModel.findAll({
    include: [{ model: OrderItemModel, as: 'items' }],
    order: [['createdAt', 'DESC']],
  });

  let orders = rows.map((row) => {
    const items = (row as OrderModel & { items?: OrderItemModel[] }).items ?? [];
    return toOrder(row, items);
  });

  if (q) {
    const needle = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.userEmail.toLowerCase().includes(needle) ||
        o.id.toLowerCase().includes(needle) ||
        o.items.some((i) => i.productName.toLowerCase().includes(needle)),
    );
  }

  return paginateSlice(orders, opts.page, opts.pageSize);
}

export async function createOrder(user: User, items: CheckoutItem[]) {
  return sequelize.transaction(async (transaction) => {
    const orderItems: OrderItem[] = [];
    let total = 0;

    for (const item of items) {
      const product = await ProductModel.findByPk(item.productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!product) {
        throw new BadRequest(errorKeys.productNotFound);
      }
      if (item.quantity <= 0) {
        throw new BadRequest(errorKeys.invalidQuantity);
      }
      if (product.stock < item.quantity) {
        throw new BadRequest(errorKeys.invalidQuantity);
      }
      await product.update({ stock: product.stock - item.quantity }, { transaction });
      const lineTotal = product.price * item.quantity;
      total += lineTotal;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    const order = await OrderModel.create(
      {
        userId: user.id,
        userEmail: user.email,
        total,
      },
      { transaction },
    );

    const createdItems = await OrderItemModel.bulkCreate(
      orderItems.map((i) => ({
        orderId: order.id,
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      { transaction },
    );

    return toOrder(order, createdItems);
  });
}
