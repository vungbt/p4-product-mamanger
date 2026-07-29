import type { DashboardStats } from '@p4/shared';
import { Router } from 'express';
import { LOW_STOCK_THRESHOLD, orders, products } from '../data/store.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authRequired, requireRole('admin'), (_req: AuthedRequest, res) => {
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const lowStockProducts = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);
  const stats: DashboardStats = {
    totalRevenue,
    orderCount: orders.length,
    lowStockProducts,
  };
  res.json(stats);
});

export default router;
