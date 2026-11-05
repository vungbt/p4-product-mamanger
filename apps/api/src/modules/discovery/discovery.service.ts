import type { ProductListQuery } from '@p4/shared';
import { sequelize } from '@/sequelize/models/index.js';
import { searchPattern } from '@/shared/list-filters.js';

/** SQL identifiers are fixed; every untrusted value is escaped by the PostgreSQL dialect. */
export function eligibleVariantSql(query: ProductListQuery, alias = 'v') {
  const conditions = [`${alias}.status = 'active'`];
  if (query.size) conditions.push(`${alias}.size = ${sequelize.escape(query.size)}`);
  if (query.color) conditions.push(`${alias}.color = ${sequelize.escape(query.color)}`);
  if (query.availability)
    conditions.push(
      `${alias}.on_hand - ${alias}.reserved ${query.availability === 'in_stock' ? '>' : '<='} 0`,
    );
  if (query.minPrice !== undefined)
    conditions.push(`${alias}.price >= ${sequelize.escape(query.minPrice)}`);
  if (query.maxPrice !== undefined)
    conditions.push(`${alias}.price <= ${sequelize.escape(query.maxPrice)}`);
  return conditions.join(' AND ');
}
export function publicProductSql(query: ProductListQuery) {
  const conditions = [
    "p.status = 'active'",
    `EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND ${eligibleVariantSql(query)})`,
  ];
  if (query.categoryId) conditions.push(`p.category_id = ${sequelize.escape(query.categoryId)}`);
  if (query.q) {
    const value = sequelize.escape(searchPattern(query.q));
    conditions.push(`(p.name ILIKE ${value} OR p.description ILIKE ${value})`);
  }
  if (query.minRating !== undefined)
    conditions.push(
      `(SELECT AVG(r.rating) FROM reviews r WHERE r.product_id = p.id AND r.moderation_status = 'published') >= ${sequelize.escape(query.minRating)}`,
    );
  return conditions.join(' AND ');
}
export async function facets(query: ProductListQuery) {
  const predicate = publicProductSql(query);
  const [sizes] = await sequelize.query(
    `SELECT v.size AS value, COUNT(DISTINCT p.id)::int AS count FROM products p JOIN product_variants v ON v.product_id=p.id WHERE ${predicate} AND ${eligibleVariantSql(query)} GROUP BY v.size ORDER BY v.size`,
  );
  const [colors] = await sequelize.query(
    `SELECT v.color AS value, COUNT(DISTINCT p.id)::int AS count FROM products p JOIN product_variants v ON v.product_id=p.id WHERE ${predicate} AND ${eligibleVariantSql(query)} GROUP BY v.color ORDER BY v.color`,
  );
  const [categories] = await sequelize.query(
    `SELECT c.id,c.name,COUNT(DISTINCT p.id)::int AS count FROM products p JOIN categories c ON c.id=p.category_id WHERE ${predicate} GROUP BY c.id,c.name ORDER BY c.name,c.id`,
  );
  const [range] = await sequelize.query(
    `SELECT MIN(v.price)::int AS "minPrice",MAX(v.price)::int AS "maxPrice",COUNT(DISTINCT p.id)::int AS total FROM products p JOIN product_variants v ON v.product_id=p.id WHERE ${predicate} AND ${eligibleVariantSql(query)}`,
  );
  return { sizes, colors, categories, range: range[0] ?? null };
}
