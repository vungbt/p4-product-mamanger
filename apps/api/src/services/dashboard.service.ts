import type { DashboardStats, Product } from '@p4/shared';
import { Op } from 'sequelize';
import { LOW_STOCK_THRESHOLD } from '@/constants/index.js';
import { FileModel, OrderModel, ProductModel } from '@/sequelize/models/index.js';

type ProductWithImage = ProductModel & { image?: FileModel | null };

export async function getStats(): Promise<DashboardStats> {
  const orders = await OrderModel.findAll({ attributes: ['total'] });
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
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description,
    imageId: p.imageId,
    imageUrl: p.image?.url ?? '',
    stock: p.stock,
  }));
  return {
    totalRevenue,
    orderCount: orders.length,
    lowStockProducts,
  };
}
