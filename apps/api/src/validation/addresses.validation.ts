import type { NextFunction, Request, Response } from 'express';
import validate from '@/validation/index.js';

export const validateAddressBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      fullName: 'required|string',
      phone: 'required|string',
      line1: 'required|string',
      city: 'required|string',
      isDefault: 'boolean',
    },
  })(req, res, next);

export const validateUpdateAddressBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      fullName: 'string',
      phone: 'string',
      line1: 'string',
      city: 'string',
      isDefault: 'boolean',
    },
  })(req, res, next);
