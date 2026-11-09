import { createHash } from 'node:crypto';
import type { ImportResource, ParsedImportRow } from '@p4/processes/shared';
import { parseImportRow } from '@p4/processes/shared';
import { BaseError } from '@p4/server-core';
import type { JsonValue, User } from '@p4/shared';
import type { Transaction } from 'sequelize';
import { CategoryModel, ProductModel, ProductVariantModel } from '@/sequelize/models/index.js';
import { jsonValue } from '@/shared/commerce/persistence.js';
import { createVariant, updateVariant } from '../catalog/catalog.service.js';
import { createCategory, updateCategory } from '../categories/categories.service.js';
import { moveInventory } from '../inventory/inventory.service.js';
import { createProduct, updateProduct } from '../products/products.service.js';

export function importFingerprint(value: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(jsonValue(value)))
    .digest('hex');
}
export async function importTarget(row: ParsedImportRow, transaction?: Transaction) {
  switch (row.resource) {
    case 'categories': {
      const target = await CategoryModel.findOne({
        where: { slug: row.value.slug },
        transaction,
        ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
      });
      return target
        ? {
            id: target.id,
            fingerprint: importFingerprint({
              name: target.name,
              slug: target.slug,
              description: target.description,
            }),
          }
        : null;
    }
    case 'products': {
      const target = await ProductModel.findOne({
        where: { slug: row.value.slug },
        transaction,
        ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
      });
      return target ? { id: target.id, version: target.version } : null;
    }
    case 'variants': {
      const pointer = await ProductVariantModel.findOne({
        where: { sku: row.value.sku.toUpperCase() },
        transaction,
      });
      if (!pointer) return null;
      if (transaction)
        await ProductModel.findByPk(pointer.productId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
      const target = await ProductVariantModel.findByPk(pointer.id, {
        transaction,
        ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
      });
      return target ? { id: target.id, version: target.version } : null;
    }
    case 'inventory': {
      const target = await ProductVariantModel.findOne({
        where: { sku: row.value.sku.toUpperCase() },
        transaction,
      });
      return target ? { id: target.id } : null;
    }
  }
}
export async function validateImportReferences(row: ParsedImportRow, transaction?: Transaction) {
  if (row.resource === 'products') {
    if (
      row.value.categorySlug &&
      !(await CategoryModel.findOne({ where: { slug: row.value.categorySlug }, transaction }))
    )
      throw new BaseError('category_not_found');
    if (
      row.value.initialStock &&
      (await ProductModel.count({ where: { slug: row.value.slug }, transaction }))
    )
      throw new BaseError('existing_stock_requires_inventory_import');
  }
  if (row.resource === 'variants') {
    const product = await ProductModel.findOne({
      where: { slug: row.value.productSlug },
      transaction,
    });
    if (!product) throw new BaseError('product_not_found');
    const target = await ProductVariantModel.findOne({
      where: { sku: row.value.sku.toUpperCase() },
      transaction,
    });
    if (target && target.productId !== product.id)
      throw new BaseError('sku_belongs_to_another_product');
  }
  if (
    row.resource === 'inventory' &&
    !(await ProductVariantModel.findOne({
      where: { sku: row.value.sku.toUpperCase() },
      transaction,
    }))
  )
    throw new BaseError('sku_not_found');
}
export async function applyImportRow(
  resource: ImportResource,
  data: JsonValue,
  expected: JsonValue | null,
  user: User,
  reference: string,
  transaction: Transaction,
) {
  const row = parseImportRow(resource, data);
  await validateImportReferences(row, transaction);
  const target = await importTarget(row, transaction);
  if (importFingerprint(target) !== importFingerprint(expected))
    throw new BaseError('import_target_changed', 409, 'import_target_changed');
  switch (row.resource) {
    case 'categories':
      return target
        ? updateCategory(target.id, row.value, transaction)
        : createCategory(row.value, transaction);
    case 'products': {
      const category = row.value.categorySlug
        ? await CategoryModel.findOne({ where: { slug: row.value.categorySlug }, transaction })
        : null;
      const input = {
        name: row.value.name,
        slug: row.value.slug,
        price: row.value.price,
        description: row.value.description,
        brand: row.value.brand,
        material: row.value.material,
        categoryId: category?.id ?? null,
      };
      return target
        ? updateProduct(
            target.id,
            {
              ...input,
              expectedVersion: typeof target.version === 'number' ? target.version : undefined,
            },
            transaction,
          )
        : createProduct({ ...input, stock: row.value.initialStock }, transaction);
    }
    case 'variants': {
      const product = await ProductModel.findOne({
        where: { slug: row.value.productSlug },
        transaction,
      });
      if (!product) throw new BaseError('product_not_found');
      const input = {
        sku: row.value.sku,
        size: row.value.size,
        color: row.value.color,
        price: row.value.price,
        barcode: row.value.barcode || null,
        status: 'active' as const,
        isDefault: false,
      };
      return target
        ? updateVariant(
            user.id,
            product.id,
            target.id,
            typeof target.version === 'number' ? target.version : 0,
            input,
            transaction,
          )
        : createVariant(user.id, product.id, input, transaction);
    }
    case 'inventory': {
      if (!target) throw new BaseError('sku_not_found');
      const changed = await moveInventory(
        {
          variantId: target.id,
          kind: 'adjust',
          quantity: row.value.quantity,
          actorId: user.id,
          reason: row.value.reason,
          reference,
        },
        transaction,
      );
      return { id: changed.id };
    }
  }
}
