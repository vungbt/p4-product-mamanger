import { randomUUID } from 'node:crypto';
import type { Product, ProductImage, ProductInput, ProductListQuery } from '@p4/shared';
import type { Transaction, WhereOptions } from 'sequelize';
import { literal, Op } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import { createFromStorageId, deleteFileIfUnreferenced } from '@/modules/files/files.service.js';
import {
  CategoryModel,
  FileModel,
  ProductImageModel,
  ProductModel,
  ProductSlugRedirectModel,
  ProductVariantModel,
  SizeGuideModel,
  sequelize,
} from '@/sequelize/models/index.js';
import type { ProductAttributes } from '@/sequelize/models/product.model.js';
import type { ProductImageAttributes } from '@/sequelize/models/product-image.model.js';
import { recordAudit } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { numberRange, searchPattern } from '@/shared/list-filters.js';
import { requestStore } from '@/shared/request-store.js';
import { inTransaction } from '@/shared/transaction.js';
import type { ModelOrder } from '@/types/database.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { InputValidError, NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';
import { createDefaultVariant, normalizedSlug } from '../catalog/catalog.service.js';
import { eligibleVariantSql } from '../discovery/discovery.service.js';

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

const galleryImageFields = ['id', 'fileId', 'sortOrder'] satisfies (keyof ProductImage)[];

function toGalleryImage(row: GalleryRow): ProductImage {
  return {
    ...selectFields(row, galleryImageFields),
    url: row.file?.url ?? '',
  };
}

const productFields = [
  'id',
  'name',
  'price',
  'description',
  'imageId',
  'categoryId',
  'stock',
] satisfies (keyof Product)[];

function toProduct(row: ProductEager): Product {
  const images = (row.gallery ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toGalleryImage);
  return {
    ...selectFields(row, productFields),
    imageUrl: row.image?.url ?? images[0]?.url ?? '',
    category: row.category
      ? selectFields(row.category, ['id', 'name', 'slug', 'description'])
      : null,
    images,
  };
}

const productInclude = [imageInclude, categoryInclude, galleryInclude];

async function resolveImageId(imageStorageId?: string, fallback?: string | null) {
  if (!imageStorageId?.trim()) return fallback ?? null;
  const file = await createFromStorageId(imageStorageId);
  return file.id;
}

export async function listProducts(query: ProductListQuery, admin = false) {
  const conditions: WhereOptions<ProductAttributes>[] = admin ? [] : [{ status: 'active' }];

  const order: ModelOrder<ProductAttributes> = [
    [query.sortBy ?? 'createdAt', query.sortOrder === 'desc' ? 'DESC' : 'ASC'],
    ['id', 'ASC'],
  ];

  if (query.q) {
    const pattern = searchPattern(query.q);
    conditions.push({
      [Op.or]: [{ name: { [Op.iLike]: pattern } }, { description: { [Op.iLike]: pattern } }],
    });
  }
  if (query.categoryId) conditions.push({ categoryId: query.categoryId });
  if (
    query.size ||
    query.color ||
    query.availability ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined
  )
    conditions.push(
      literal(
        `EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = "ProductModel".id AND ${eligibleVariantSql(query)})`,
      ),
    );
  if (query.minRating !== undefined)
    conditions.push(
      literal(
        `(SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = "ProductModel".id AND r.moderation_status = 'published') >= ${sequelize.escape(query.minRating)}`,
      ),
    );
  if (query.minStock !== undefined || query.maxStock !== undefined)
    conditions.push({ stock: numberRange(query.minStock, query.maxStock) });

  const { rows, count } = await ProductModel.findAndCountAll({
    where: conditions.length ? { [Op.and]: conditions } : undefined,
    include: [imageInclude, categoryInclude, { ...galleryInclude, separate: true }],
    distinct: true,
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return {
    data: rows.map(toProduct),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

export async function getProductById(id: string, admin = false, transaction?: Transaction) {
  const row = (await ProductModel.findByPk(id, {
    include: productInclude,
    transaction,
  })) as ProductEager | null;
  if (!row || (!admin && row.status !== 'active')) throw new NotFound(errorKeys.productNotFound);
  return toProduct(row);
}

async function validateReferences(input: Partial<ProductInput>) {
  if (input.categoryId && !(await CategoryModel.findByPk(input.categoryId)))
    throw new InputValidError('input_valid_error', { categoryId: ['Category not found.'] });
  if (input.sizeGuideId && !(await SizeGuideModel.findByPk(input.sizeGuideId)))
    throw new InputValidError('input_valid_error', { sizeGuideId: ['Size guide not found.'] });
}

export async function createProduct(input: ProductInput, transaction?: Transaction) {
  await validateReferences(input);
  const images: string[] = [];
  for (const storageId of [input.imageStorageId, ...(input.imageStorageIds ?? [])]) {
    if (storageId) {
      const id = await resolveImageId(storageId);
      if (id && !images.includes(id)) images.push(id);
    }
  }
  const id = randomUUID();
  const actorId = requestStore.getStore()?.user?.id ?? null;
  await inTransaction(transaction, async (transaction) => {
    const row = await ProductModel.create(
      {
        id,
        name: input.name,
        price: input.price,
        description: input.description ?? '',
        imageId: images[0] ?? null,
        categoryId: input.categoryId ?? null,
        stock: input.stock,
        slug: normalizedSlug(input.slug ?? `product-${id}`),
        status: 'draft',
        brand: input.brand ?? '',
        material: input.material ?? '',
        careInstructions: input.careInstructions ?? '',
        seoTitle: input.seoTitle ?? '',
        seoDescription: input.seoDescription ?? '',
        sizeGuideId: input.sizeGuideId ?? null,
      },
      { transaction },
    );
    for (const [sortOrder, fileId] of images.entries())
      await ProductImageModel.create({ productId: id, fileId, sortOrder }, { transaction });
    await createDefaultVariant(row, actorId, transaction);
    await recordAudit(
      { actorId, action: 'product.created', resourceType: 'product', resourceId: id },
      transaction,
    );
  });
  return getProductById(id, true, transaction);
}

export async function updateProduct(
  id: string,
  body: Partial<ProductInput>,
  transaction?: Transaction,
) {
  await validateReferences(body);
  if (body.stock !== undefined)
    throw new InputValidError('input_valid_error', {
      stock: ['Use inventory receipts/adjustments.'],
    });
  const imageId = body.imageStorageId ? await resolveImageId(body.imageStorageId) : undefined;
  await inTransaction(transaction, async (transaction) => {
    const row = await ProductModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new NotFound(errorKeys.productNotFound);
    if (body.expectedVersion !== undefined) assertVersion(row.version, body.expectedVersion);
    const slug = body.slug ? normalizedSlug(body.slug) : row.slug;
    if (slug !== row.slug) {
      const historic = await ProductSlugRedirectModel.findByPk(slug, { transaction });
      if (historic && historic.productId !== id)
        throw new InputValidError('input_valid_error', {
          slug: ['Slug is reserved by another product.'],
        });
      await ProductSlugRedirectModel.findOrCreate({
        where: { slug: row.slug },
        defaults: { slug: row.slug, productId: id },
        transaction,
      });
    }
    if (body.price !== undefined) {
      const variants = await ProductVariantModel.findAll({ where: { productId: id }, transaction });
      if ((variants.length !== 1 || !variants[0]) && body.price !== row.price)
        throw new BaseError('update_variant_price', 409, 'update_variant_price');
      if (variants[0] && variants.length === 1)
        await variants[0].update(
          { price: body.price, version: variants[0].version + 1 },
          { transaction },
        );
    }
    await row.update(
      {
        name: body.name ?? row.name,
        price: body.price ?? row.price,
        description: body.description ?? row.description,
        imageId: imageId ?? row.imageId,
        categoryId: body.categoryId === undefined ? row.categoryId : body.categoryId,
        slug,
        brand: body.brand ?? row.brand,
        material: body.material ?? row.material,
        careInstructions: body.careInstructions ?? row.careInstructions,
        seoTitle: body.seoTitle ?? row.seoTitle,
        seoDescription: body.seoDescription ?? row.seoDescription,
        sizeGuideId: body.sizeGuideId === undefined ? row.sizeGuideId : body.sizeGuideId,
        version: row.version + 1,
      },
      { transaction },
    );
    if (imageId)
      await ProductImageModel.findOrCreate({
        where: { productId: id, fileId: imageId },
        defaults: { productId: id, fileId: imageId, sortOrder: 0 },
        transaction,
      });
    await recordAudit(
      {
        actorId: requestStore.getStore()?.user?.id,
        action: 'product.updated',
        resourceType: 'product',
        resourceId: id,
      },
      transaction,
    );
  });
  return getProductById(id, true, transaction);
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
      order: [['sortOrder', 'ASC']] satisfies ModelOrder<ProductImageAttributes>,
    });
    await product.update({ imageId: next?.fileId ?? null });
  }
  await deleteFileIfUnreferenced(fileId);
  return { ok: true as const };
}

export async function deleteProduct(id: string) {
  const product = await getProductById(id, true);
  await sequelize.transaction(async (transaction) => {
    const row = await ProductModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new NotFound();
    const variants = await ProductVariantModel.findAll({ where: { productId: id }, transaction });
    if (variants.some((variant) => variant.reserved > 0))
      throw new BaseError('product_has_reservations', 409, 'product_has_reservations');
    await row.update({ status: 'archived', version: row.version + 1 }, { transaction });
    await recordAudit(
      {
        actorId: requestStore.getStore()?.user?.id,
        action: 'product.archived',
        resourceType: 'product',
        resourceId: id,
      },
      transaction,
    );
  });
  return product;
}
