import { randomUUID } from 'node:crypto';
import { BaseError, buildPaginationMeta, NotFound, searchPattern } from '@p4/server-core';
import type {
  InventoryBalance,
  InventoryListQuery,
  InventoryMovementKind,
  JsonValue,
  ProductVariant,
} from '@p4/shared';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import {
  InventoryMovementModel,
  ProductModel,
  ProductVariantModel,
  sequelize,
} from '@/sequelize/models/index.js';
import type { ProductVariantAttributes } from '@/sequelize/models/product-variant.model.js';
import { recordAudit } from '@/shared/audit/audited-command.js';
import { enqueueEvent, runIdempotent } from '@/shared/commerce/persistence.js';
import type { ModelOrder } from '@/types/database.js';
import { selectFields } from '@/utils/select-fields.js';

export function variantDto(row: ProductVariantModel): ProductVariant {
  return {
    ...selectFields(row, [
      'id',
      'productId',
      'sku',
      'barcode',
      'size',
      'color',
      'price',
      'status',
      'isDefault',
      'imageIds',
      'version',
    ]),
    available: row.onHand - row.reserved,
  };
}

export function inventoryDto(row: ProductVariantModel): InventoryBalance {
  return { ...variantDto(row), onHand: row.onHand, reserved: row.reserved };
}

export async function syncProductBalance(productId: string, transaction: Transaction) {
  // All writers lock the parent first, then variants in ascending ID order.
  const rows = await ProductVariantModel.findAll({
    where: { productId, status: 'active' },
    transaction,
  });
  const stock = rows.reduce((sum, row) => sum + row.onHand - row.reserved, 0);
  const price = rows.length ? Math.min(...rows.map((row) => row.price)) : 0;
  await ProductModel.update({ stock, price }, { where: { id: productId }, transaction });
}

export function inventoryDelta(kind: InventoryMovementKind, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity === 0 || (kind !== 'adjust' && quantity < 0))
    throw new BaseError('invalid_inventory_quantity', 400, 'invalid_inventory_quantity');
  switch (kind) {
    case 'reserve':
      return { onHand: 0, reserved: quantity };
    case 'release':
      return { onHand: 0, reserved: -quantity };
    case 'commit':
      return { onHand: -quantity, reserved: -quantity };
    default:
      return { onHand: quantity, reserved: 0 };
  }
}

export async function moveInventory(
  input: {
    variantId: string;
    kind: InventoryMovementKind;
    quantity: number;
    actorId: string | null;
    reason: string;
    reference: string;
  },
  transaction: Transaction,
) {
  const pointer = await ProductVariantModel.findByPk(input.variantId, { transaction });
  if (!pointer) throw new NotFound('variant_not_found');
  await ProductModel.findByPk(pointer.productId, { transaction, lock: transaction.LOCK.UPDATE });
  const row = await ProductVariantModel.findByPk(input.variantId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!row) throw new NotFound('variant_not_found');
  const delta = inventoryDelta(input.kind, input.quantity);
  const onHand = row.onHand + delta.onHand;
  const reserved = row.reserved + delta.reserved;
  if (
    !Number.isSafeInteger(onHand) ||
    onHand > 2_147_483_647 ||
    onHand < 0 ||
    reserved < 0 ||
    reserved > onHand
  )
    throw new BaseError('insufficient_inventory', 409, 'insufficient_inventory');
  await row.update({ onHand, reserved, version: row.version + 1 }, { transaction });
  await InventoryMovementModel.create(
    {
      id: randomUUID(),
      ...input,
      onHandDelta: delta.onHand,
      reservedDelta: delta.reserved,
      onHandAfter: onHand,
      reservedAfter: reserved,
    },
    { transaction },
  );
  await syncProductBalance(row.productId, transaction);
  await enqueueEvent(
    {
      type: 'inventory.changed',
      aggregateType: 'variant',
      aggregateId: row.id,
      payload: {
        variantId: row.id,
        productId: row.productId,
        available: onHand - reserved,
        previousAvailable: onHand - reserved - delta.onHand + delta.reserved,
      },
    },
    transaction,
  );
  return row;
}

export async function adjustInventory(input: {
  actorId: string;
  key: string;
  variantId: string;
  kind: 'receipt' | 'adjust';
  quantity: number;
  reason: string;
}) {
  return runIdempotent(
    {
      scope: 'inventory.adjust',
      actorId: input.actorId,
      key: input.key,
      payload: selectFields(input, ['variantId', 'kind', 'quantity', 'reason']),
    },
    async (transaction): Promise<JsonValue> => {
      const row = await moveInventory({ ...input, reference: input.key }, transaction);
      await recordAudit(
        {
          actorId: input.actorId,
          action: `inventory.${input.kind}`,
          resourceType: 'variant',
          resourceId: row.id,
          changes: { quantity: input.quantity, onHand: row.onHand, reserved: row.reserved },
          reason: input.reason,
        },
        transaction,
      );
      return { ...inventoryDto(row) };
    },
  );
}

export async function listInventory(query: InventoryListQuery) {
  const conditions: WhereOptions<ProductVariantAttributes>[] = [];
  if (query.q)
    conditions.push({
      [Op.or]: [
        { sku: { [Op.iLike]: searchPattern(query.q) } },
        { barcode: { [Op.iLike]: searchPattern(query.q) } },
      ],
    });
  if (query.productId) conditions.push({ productId: query.productId });
  if (query.status) conditions.push({ status: query.status });
  const order: ModelOrder<ProductVariantAttributes> = [
    [query.sortBy ?? 'sku', query.sortOrder === 'desc' ? 'DESC' : 'ASC'],
    ['id', 'ASC'],
  ];
  const { rows, count } = await ProductVariantModel.findAndCountAll({
    where: { [Op.and]: conditions },
    order,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });
  return {
    data: rows.map(inventoryDto),
    meta: buildPaginationMeta(query.page, query.pageSize, count),
  };
}

export async function reconcileInventory() {
  const [rows] = await sequelize.query(
    `SELECT v.id FROM product_variants v LEFT JOIN (SELECT variant_id, SUM(on_hand_delta) AS on_hand, SUM(reserved_delta) AS reserved FROM inventory_movements GROUP BY variant_id) m ON m.variant_id = v.id WHERE v.on_hand <> COALESCE(m.on_hand, 0) OR v.reserved <> COALESCE(m.reserved, 0)`,
  );
  return { consistent: rows.length === 0, discrepancies: rows };
}
