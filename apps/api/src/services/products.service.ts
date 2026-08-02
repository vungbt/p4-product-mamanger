import { randomUUID } from 'node:crypto';
import type { Product, ProductInput } from '@p4/shared';
import { Op } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import { FileModel, ProductModel } from '@/sequelize/models/index.js';
import { createFromStorageId } from '@/services/files/files.service.js';
import { NotFound } from '@/utils/errors/index.js';
import { paginateSlice } from '@/utils/pagination.js';

type ProductWithImage = ProductModel & { image?: FileModel | null };

const imageInclude = {
  model: FileModel,
  as: 'image' as const,
  attributes: ['id', 'url', 'storageId', 'provider'],
};

function toProduct(row: ProductWithImage): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description,
    imageId: row.imageId,
    imageUrl: row.image?.url ?? '',
    stock: row.stock,
  };
}

async function resolveImageId(imageStorageId?: string, fallback?: string | null) {
  if (!imageStorageId?.trim()) return fallback ?? null;
  const file = await createFromStorageId(imageStorageId);
  return file.id;
}

export async function listProducts(opts: { page: number; pageSize: number; q: string }) {
  const q = opts.q.trim();
  const where = q
    ? {
        [Op.or]: [{ name: { [Op.iLike]: `%${q}%` } }, { description: { [Op.iLike]: `%${q}%` } }],
      }
    : undefined;

  const rows = (await ProductModel.findAll({
    where,
    include: [imageInclude],
    order: [['createdAt', 'ASC']],
  })) as ProductWithImage[];
  const products = rows.map(toProduct);
  return paginateSlice(products, opts.page, opts.pageSize);
}

export async function getProductById(id: string) {
  const row = (await ProductModel.findByPk(id, {
    include: [imageInclude],
  })) as ProductWithImage | null;
  if (!row) {
    throw new NotFound(errorKeys.productNotFound);
  }
  return toProduct(row);
}

export async function createProduct(input: ProductInput) {
  const imageId = await resolveImageId(input.imageStorageId);
  const row = await ProductModel.create({
    id: randomUUID(),
    name: input.name,
    price: input.price,
    description: input.description ?? '',
    imageId,
    stock: input.stock,
  });
  return getProductById(row.id);
}

export async function updateProduct(id: string, body: Partial<ProductInput>) {
  const row = await ProductModel.findByPk(id);
  if (!row) {
    throw new NotFound(errorKeys.productNotFound);
  }

  const imageId =
    body.imageStorageId != null
      ? await resolveImageId(body.imageStorageId, row.imageId)
      : row.imageId;

  await row.update({
    name: body.name != null ? String(body.name) : row.name,
    price: body.price != null ? Number(body.price) : row.price,
    description: body.description != null ? String(body.description) : row.description,
    imageId,
    stock: body.stock != null ? Number(body.stock) : row.stock,
  });
  return getProductById(id);
}

export async function deleteProduct(id: string) {
  const product = await getProductById(id);
  await ProductModel.destroy({ where: { id } });
  return product;
}
