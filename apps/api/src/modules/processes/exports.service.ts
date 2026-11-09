import type { ExportResource, FileFormat } from '@p4/processes/shared';
import { BaseError, dateRange, numberRange, searchPattern } from '@p4/server-core';
import { cast, col, fn, Op, where as sqlWhere, type WhereOptions } from 'sequelize';
import * as v from 'valibot';
import type { CategoryAttributes } from '@/sequelize/models/category.model.js';
import {
  CategoryModel,
  OrderModel,
  ProductModel,
  ProductVariantModel,
} from '@/sequelize/models/index.js';
import type { OrderAttributes } from '@/sequelize/models/order.model.js';
import type { ProductAttributes } from '@/sequelize/models/product.model.js';
import type { ProductVariantAttributes } from '@/sequelize/models/product-variant.model.js';
import { selectFields } from '@/utils/select-fields.js';
import { reportQuery, reportRows } from '../reports/reports.service.js';
import { spreadsheetBuffer } from './spreadsheets.service.js';

const common = {
  q: v.optional(v.pipe(v.string(), v.maxLength(255)), ''),
  sortOrder: v.optional(v.picklist(['asc', 'desc']), 'asc'),
};
const amount = v.optional(
  v.pipe(
    v.union([v.number(), v.string()]),
    v.transform((value) => Number(value)),
    v.integer(),
    v.minValue(0),
    v.maxValue(2147483647),
  ),
);
function ranges(min: number | undefined, max: number | undefined) {
  if (min !== undefined && max !== undefined && min > max)
    throw new BaseError('invalid_export_range');
}
export async function exportBuffer(
  resource: ExportResource,
  format: FileFormat,
  query: Record<string, string | number | boolean | null>,
) {
  let rows: Record<string, string | number | null>[];
  if (resource === 'categories') {
    const filters = v.parse(
      v.strictObject({
        ...common,
        description: v.optional(v.picklist(['all', 'has', 'none']), 'all'),
        sortBy: v.optional(v.picklist(['name', 'slug', 'description', 'createdAt']), 'slug'),
      }),
      query,
    );
    const conditions: WhereOptions<CategoryAttributes>[] = [];
    if (filters.q)
      conditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: searchPattern(filters.q) } },
          { slug: { [Op.iLike]: searchPattern(filters.q) } },
          { description: { [Op.iLike]: searchPattern(filters.q) } },
        ],
      });
    if (filters.description !== 'all')
      conditions.push(
        sqlWhere(fn('btrim', col('description')), {
          [filters.description === 'has' ? Op.ne : Op.eq]: '',
        }),
      );
    const result = await CategoryModel.findAll({
      where: { [Op.and]: conditions },
      order: [
        [filters.sortBy, filters.sortOrder === 'desc' ? 'DESC' : 'ASC'],
        ['id', 'ASC'],
      ],
      limit: 10001,
    });
    rows = result.map((row) => selectFields(row, ['name', 'slug', 'description']));
  } else if (resource === 'products') {
    const filters = v.parse(
      v.strictObject({
        ...common,
        status: v.optional(v.picklist(['draft', 'active', 'inactive', 'archived'])),
        categoryId: v.optional(v.pipe(v.string(), v.uuid())),
        minPrice: amount,
        maxPrice: amount,
        sortBy: v.optional(v.picklist(['name', 'slug', 'price', 'stock', 'createdAt']), 'slug'),
      }),
      query,
    );
    ranges(filters.minPrice, filters.maxPrice);
    const where: WhereOptions<ProductAttributes> = {
      ...(filters.q
        ? {
            [Op.or]: [
              { name: { [Op.iLike]: searchPattern(filters.q) } },
              { slug: { [Op.iLike]: searchPattern(filters.q) } },
            ],
          }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
        ? { price: numberRange(filters.minPrice, filters.maxPrice) }
        : {}),
    };
    const products = await ProductModel.findAll({
      where,
      order: [
        [filters.sortBy, filters.sortOrder === 'desc' ? 'DESC' : 'ASC'],
        ['id', 'ASC'],
      ],
      limit: 10001,
    });
    const categories = new Map(
      (await CategoryModel.findAll({ attributes: ['id', 'slug'] })).map((row) => [
        row.id,
        row.slug,
      ]),
    );
    rows = products.map((row) => ({
      ...selectFields(row, ['name', 'slug', 'price', 'description', 'brand', 'material']),
      categorySlug: row.categoryId ? (categories.get(row.categoryId) ?? '') : '',
      initialStock: 0,
    }));
  } else if (resource === 'variants' || resource === 'inventory') {
    const filters = v.parse(
      v.strictObject({
        ...common,
        productId: v.optional(v.pipe(v.string(), v.uuid())),
        status: v.optional(v.picklist(['active', 'inactive'])),
        sortBy: v.optional(v.picklist(['sku', 'price', 'onHand', 'reserved', 'createdAt']), 'sku'),
      }),
      query,
    );
    const where: WhereOptions<ProductVariantAttributes> = {
      ...(filters.q ? { sku: { [Op.iLike]: searchPattern(filters.q) } } : {}),
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const variants = await ProductVariantModel.findAll({
      where,
      order: [
        [filters.sortBy, filters.sortOrder === 'desc' ? 'DESC' : 'ASC'],
        ['id', 'ASC'],
      ],
      limit: 10001,
    });
    if (resource === 'inventory')
      rows = variants.map((row) => ({
        ...selectFields(row, ['sku', 'onHand', 'reserved']),
        available: row.onHand - row.reserved,
      }));
    else {
      const products = new Map(
        (
          await ProductModel.findAll({
            where: { id: [...new Set(variants.map((row) => row.productId))] },
            attributes: ['id', 'slug'],
          })
        ).map((row) => [row.id, row.slug]),
      );
      rows = variants.map((row) => ({
        ...selectFields(row, ['sku', 'size', 'color', 'price', 'barcode']),
        productSlug: products.get(row.productId) ?? '',
      }));
    }
  } else if (resource === 'orders') {
    const date = v.optional(
      v.pipe(
        v.string(),
        v.check(
          (value) => /^\d{4}-\d{2}-\d{2}(T.*Z)?$/.test(value) && Number.isFinite(Date.parse(value)),
        ),
      ),
    );
    const filters = v.parse(
      v.strictObject({
        ...common,
        status: v.optional(v.picklist(['pending', 'paid', 'shipping', 'completed', 'cancelled'])),
        lifecycleStatus: v.optional(
          v.picklist(['pending_confirmation', 'confirmed', 'processing', 'completed', 'cancelled']),
        ),
        minTotal: amount,
        maxTotal: amount,
        createdFrom: date,
        createdTo: date,
        sortBy: v.optional(v.picklist(['createdAt', 'total', 'status', 'id']), 'createdAt'),
      }),
      query,
    );
    ranges(filters.minTotal, filters.maxTotal);
    const where: WhereOptions<OrderAttributes> = {
      ...(filters.q
        ? {
            [Op.and]: [sqlWhere(cast(col('id'), 'text'), { [Op.iLike]: searchPattern(filters.q) })],
          }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.lifecycleStatus ? { lifecycleStatus: filters.lifecycleStatus } : {}),
      ...(filters.minTotal !== undefined || filters.maxTotal !== undefined
        ? { total: numberRange(filters.minTotal, filters.maxTotal) }
        : {}),
      ...(filters.createdFrom || filters.createdTo
        ? { createdAt: dateRange(filters.createdFrom, filters.createdTo) }
        : {}),
    };
    rows = (
      await OrderModel.findAll({
        where,
        order: [
          [filters.sortBy, filters.sortOrder === 'desc' ? 'DESC' : 'ASC'],
          ['id', 'ASC'],
        ],
        limit: 10001,
      })
    ).map((row) => ({
      ...selectFields(row, [
        'id',
        'lifecycleStatus',
        'subtotal',
        'discountAmount',
        'shippingFee',
        'total',
        'currency',
      ]),
      createdAt: row.createdAt.toISOString(),
    }));
  } else rows = await reportRows('sales', reportQuery(query));
  if (rows.length > 10000) throw new BaseError('export_row_limit', 400, 'export_row_limit');
  return {
    buffer: await spreadsheetBuffer(rows, format, rows[0] ? Object.keys(rows[0]) : ['No data']),
    count: rows.length,
  };
}
