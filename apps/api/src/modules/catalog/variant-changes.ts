import { randomUUID } from 'node:crypto';
import { BaseError } from '@p4/server-core';
import type { JsonValue, ProductVariantChanges } from '@p4/shared';
import { Op, type Transaction, UniqueConstraintError, type WhereOptions } from 'sequelize';
import * as v from 'valibot';
import {
  FileModel,
  OrderItemModel,
  ProductImageModel,
  type ProductModel,
  ProductVariantModel,
} from '@/sequelize/models/index.js';
import type { ProductVariantAttributes } from '@/sequelize/models/product-variant.model.js';
import { recordAudit } from '@/shared/audit/audited-command.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { createFromStorageId } from '../files/files.service.js';
import { moveInventory, syncProductBalance } from '../inventory/inventory.service.js';

const text = (max: number) => v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(max));

const integer = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483647));
const fields = {
  sku: text(120),
  barcode: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(120)))),
  size: text(80),
  color: text(80),
  price: integer,
  status: v.optional(v.picklist(['active', 'inactive'])),
  isDefault: v.optional(v.boolean()),
  imageStorageIds: v.optional(v.pipe(v.array(text(1024)), v.maxLength(20))),
  imageIds: v.optional(v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.maxLength(20))),
};
const schema = v.strictObject({
  create: v.optional(
    v.pipe(v.array(v.strictObject({ ...fields, stock: v.optional(integer) })), v.maxLength(500)),
  ),
  update: v.optional(
    v.pipe(
      v.array(
        v.strictObject({
          ...v.partial(v.object(fields)).entries,
          id: v.pipe(v.string(), v.uuid()),
          expectedVersion: v.optional(v.pipe(integer, v.minValue(1))),
        }),
      ),
      v.maxLength(500),
    ),
  ),
  delete: v.optional(v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.maxLength(500))),
});

function fieldError(path: string, code: string, status = 422): never {
  throw new BaseError(code, status, code, { [path]: [code] });
}

export function parseVariantChanges(
  value: unknown,
  create = false,
): ProductVariantChanges | undefined {
  if (value === undefined) return undefined;
  const parsed = v.safeParse(schema, value);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.issues) {
      const path = ['variants', ...(issue.path?.map((item) => item.key) ?? [])].join('.');
      errors[path] = [issue.message];
    }
    throw new BaseError('input_valid_error', 422, 'input_valid_error', errors);
  }
  if (create && (parsed.output.update?.length || parsed.output.delete?.length))
    fieldError('variants', 'create_variants_only');
  const ids = [
    ...(parsed.output.delete ?? []),
    ...(parsed.output.update ?? []).map((row) => row.id),
  ];
  if (new Set(ids).size !== ids.length) fieldError('variants', 'duplicate_variant_operation');
  return parsed.output;
}

/** Parent is already locked by the product writer. This batch never bumps its version. */
export async function applyVariantChanges(
  product: ProductModel,
  changes: ProductVariantChanges,
  actorId: string | null,
  transaction: Transaction,
  detachedFileIds: ReadonlySet<string> = new Set(),
) {
  const rows = await ProductVariantModel.findAll({
    where: { productId: product.id },
    order: [['id', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const find = (id: string, path: string) => {
    const row = rows.find((row) => row.id === id);
    if (!row) fieldError(path, 'variant_not_found');
    return row;
  };
  // Product attachments bypass ticket checks; SKU-only uploads stay outside this map.

  const attachments = new Map<string, string>();
  if (
    [...(changes.create ?? []), ...(changes.update ?? [])].some(
      (item) => item.imageStorageIds !== undefined,
    )
  ) {
    const gallery = await ProductImageModel.findAll({
      where: { productId: product.id },
      transaction,
    });
    const ids = [
      ...new Set([
        ...(product.thumbnailId ? [product.thumbnailId] : []),
        ...gallery.map((image) => image.fileId),
      ]),
    ];
    for (const id of ids) {
      const file = await FileModel.findByPk(id, { transaction });
      if (file) attachments.set(file.storageId, file.id);
    }
  }

  const audit = (id: string, action: string, values: JsonValue) =>
    recordAudit(
      { actorId, action, resourceType: 'variant', resourceId: id, changes: values },
      transaction,
    );

  for (const [index, id] of (changes.delete ?? []).entries()) {
    const path = `variants.delete.${index}`;
    const row = find(id, path);
    if (row.reserved > 0) fieldError(path, 'variant_has_reservations', 409);
    await row.update(
      { status: 'inactive', isDefault: false, version: row.version + 1 },
      { transaction },
    );
    await audit(id, 'variant.deactivated', { status: 'inactive' });
  }
  for (const [operation, entries] of [
    ['update', changes.update ?? []],
    ['create', changes.create ?? []],
  ] as const) {
    for (const [index, input] of entries.entries()) {
      const path = `variants.${operation}.${index}`;
      const row = 'id' in input ? find(input.id, `${path}.id`) : undefined;
      if (row && 'expectedVersion' in input && input.expectedVersion !== undefined) {
        try {
          assertVersion(row.version, input.expectedVersion);
        } catch {
          fieldError(`${path}.expectedVersion`, 'version_conflict', 409);
        }
      }
      const imageIds: string[] | undefined = input.imageStorageIds === undefined ? undefined : [];
      for (const storageId of input.imageStorageIds ?? []) {
        let id = attachments.get(storageId);
        if (!id && row) {
          for (const fileId of row.imageIds) {
            if (detachedFileIds.has(fileId)) continue;
            const file = await FileModel.findByPk(fileId, { transaction });
            if (file?.storageId === storageId) {
              id = file.id;
              break;
            }
          }
        }
        if (!id) {
          try {
            const file = await createFromStorageId(storageId, 'product');
            if (
              detachedFileIds.has(file.id) ||
              file.metadata?.private ||
              file.metadata?.purpose !== 'product' ||
              file.metadata?.ownerId !== actorId
            )
              fieldError(`${path}.imageStorageIds`, 'invalid_product_image');
            id = file.id;
          } catch (error) {
            if (error instanceof BaseError && error.statusCode < 500)
              fieldError(`${path}.imageStorageIds`, 'invalid_product_image');
            throw error;
          }
        }
        imageIds?.push(id);
      }
      const values = {
        sku: input.sku?.trim().toUpperCase() ?? row?.sku ?? '',
        barcode:
          input.barcode === undefined ? (row?.barcode ?? null) : input.barcode?.trim() || null,
        size: input.size?.trim().toUpperCase() ?? row?.size ?? '',
        color: input.color?.trim().toLowerCase() ?? row?.color ?? '',
        price: input.price ?? row?.price ?? 0,
        status: input.status ?? row?.status ?? 'active',
        isDefault: input.isDefault ?? row?.isDefault ?? false,
        imageIds: imageIds ?? input.imageIds ?? row?.imageIds ?? [],
      };
      values.isDefault = values.status === 'active' && values.isDefault;
      if (row?.reserved && values.status === 'inactive')
        fieldError(`${path}.status`, 'variant_has_reservations', 409);
      if (row) {
        const identity = (['sku', 'size', 'color'] as const).filter(
          (key) => values[key] !== row[key],
        );
        if (
          identity.length &&
          (await OrderItemModel.count({ where: { variantId: row.id }, transaction }))
        )
          fieldError(`${path}.${identity[0]}`, 'sold_variant_identity_immutable', 409);
      }
      for (const key of ['sku', 'barcode'] as const) {
        if (!values[key]) continue;
        const where: WhereOptions<ProductVariantAttributes> = {
          [key]: values[key],
          ...(row ? { id: { [Op.ne]: row.id } } : {}),
        };
        if (await ProductVariantModel.findOne({ where, transaction }))
          fieldError(`${path}.${key}`, `duplicate_${key}`, 409);
      }
      const combination: WhereOptions<ProductVariantAttributes> = {
        productId: product.id,
        size: values.size,
        color: values.color,
        ...(row ? { id: { [Op.ne]: row.id } } : {}),
      };
      if (await ProductVariantModel.findOne({ where: combination, transaction }))
        fieldError(`${path}.size`, 'duplicate_variant_combination', 409);
      for (const id of input.imageIds ?? []) {
        const file = await FileModel.findByPk(id, { transaction });
        if (
          !file ||
          file.metadata?.private ||
          file.metadata?.purpose !== 'product' ||
          (file.metadata?.ownerId !== actorId && !row?.imageIds.includes(id))
        )
          fieldError(`${path}.imageIds`, 'invalid_product_image');
      }
      if (input.isDefault && values.status === 'active') {
        await ProductVariantModel.update(
          { isDefault: false },
          { where: { productId: product.id }, transaction },
        );
        for (const existing of rows) existing.isDefault = false;
      }
      try {
        if (row) {
          await row.update({ ...values, version: row.version + 1 }, { transaction });
          await audit(row.id, 'variant.updated', values);
        } else {
          const stock = 'stock' in input ? (input.stock ?? 0) : 0;
          const created = await ProductVariantModel.create(
            {
              id: randomUUID(),
              productId: product.id,
              ...values,
              onHand: 0,
              reserved: 0,
              version: 1,
            },
            { transaction },
          );
          rows.push(created);
          if (stock)
            await moveInventory(
              {
                variantId: created.id,
                kind: 'opening',
                quantity: stock,
                actorId,
                reason: 'Product initial inventory',
                reference: `opening:${created.id}`,
              },
              transaction,
            );
          await audit(created.id, 'variant.created', { ...values, stock });
        }
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          const paths = error.errors.map((item) => item.path ?? '');
          if (paths.some((key) => key === 'size' || key === 'color' || key === 'product_id'))
            fieldError(`${path}.size`, 'duplicate_variant_combination', 409);
          const key = paths.some((key) => key.includes('barcode')) ? 'barcode' : 'sku';
          fieldError(`${path}.${key}`, `duplicate_${key}`, 409);
        }
        throw error;
      }
    }
  }
  await ensureDefaultVariant(product.id, transaction);
  await syncProductBalance(product.id, transaction);
}

export async function ensureDefaultVariant(productId: string, transaction: Transaction) {
  const rows = await ProductVariantModel.findAll({
    where: { productId },
    order: [['id', 'ASC']],
    transaction,
  });
  const active = rows.filter((row) => row.status === 'active');
  const chosen = active.find((row) => row.isDefault) ?? active[0];
  // Clear losing defaults before setting the winner: the database has a partial unique index.
  for (const row of rows)
    if (row.isDefault && row.id !== chosen?.id)
      await row.update({ isDefault: false }, { transaction });
  if (chosen && !chosen.isDefault) await chosen.update({ isDefault: true }, { transaction });
}
