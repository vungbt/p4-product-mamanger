import { randomUUID } from 'node:crypto';
import type {
  CatalogProduct,
  ProductPublicationStatus,
  ProductVariant,
  SizeGuide,
} from '@p4/shared';
import type { Transaction } from 'sequelize';
import {
  FileModel,
  InventoryMovementModel,
  OrderItemModel,
  ProductModel,
  ProductSlugRedirectModel,
  ProductVariantModel,
  type SizeGuideModel,
  sequelize,
} from '@/sequelize/models/index.js';
import { enqueueEvent, recordAudit } from '@/shared/commerce/persistence.js';
import { assertTransition, assertVersion } from '@/shared/commerce/transitions.js';
import { inTransaction } from '@/shared/transaction.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { Forbidden, InputValidError, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';
import { syncProductBalance, variantDto } from '../inventory/inventory.service.js';
import { getProductById } from '../products/products.service.js';

export function normalizedSlug(value: string) {
  const result = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result) || result.length > 160)
    throw new InputValidError('input_valid_error', {
      slug: ['Use lowercase letters, digits and hyphens.'],
    });
  return result;
}

export async function getCatalogProduct(id: string, admin = false): Promise<CatalogProduct> {
  const row = await ProductModel.findByPk(id);
  if (!row || (!admin && row.status !== 'active')) throw new NotFound('product_not_found');
  return {
    ...(await getProductById(id, admin)),
    ...selectFields(row, [
      'slug',
      'status',
      'brand',
      'material',
      'careInstructions',
      'seoTitle',
      'seoDescription',
      'sizeGuideId',
      'version',
    ]),
  };
}

export async function getProductBySlug(slug: string) {
  const row = await ProductModel.findOne({ where: { slug, status: 'active' } });
  if (row) return { product: await getCatalogProduct(row.id), redirect: null };
  const redirect = await ProductSlugRedirectModel.findByPk(slug);
  if (!redirect) throw new NotFound();
  const product = await getCatalogProduct(redirect.productId);
  return { product, redirect: product.slug };
}

export async function publishProduct(
  actorId: string,
  id: string,
  status: ProductPublicationStatus,
  expectedVersion: number,
) {
  await sequelize.transaction(async (transaction) => {
    const row = await ProductModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new NotFound();
    assertVersion(row.version, expectedVersion);
    if (status !== row.status) assertTransition('product', row.status, status);
    if (status === 'active') {
      const variants = await ProductVariantModel.count({
        where: { productId: id, status: 'active' },
        transaction,
      });
      if (!row.name.trim() || !row.slug || !row.description.trim() || !row.imageId || variants < 1)
        throw new BaseError('product_incomplete', 409, 'product_incomplete', {
          publication: ['Name, slug, description, cover and an active SKU are required.'],
        });
    }
    await row.update({ status, version: row.version + 1 }, { transaction });
    await recordAudit(
      {
        actorId,
        action: 'product.publication',
        resourceType: 'product',
        resourceId: id,
        changes: { status },
      },
      transaction,
    );
    await enqueueEvent(
      {
        type: 'product.publication_changed',
        aggregateType: 'product',
        aggregateId: id,
        payload: { productId: id, status },
      },
      transaction,
    );
  });
  return getCatalogProduct(id, true);
}

export interface VariantInput {
  sku: string;
  barcode: string | null;
  size: string;
  color: string;
  price: number;
  status: 'active' | 'inactive';
  isDefault: boolean;
}

export async function createVariant(
  actorId: string,
  productId: string,
  input: VariantInput,
  transaction?: Transaction,
) {
  return inTransaction(transaction, async (transaction) => {
    const product = await ProductModel.findByPk(productId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!product || product.status === 'archived') throw new NotFound();
    if (input.isDefault)
      await ProductVariantModel.update({ isDefault: false }, { where: { productId }, transaction });
    const row = await ProductVariantModel.create(
      {
        id: randomUUID(),
        productId,
        ...input,
        sku: input.sku.toUpperCase(),
        barcode: input.barcode || null,
        size: input.size.toUpperCase(),
        color: input.color.toLowerCase(),
        imageIds: [],
        onHand: 0,
        reserved: 0,
        version: 1,
      },
      { transaction },
    );
    await syncProductBalance(productId, transaction);
    await product.update({ version: product.version + 1 }, { transaction });
    await recordAudit(
      {
        actorId,
        action: 'variant.created',
        resourceType: 'variant',
        resourceId: row.id,
        changes: { sku: row.sku },
      },
      transaction,
    );
    return variantDto(row);
  });
}

export async function updateVariant(
  actorId: string,
  productId: string,
  variantId: string,
  expectedVersion: number,
  input: Partial<VariantInput>,
  transaction?: Transaction,
) {
  return inTransaction(transaction, async (transaction) => {
    const product = await ProductModel.findByPk(productId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const row = await ProductVariantModel.findOne({
      where: { id: variantId, productId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row || !product) throw new NotFound();
    assertVersion(row.version, expectedVersion);
    const identityChanges =
      (input.sku !== undefined && input.sku.toUpperCase() !== row.sku.toUpperCase()) ||
      (input.size !== undefined && input.size.toUpperCase() !== row.size.toUpperCase()) ||
      (input.color !== undefined && input.color.toLowerCase() !== row.color.toLowerCase());
    if (identityChanges && (await OrderItemModel.count({ where: { variantId }, transaction })))
      throw new BaseError(
        'sold_variant_identity_immutable',
        409,
        'sold_variant_identity_immutable',
      );
    if (input.isDefault)
      await ProductVariantModel.update({ isDefault: false }, { where: { productId }, transaction });
    if (input.status === 'inactive' && row.reserved > 0)
      throw new BaseError('variant_has_reservations', 409, 'variant_has_reservations');
    await row.update(
      {
        ...input,
        sku: input.sku?.toUpperCase() ?? row.sku,
        size: input.size?.toUpperCase() ?? row.size,
        color: input.color?.toLowerCase() ?? row.color,
        version: row.version + 1,
      },
      { transaction },
    );
    await syncProductBalance(productId, transaction);
    await product.update({ version: product.version + 1 }, { transaction });
    await recordAudit(
      {
        actorId,
        action: 'variant.updated',
        resourceType: 'variant',
        resourceId: row.id,
        changes: { ...input },
      },
      transaction,
    );
    return variantDto(row);
  });
}

export async function setVariantImages(
  actorId: string,
  productId: string,
  variantId: string,
  expectedVersion: number,
  ids: string[],
) {
  return sequelize.transaction(async (transaction) => {
    await ProductModel.findByPk(productId, { transaction, lock: transaction.LOCK.UPDATE });
    const row = await ProductVariantModel.findOne({
      where: { id: variantId, productId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new NotFound();
    assertVersion(row.version, expectedVersion);
    for (const id of ids) {
      const file = await FileModel.findByPk(id, { transaction });
      if (
        !file ||
        file.metadata?.ownerId !== actorId ||
        file.metadata?.purpose !== 'product' ||
        file.metadata?.private
      )
        throw new Forbidden();
    }
    await row.update({ imageIds: ids, version: row.version + 1 }, { transaction });
    await recordAudit(
      {
        actorId,
        action: 'variant.images_changed',
        resourceType: 'variant',
        resourceId: row.id,
        changes: { imageIds: ids },
      },
      transaction,
    );
    return variantDto(row);
  });
}

export async function listVariants(productId: string, admin = false): Promise<ProductVariant[]> {
  await getCatalogProduct(productId, admin);
  const rows = await ProductVariantModel.findAll({
    where: admin ? { productId } : { productId, status: 'active' },
    order: [
      ['isDefault', 'DESC'],
      ['id', 'ASC'],
    ],
  });
  return rows.map(variantDto);
}

export async function createDefaultVariant(
  product: ProductModel,
  actorId: string | null,
  transaction: Transaction,
) {
  const id = randomUUID();
  await ProductVariantModel.create(
    {
      id,
      productId: product.id,
      sku: `SKU-${product.id}`,
      barcode: null,
      size: 'DEFAULT',
      color: 'default',
      price: product.price,
      status: 'active',
      isDefault: true,
      imageIds: [],
      onHand: product.stock,
      reserved: 0,
      version: 1,
    },
    { transaction },
  );
  if (product.stock)
    await InventoryMovementModel.create(
      {
        id: randomUUID(),
        variantId: id,
        kind: 'opening',
        quantity: product.stock,
        onHandDelta: product.stock,
        reservedDelta: 0,
        onHandAfter: product.stock,
        reservedAfter: 0,
        actorId,
        reason: 'Product initial inventory',
        reference: `opening:${id}`,
      },
      { transaction },
    );
}

export function sizeGuideDto(row: SizeGuideModel): SizeGuide {
  return selectFields(row, ['id', 'name', 'measurements', 'version']);
}
