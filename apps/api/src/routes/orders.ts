import type { Order, OrderItem } from '@p4/shared';
import { Router } from 'express';
import { createId, orders, products } from '../data/store.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

/** Admin — xem tất cả orders */
router.get('/', authRequired, requireRole('admin'), (_req, res) => {
  res.json(orders);
});

/** User — checkout */
router.post('/', authRequired, requireRole('user'), (req: AuthedRequest, res) => {
  const { items } = req.body as { items?: { productId: string; quantity: number }[] };
  if (!items?.length) {
    return res.status(400).json({ message: 'items required' });
  }

  const orderItems: OrderItem[] = [];
  let total = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ message: `Product not found: ${item.productId}` });
    }
    if (item.quantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock: ${product.name}` });
    }
    product.stock -= item.quantity;
    const lineTotal = product.price * item.quantity;
    total += lineTotal;
    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    });
  }

  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const order: Order = {
    id: createId(),
    userId: user.id,
    userEmail: user.email,
    items: orderItems,
    total,
    createdAt: new Date().toISOString(),
  };
  orders.unshift(order);
  return res.status(201).json(order);
});

export default router;
