import type { NextFunction, Request, Response } from 'express';
import validate from '@/shared/validation.js';

export const validateCheckoutBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      items: 'required|array|min:1',
      'items.*.productId': 'required|string',
      'items.*.quantity': 'required|integer|min:1',
      addressId: 'string',
      'shippingAddress.fullName': 'string',
      'shippingAddress.phone': 'string',
      'shippingAddress.line1': 'string',
      'shippingAddress.city': 'string',
      shippingFee: 'integer|min:0',
      couponCode: 'string',
    },
  })(req, res, next);

export const validateShipmentUpdateBody = (req: Request, res: Response, next: NextFunction) =>
  validate({
    rules: {
      status: 'string',
      carrier: 'string',
      trackingCode: 'string',
    },
  })(req, res, next);
