import { randomUUID } from 'node:crypto';
import { BaseError, NotFound } from '@p4/server-core';
import type { Cart, CartLineInput, CartWarning, JsonValue } from '@p4/shared';
import { Op, type Transaction } from 'sequelize';
import {
  CartItemModel,
  CartModel,
  FileModel,
  ProductModel,
  ProductVariantModel,
  sequelize,
} from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { jsonValue, runIdempotent } from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { settings } from '../settings/settings.service.js';

export async function lockCart(userId: string, transaction: Transaction) {
  await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:key))', {
    replacements: { key: `cart:${userId}` },
    transaction,
  });
  let row = await CartModel.findOne({
    where: { userId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!row) row = await CartModel.create({ id: randomUUID(), userId, version: 1 }, { transaction });
  return row;
}

export async function cartSnapshot(cart: CartModel, transaction?: Transaction): Promise<Cart> {
  const rows = await CartItemModel.findAll({
    where: { cartId: cart.id },
    transaction,
    order: [
      ['createdAt', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  const variants = await ProductVariantModel.findAll({
    where: { id: { [Op.in]: rows.map((row) => row.variantId) } },
    transaction,
  });
  const products = await ProductModel.findAll({
    where: { id: { [Op.in]: [...new Set(variants.map((variant) => variant.productId))] } },
    transaction,
  });
  const imageIds = [
    ...new Set([
      ...variants.flatMap((variant) => variant.imageIds.slice(0, 1)),
      ...products.flatMap((product) => (product.imageId ? [product.imageId] : [])),
    ]),
  ];
  const images = await FileModel.findAll({ where: { id: { [Op.in]: imageIds } }, transaction });
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const imageMap = new Map(
    images
      .filter((image) => image.metadata?.private !== true)
      .map((image) => [image.id, image.url]),
  );
  const items = [];
  for (const row of rows) {
    const variant = variantMap.get(row.variantId);
    const product = variant ? productMap.get(variant.productId) : undefined;
    const imageUrl =
      (variant?.imageIds[0] ? imageMap.get(variant.imageIds[0]) : undefined) ??
      (product?.imageId ? imageMap.get(product.imageId) : undefined) ??
      '';
    const warnings: CartWarning[] = [];
    const available = variant ? variant.onHand - variant.reserved : 0;
    if (variant?.status !== 'active' || product?.status !== 'active') warnings.push('unavailable');
    if (available < row.quantity) warnings.push('insufficient_stock');
    if (variant && variant.price !== row.addedPrice) warnings.push('price_changed');
    items.push({
      id: row.id,
      variantId: row.variantId,
      productId: product?.id ?? null,
      productName: product?.name ?? '',
      productSlug: product?.slug ?? null,
      imageUrl,
      sku: variant?.sku ?? '',
      size: variant?.size ?? '',
      color: variant?.color ?? '',
      quantity: row.quantity,
      unitPrice: variant?.price ?? 0,
      available,
      warnings,
    });
  }
  return {
    id: cart.id,
    version: cart.version,
    items,
    subtotal: items.reduce((total, item) => total + item.quantity * item.unitPrice, 0),
    currency: (await settings(transaction)).currency,
  };
}

export async function getCart(userId: string) {
  return auditedTransaction(async (transaction) =>
    cartSnapshot(await lockCart(userId, transaction), transaction),
  );
}

async function addLines(cart: CartModel, lines: CartLineInput[], transaction: Transaction) {
  for (const line of lines) {
    const variant = await ProductVariantModel.findOne({
      where: { id: line.variantId, status: 'active' },
      transaction,
    });
    if (
      !variant ||
      !(await ProductModel.findOne({
        where: { id: variant.productId, status: 'active' },
        transaction,
      }))
    )
      throw new NotFound('variant_unavailable');
    const item = await CartItemModel.findOne({
      where: { cartId: cart.id, variantId: variant.id },
      transaction,
    });
    if (item)
      await item.update({ quantity: Math.min(99, item.quantity + line.quantity) }, { transaction });
    else
      await CartItemModel.create(
        {
          id: randomUUID(),
          cartId: cart.id,
          variantId: variant.id,
          quantity: line.quantity,
          addedPrice: variant.price,
        },
        { transaction },
      );
  }
  if ((await CartItemModel.count({ where: { cartId: cart.id }, transaction })) > 100)
    throw new BaseError('cart_item_limit', 409, 'cart_item_limit');
  await cart.update({ version: cart.version + 1 }, { transaction });
  return cartSnapshot(cart, transaction);
}

export async function addItem(userId: string, expectedVersion: number, line: CartLineInput) {
  return auditedTransaction(async (transaction) => {
    const cart = await lockCart(userId, transaction);
    assertVersion(cart.version, expectedVersion);
    return addLines(cart, [line], transaction);
  });
}

export async function changeItem(
  userId: string,
  expectedVersion: number,
  itemId: string | null,
  quantity: number | null,
) {
  return auditedTransaction(async (transaction) => {
    const cart = await lockCart(userId, transaction);
    assertVersion(cart.version, expectedVersion);
    if (itemId) {
      const row = await CartItemModel.findOne({
        where: { id: itemId, cartId: cart.id },
        transaction,
      });
      if (!row) throw new NotFound();
      if (quantity === null) await row.destroy({ transaction });
      else await row.update({ quantity }, { transaction });
    } else await CartItemModel.destroy({ where: { cartId: cart.id }, transaction });
    await cart.update({ version: cart.version + 1 }, { transaction });
    return cartSnapshot(cart, transaction);
  });
}

export async function mergeCart(userId: string, key: string, lines: CartLineInput[]) {
  return runIdempotent(
    { scope: 'cart.merge', actorId: userId, key, payload: jsonValue(lines) },
    async (transaction): Promise<JsonValue> => {
      const cart = await lockCart(userId, transaction);
      return jsonValue(await addLines(cart, lines, transaction));
    },
  );
}
