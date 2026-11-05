import type { ProductListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { queryNumber, queryText, uuidQueryRule, validateListQuery } from '@/shared/list-query.js';
import validate from '@/shared/validation.js';

export const validateCreateProduct = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      name: 'required|string',
      price: 'required|numeric|min:0',
      stock: 'required|integer|min:0',
      description: 'string',
      imageStorageId: 'string',
      categoryId: 'string',
    },
  })(req, res, next);

export const validateUpdateProduct = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      name: 'string',
      price: 'numeric|min:0',
      stock: 'integer|min:0',
      description: 'string',
      imageStorageId: 'string',
      categoryId: 'string',
    },
  })(req, res, next);

export const validateAddImage = validate({
  rules: {
    imageStorageId: 'required|string',
    sortOrder: 'integer|min:0',
  },
});

const sortFields: NonNullable<ProductListQuery['sortBy']>[] = [
  'name',
  'price',
  'stock',
  'createdAt',
];

export const validateProductsListQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'asc',
  legacy: false,
  rules: (query) => ({
    categoryId: uuidQueryRule,
    minPrice: 'sometimes|required|numeric|min:0|max:2147483647',
    maxPrice: `sometimes|required|numeric|min:${queryNumber(query, 'minPrice') ?? 0}|max:2147483647`,
    minStock: 'sometimes|required|integer|min:0|max:2147483647',
    maxStock: `sometimes|required|integer|min:${queryNumber(query, 'minStock') ?? 0}|max:2147483647`,
  }),
  normalize: (query, base): ProductListQuery => ({
    ...base,
    categoryId: queryText(query, 'categoryId'),
    minPrice: queryNumber(query, 'minPrice'),
    maxPrice: queryNumber(query, 'maxPrice'),
    minStock: queryNumber(query, 'minStock'),
    maxStock: queryNumber(query, 'maxStock'),
  }),
});
