import { randomUUID } from 'node:crypto';
import {
  BaseError,
  buildPaginationMeta,
  InputValidError,
  NotFound,
  numberRange,
  requestStore,
  searchPattern,
} from '@p4/server-core';
import type { AdminProductListQuery, Product, ProductImage, ProductInput } from '@p4/shared';
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
import { auditedTransaction, inTransaction, recordAudit } from '@/shared/audit/audited-command.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import type { ModelOrder } from '@/types/database.js';
import { selectFields } from '@/utils/select-fields.js';
import { createDefaultVariant, normalizedSlug } from '../catalog/catalog.service.js';
import { applyVariantChanges } from '../catalog/variant-changes.js';
import { eligibleVariantSql } from '../discovery/discovery.service.js';

type GalleryRow = ProductImageModel & { file?: FileModel | null };

type ProductEager = ProductModel & {
  thumbnail?: FileModel | null;
  category?: CategoryModel | null;
  gallery?: GalleryRow[];
};

const thumbnailInclude = {
  model: FileModel,
  as: 'thumbnail' as const,
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
      attributes: ['id', 'url', 'storageId'],
    },
  ],
};

const galleryImageFields = ['id', 'fileId', 'sortOrder'] satisfies (keyof ProductImage)[];

function toGalleryImage(row: GalleryRow): ProductImage {
  return {
    ...selectFields(row, galleryImageFields),
    url: row.file?.url ?? '',
    storageId: row.file?.storageId ?? '',
  };
}

const productFields = [
  'slug',
  'status',
  'brand',
  'material',
  'careInstructions',
  'seoTitle',
  'seoDescription',
  'sizeGuideId',
  'version',
  'id',
  'name',
  'price',
  'description',
  'thumbnailId',
  'categoryId',
  'stock',
] satisfies (keyof Product)[];

export function productDto(row: ProductEager): Product {
  const images = (row.gallery ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toGalleryImage);
  return {
    ...selectFields(row, productFields),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    thumbnailUrl: row.thumbnail?.url ?? images[0]?.url ?? '',
    thumbnail: row.thumbnail
      ? {
          fileId: row.thumbnail.id,
          url: row.thumbnail.url ?? '',
          storageId: row.thumbnail.storageId,
        }
      : null,
    category: row.category
      ? selectFields(row.category, ['id', 'name', 'slug', 'description'])
      : null,
    images,
  };
}

export const productInclude = [thumbnailInclude, categoryInclude, galleryInclude];

async function resolveUploadFileId(storageId?: string) {
  if (!storageId?.trim()) return null;
  const file = await createFromStorageId(storageId.trim());
  return file.id;
}

export async function listProducts(query: AdminProductListQuery, admin = false) {
  const conditions: WhereOptions<ProductAttributes>[] = admin
    ? query.status
      ? [{ status: query.status }]
      : []
    : [{ status: 'active' }];

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
    include: [thumbnailInclude, categoryInclude, { ...galleryInclude, separate: true }],
    distinct: true,
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return {
    data: rows.map(productDto),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

export async function getProductById(id: string, admin = false, transaction?: Transaction) {
  const row = (await ProductModel.findByPk(id, {
    include: productInclude,
    transaction,
  })) as ProductEager | null;
  if (!row || (!admin && row.status !== 'active')) throw new NotFound(errorKeys.productNotFound);
  return productDto(row);
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
  for (const storageId of input.imageStorageIds ?? []) {
    const fileId = await resolveUploadFileId(storageId);
    if (fileId && !images.includes(fileId)) images.push(fileId);
  }
  const thumbnailId = await resolveUploadFileId(input.thumbnailStorageId ?? undefined);
  const id = randomUUID();
  const actorId = requestStore.getStore()?.user?.id ?? null;
  await inTransaction(transaction, async (transaction) => {
    const row = await ProductModel.create(
      {
        id,
        name: input.name,
        price: input.price,
        description: input.description ?? '',
        thumbnailId,
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
    for (const [sortOrder, fileId] of images.filter((id) => id !== thumbnailId).entries())
      await ProductImageModel.create({ productId: id, fileId, sortOrder }, { transaction });
    if (input.variants?.create !== undefined) {
      await applyVariantChanges(row, input.variants, actorId, transaction);
    } else {
      await createDefaultVariant(row, actorId, transaction);
    }
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
  await inTransaction(transaction, async (transaction) => {
    const row = await ProductModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new NotFound(errorKeys.productNotFound);
    if (body.expectedVersion !== undefined) assertVersion(row.version, body.expectedVersion);
    // Snapshot attachments before moving files between thumbnail and gallery.
    // Only files already attached to this product can bypass upload ownership checks.
    const existingImages = (await ProductImageModel.findAll({
      where: { productId: id },
      include: [{ model: FileModel, as: 'file' }],
      transaction,
    })) as GalleryRow[];
    const attached = new Map(
      existingImages.flatMap((image) =>
        image.file ? [[image.file.storageId, image.fileId] as const] : [],
      ),
    );
    if (row.thumbnailId) {
      const file = await FileModel.findByPk(row.thumbnailId, { transaction });
      if (file) attached.set(file.storageId, file.id);
    }

    const resolveAttachment = async (storageId: string) =>
      attached.get(storageId.trim()) ?? (await resolveUploadFileId(storageId));

    const thumbnailId =
      body.thumbnailStorageId === undefined
        ? row.thumbnailId
        : body.thumbnailStorageId === null
          ? null
          : await resolveAttachment(body.thumbnailStorageId);
    const galleryFileIds: string[] = [];
    for (const storageId of body.imageStorageIds ?? []) {
      const fileId = await resolveAttachment(storageId);
      if (!fileId) throw new NotFound(errorKeys.uploadFileRequired);
      if (fileId !== thumbnailId && !galleryFileIds.includes(fileId)) galleryFileIds.push(fileId);
    }
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
    if (body.price !== undefined && !body.variants) {
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
        thumbnailId,
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
    if (body.imageStorageIds !== undefined) {
      await ProductImageModel.destroy({
        where: {
          productId: id,
          ...(galleryFileIds.length ? { fileId: { [Op.notIn]: galleryFileIds } } : {}),
        },
        transaction,
      });
      for (const [sortOrder, fileId] of galleryFileIds.entries()) {
        const [image, created] = await ProductImageModel.findOrCreate({
          where: { productId: id, fileId } satisfies WhereOptions<ProductImageAttributes>,
          defaults: { productId: id, fileId, sortOrder },
          transaction,
        });
        if (!created) await image.update({ sortOrder }, { transaction });
      }
    } else if (body.thumbnailStorageId !== undefined && thumbnailId) {
      // A newly selected thumbnail cannot remain duplicated in the gallery.
      await ProductImageModel.destroy({
        where: { productId: id, fileId: thumbnailId },
        transaction,
      });
    }
    // Detaching a product image also detaches it from all SKUs, atomically.
    const retained = new Set([
      ...(thumbnailId ? [thumbnailId] : []),
      ...(body.imageStorageIds !== undefined
        ? galleryFileIds
        : existingImages.map((image) => image.fileId)),
    ]);
    const detached = new Set([...attached.values()].filter((fileId) => !retained.has(fileId)));
    if (body.variants)
      await applyVariantChanges(
        row,
        body.variants,
        requestStore.getStore()?.user?.id ?? null,
        transaction,
        detached,
      );
    if (detached.size) {
      const variants = await ProductVariantModel.findAll({
        where: { productId: id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      for (const variant of variants) {
        const imageIds = variant.imageIds.filter((fileId) => !detached.has(fileId));
        if (imageIds.length !== variant.imageIds.length)
          await variant.update({ imageIds, version: variant.version + 1 }, { transaction });
      }
    }
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
  input: { storageId: string; sortOrder?: number },
) {
  return auditedTransaction(async () => {
    const product = await ProductModel.findByPk(productId);
    if (!product) throw new NotFound(errorKeys.productNotFound);
    const fileId = await resolveUploadFileId(input.storageId);
    if (!fileId) throw new NotFound(errorKeys.uploadFileRequired);

    const maxOrder = (await ProductImageModel.max('sortOrder', { where: { productId } })) ?? -1;
    const sortOrder = input.sortOrder ?? Number(maxOrder) + 1;

    const row = await ProductImageModel.create({
      productId,
      fileId,
      sortOrder,
    });

    const full = (await ProductImageModel.findByPk(row.id, {
      include: [{ model: FileModel, as: 'file', attributes: ['id', 'url', 'storageId'] }],
    })) as GalleryRow;
    return toGalleryImage(full);
  });
}

export async function removeProductImage(productId: string, imageRowId: string) {
  return auditedTransaction(async () => {
    const row = await ProductImageModel.findOne({ where: { id: imageRowId, productId } });
    if (!row) throw new NotFound(errorKeys.notFound);
    const fileId = row.fileId;
    await row.destroy();
    await deleteFileIfUnreferenced(fileId);
    return { ok: true as const };
  });
}

export async function deleteProduct(id: string) {
  const product = await getProductById(id, true);
  await auditedTransaction(async (transaction) => {
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
