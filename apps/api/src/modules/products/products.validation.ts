import type { NextFunction, Request, Response } from 'express';
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
