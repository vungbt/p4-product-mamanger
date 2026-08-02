import type { NextFunction, Request, Response } from 'express';
import validate from '@/validation/index.js';

export const validateCreateProduct = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      name: 'required|string',
      price: 'required|numeric|min:0',
      stock: 'required|integer|min:0',
      description: 'string',
      imageStorageId: 'string',
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
    },
  })(req, res, next);
