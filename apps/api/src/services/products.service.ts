import { randomUUID } from 'node:crypto';
import type { Category, Product, ProductImage, ProductInput } from '@p4/shared';
import type { WhereOptions } from 'sequelize';
import { Op } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import {
  CategoryModel,
  FileModel,
  ProductImageModel,
  ProductModel,
} from '@/sequelize/models/index.js';
import { createFromStorageId, deleteFileIfUnreferenced } from '@/services/files/files.service.js';
import { NotFound } from '@/utils/errors/index.js';
import { paginateSlice } from '@/utils/pagination.js';

type GalleryRow = ProductImageModel & { file?: FileModel | null };
type ProductEager = ProductModel & {
  image?: FileModel | null;
  category?: CategoryModel | null;
  gallery?: GalleryRow[];
};

const imageInclude = {
  model: FileModel,
  as: 'image' as const,
  attributes: ['id', 'url', 'storageId', 'provider'],
};

const categoryInclude = {
  model: CategoryModel,
  as: 'category' as const,
  attributes: ['id', 'name', 'slug', 'description'],
};

const galleryInclude = {
  model: ProductImageModel,
  as: 'gallery' as const,
  include: [
    {
      model: FileModel,
      as: 'file',
      attributes: ['id', 'url'],
    },
  ],
};

function toCategory(row: CategoryModel): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  };
}

function toGalleryImage(row: GalleryRow): ProductImage {
  return {
    id: row.id,
    fileId: row.fileId,
    url: row.file?.url ?? '',
    sortOrder: row.sortOrder,
  };
}

function toProduct(row: ProductEager): Product {
  const images = (row.gallery ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toGalleryImage);
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description,
    imageId: row.imageId,
    imageUrl: row.image?.url ?? images[0]?.url ?? '',
    categoryId: row.categoryId,
    category: row.category ? toCategory(row.category) : null,
    images,
    stock: row.stock,
  };
}

const productInclude = [imageInclude, categoryInclude, galleryInclude];

async function resolveImageId(imageStorageId?: string, fallback?: string | null) {
  if (!imageStorageId?.trim()) return fallback ?? null;
  const file = await createFromStorageId(imageStorageId);
  return file.id;
}

export async function listProducts(opts: {
  page: number;
  pageSize: number;
  q: string;
  categoryId?: string;
}) {
  const q = opts.q.trim();
  const where: WhereOptions = {};
  if (q) {
    Object.assign(where, {
      [Op.or]: [{ name: { [Op.iLike]: `%${q}%` } }, { description: { [Op.iLike]: `%${q}%` } }],
    });
  }
  if (opts.categoryId) {
    Object.assign(where, { categoryId: opts.categoryId });
  }

  const rows = (await ProductModel.findAll({
    where: Object.keys(where).length ? where : undefined,
    include: productInclude,
    order: [['createdAt', 'ASC']],
  })) as ProductEager[];
  return paginateSlice(rows.map(toProduct), opts.page, opts.pageSize);
}

export async function getProductById(id: string) {
  const row = (await ProductModel.findByPk(id, {
    include: productInclude,
  })) as ProductEager | null;
  if (!row) throw new NotFound(errorKeys.productNotFound);
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
    categoryId: input.categoryId ?? null,
    stock: input.stock,
  });

  if (imageId) {
    await ProductImageModel.create({
      productId: row.id,
      fileId: imageId,
      sortOrder: 0,
    });
  }

  if (input.imageStorageIds?.length) {
    let order = imageId ? 1 : 0;
    for (const storageId of input.imageStorageIds) {
      const fileId = await resolveImageId(storageId);
      if (!fileId) continue;
      await ProductImageModel.create({
        productId: row.id,
        fileId,
        sortOrder: order++,
      });
      if (!row.imageId) {
        await row.update({ imageId: fileId });
      }
    }
  }

  return getProductById(row.id);
}

export async function updateProduct(id: string, body: Partial<ProductInput>) {
  const row = await ProductModel.findByPk(id);
  if (!row) throw new NotFound(errorKeys.productNotFound);

  const previousImageId = row.imageId;
  const imageId =
    body.imageStorageId != null
      ? await resolveImageId(body.imageStorageId, row.imageId)
      : row.imageId;

  await row.update({
    name: body.name != null ? String(body.name) : row.name,
    price: body.price != null ? Number(body.price) : row.price,
    description: body.description != null ? String(body.description) : row.description,
    imageId,
    categoryId: body.categoryId !== undefined ? body.categoryId : row.categoryId,
    stock: body.stock != null ? Number(body.stock) : row.stock,
  });

  if (body.imageStorageId?.trim() && imageId) {
    const existing = await ProductImageModel.findOne({
      where: { productId: id, fileId: imageId },
    });
    if (!existing) {
      await ProductImageModel.create({ productId: id, fileId: imageId, sortOrder: 0 });
    }
    if (previousImageId && previousImageId !== imageId) {
      // Cover đổi — nếu bản ghi gallery cũ chỉ là cover đơn, có thể orphan
      await deleteFileIfUnreferenced(previousImageId);
    }
  }

  return getProductById(id);
}

export async function addProductImage(
  productId: string,
  input: { imageStorageId: string; sortOrder?: number },
) {
  const product = await ProductModel.findByPk(productId);
  if (!product) throw new NotFound(errorKeys.productNotFound);
  const fileId = await resolveImageId(input.imageStorageId);
  if (!fileId) throw new NotFound(errorKeys.uploadFileRequired);

  const maxOrder = (await ProductImageModel.max('sortOrder', { where: { productId } })) ?? -1;
  const sortOrder = input.sortOrder ?? Number(maxOrder) + 1;

  const row = await ProductImageModel.create({
    productId,
    fileId,
    sortOrder,
  });

  if (!product.imageId) {
    await product.update({ imageId: fileId });
  }

  const full = (await ProductImageModel.findByPk(row.id, {
    include: [{ model: FileModel, as: 'file', attributes: ['id', 'url'] }],
  })) as GalleryRow;
  return toGalleryImage(full);
}

export async function removeProductImage(productId: string, imageRowId: string) {
  const row = await ProductImageModel.findOne({ where: { id: imageRowId, productId } });
  if (!row) throw new NotFound(errorKeys.notFound);
  const fileId = row.fileId;
  const product = await ProductModel.findByPk(productId);
  await row.destroy();
  if (product?.imageId === fileId) {
    const next = await ProductImageModel.findOne({
      where: { productId },
      order: [['sortOrder', 'ASC']],
    });
    await product.update({ imageId: next?.fileId ?? null });
  }
  await deleteFileIfUnreferenced(fileId);
  return { ok: true as const };
}

export async function deleteProduct(id: string) {
  const product = await getProductById(id);
  const gallery = await ProductImageModel.findAll({ where: { productId: id } });
  const fileIds = new Set<string>();
  if (product.imageId) fileIds.add(product.imageId);
  for (const img of gallery) fileIds.add(img.fileId);

  await ProductModel.destroy({ where: { id } });
  // product_images cascade-deleted; now purge orphan files
  for (const fileId of fileIds) {
    await deleteFileIfUnreferenced(fileId);
  }
  return product;
}
