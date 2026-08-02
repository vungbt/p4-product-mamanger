import type { NextFunction, Request, Response } from 'express';
import validate from '@/validation/index.js';

export const validateCheckoutBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      items: 'required|array|min:1',
      'items.*.productId': 'required|string',
      'items.*.quantity': 'required|integer|min:1',
    },
  })(req, res, next);
