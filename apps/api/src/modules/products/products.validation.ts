import {
  queryNumber,
  queryText,
  uuidQueryRule,
  validate,
  validateListQuery,
} from '@p4/server-core';
import type {
  AdminProductListQuery,
  ListQuery,
  ProductListQuery,
  ProductPublicationStatus,
} from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';

export const validateCreateProduct = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      name: 'required|string',
      price: 'required|integer|min:0|max:2147483647',
      stock: 'integer|min:0',
      description: 'string',
      thumbnailStorageId: 'string',
      categoryId: uuidQueryRule,
      sizeGuideId: uuidQueryRule,
      slug: 'string|max:160',
      brand: 'string|max:255',
      material: 'string|max:255',
      careInstructions: 'string|max:10000',
      seoTitle: 'string|max:255',
      seoDescription: 'string|max:255',
      expectedVersion: 'integer|min:1',
      imageStorageIds: 'array|max:20',
    },
  })(req, res, next);

export const validateUpdateProduct = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      name: 'string',
      price: 'integer|min:0|max:2147483647',
      stock: 'integer|min:0',
      description: 'string',
      thumbnailStorageId: 'string',
      categoryId: uuidQueryRule,
      sizeGuideId: uuidQueryRule,
      slug: 'string|max:160',
      brand: 'string|max:255',
      material: 'string|max:255',
      careInstructions: 'string|max:10000',
      seoTitle: 'string|max:255',
      seoDescription: 'string|max:255',
      expectedVersion: 'integer|min:1',
      imageStorageIds: 'array|max:20',
    },
  })(req, res, next);

export const validateAddImage = validate({
  rules: {
    storageId: 'required|string',
    sortOrder: 'integer|min:0',
  },
});

type ProductSortField = NonNullable<ProductListQuery['sortBy']>;

const sortFields: ProductSortField[] = ['name', 'price', 'stock', 'createdAt'];

const productListRules = (query: Request['query']) => ({
  categoryId: uuidQueryRule,
  size: 'string|max:80',
  color: 'string|max:80',
  availability: 'sometimes|required|in:in_stock,out_of_stock',
  minRating: 'sometimes|required|numeric|min:1|max:5',
  minPrice: 'sometimes|required|numeric|min:0|max:2147483647',
  maxPrice: `sometimes|required|numeric|min:${queryNumber(query, 'minPrice') ?? 0}|max:2147483647`,
  minStock: 'sometimes|required|integer|min:0|max:2147483647',
  maxStock: `sometimes|required|integer|min:${queryNumber(query, 'minStock') ?? 0}|max:2147483647`,
});

const normalizeProductList = (
  query: Request['query'],
  base: ListQuery<ProductSortField>,
): ProductListQuery => ({
  ...base,
  categoryId: queryText(query, 'categoryId'),
  size: queryText(query, 'size')?.toUpperCase(),
  color: queryText(query, 'color')?.toLowerCase(),
  availability:
    queryText(query, 'availability') === 'in_stock'
      ? 'in_stock'
      : queryText(query, 'availability') === 'out_of_stock'
        ? 'out_of_stock'
        : undefined,
  minRating: queryNumber(query, 'minRating'),
  minPrice: queryNumber(query, 'minPrice'),
  maxPrice: queryNumber(query, 'maxPrice'),
  minStock: queryNumber(query, 'minStock'),
  maxStock: queryNumber(query, 'maxStock'),
});

export const validateProductsListQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'asc',
  legacy: false,
  rules: productListRules,
  normalize: normalizeProductList,
});

const publicationStatuses = [
  'draft',
  'active',
  'inactive',
  'archived',
] as const satisfies readonly ProductPublicationStatus[];

/** Admin list adds a publication status filter; storefront lists are always active-only. */
export const validateAdminProductsListQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'asc',
  legacy: false,
  rules: (query) => ({
    ...productListRules(query),
    status: `sometimes|required|in:${publicationStatuses.join(',')}`,
  }),
  normalize: (query, base): AdminProductListQuery => ({
    ...normalizeProductList(query, base),
    status: publicationStatuses.find((status) => status === queryText(query, 'status')),
  }),
});
