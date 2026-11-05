import * as v from 'valibot';
import type { ImportResource } from './index.js';

const requiredText = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255));
const text = v.optional(v.pipe(v.string(), v.maxLength(10000)), '');
const integer = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^-?\d+$/),
  v.transform((value) => Number(value)),
  v.integer(),
  v.minValue(-2147483647),
  v.maxValue(2147483647),
);
const nonnegative = v.pipe(integer, v.minValue(0));
export const categoryImportSchema = v.object({
  name: requiredText,
  slug: v.pipe(requiredText, v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  description: text,
});
export const productImportSchema = v.object({
  name: requiredText,
  slug: v.pipe(requiredText, v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  price: nonnegative,
  description: text,
  categorySlug: v.optional(v.string(), ''),
  initialStock: v.optional(nonnegative, '0'),
  brand: v.optional(v.string(), ''),
  material: v.optional(v.string(), ''),
});
export const variantImportSchema = v.object({
  productSlug: requiredText,
  sku: requiredText,
  size: requiredText,
  color: requiredText,
  price: nonnegative,
  barcode: v.optional(v.string(), ''),
});
export const inventoryImportSchema = v.object({
  sku: requiredText,
  quantity: v.pipe(
    integer,
    v.check((quantity) => quantity !== 0),
  ),
  reason: requiredText,
});
export type ParsedImportRow =
  | { resource: 'categories'; value: v.InferOutput<typeof categoryImportSchema> }
  | { resource: 'products'; value: v.InferOutput<typeof productImportSchema> }
  | { resource: 'variants'; value: v.InferOutput<typeof variantImportSchema> }
  | { resource: 'inventory'; value: v.InferOutput<typeof inventoryImportSchema> };
export function parseImportRow(resource: ImportResource, raw: unknown): ParsedImportRow {
  switch (resource) {
    case 'categories':
      return { resource, value: v.parse(categoryImportSchema, raw) };
    case 'products':
      return { resource, value: v.parse(productImportSchema, raw) };
    case 'variants':
      return { resource, value: v.parse(variantImportSchema, raw) };
    case 'inventory':
      return { resource, value: v.parse(inventoryImportSchema, raw) };
  }
}
export const IMPORT_COLUMNS: Record<ImportResource, readonly string[]> = {
  categories: Object.keys(categoryImportSchema.entries),
  products: Object.keys(productImportSchema.entries),
  variants: Object.keys(variantImportSchema.entries),
  inventory: Object.keys(inventoryImportSchema.entries),
};
