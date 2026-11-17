import type { DashboardStats, Product } from '@p4/shared';
import { Op } from 'sequelize';
import { LOW_STOCK_THRESHOLD } from '@/constants/index.js';
import { OrderModel, ProductModel } from '@/sequelize/models/index.js';
import { productDto, productInclude } from '../products/products.service.js';

export async function getStats(): Promise<DashboardStats> {
  const orders = await OrderModel.findAll({
    attributes: ['total'],
    where: { status: { [Op.in]: ['paid', 'shipping', 'completed'] } },
  });
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const lowStockRows = await ProductModel.findAll({
    where: { stock: { [Op.lte]: LOW_STOCK_THRESHOLD } },
    include: productInclude,
  });
  const lowStockProducts: Product[] = lowStockRows.map(productDto);
  return {
    totalRevenue,
    orderCount: orders.length,
    lowStockProducts,
  };
}
