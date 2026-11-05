import type { DashboardStats, Product } from '@p4/shared';
import { Op } from 'sequelize';
import { LOW_STOCK_THRESHOLD } from '@/constants/index.js';
import { FileModel, OrderModel, ProductModel } from '@/sequelize/models/index.js';
import { selectFields } from '@/utils/select-fields.js';

type ProductWithImage = ProductModel & { image?: FileModel | null };

export async function getStats(): Promise<DashboardStats> {
  const orders = await OrderModel.findAll({
    attributes: ['total'],
    where: { status: { [Op.in]: ['paid', 'shipping', 'completed'] } },
  });
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const lowStockRows = (await ProductModel.findAll({
    where: { stock: { [Op.lte]: LOW_STOCK_THRESHOLD } },
    include: [
      {
        model: FileModel,
        as: 'image',
        attributes: ['id', 'url'],
      },
    ],
  })) as ProductWithImage[];
  const lowStockProducts: Product[] = lowStockRows.map((p) => ({
    ...selectFields(p, ['id', 'name', 'price', 'description', 'imageId', 'stock']),
    imageUrl: p.image?.url ?? '',
  }));
  return {
    totalRevenue,
    orderCount: orders.length,
    lowStockProducts,
  };
}
