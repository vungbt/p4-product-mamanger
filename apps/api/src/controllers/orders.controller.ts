import type { NextFunction, Request, Response } from 'express';
import type { CheckoutItem } from '@/services/orders.service.js';
import * as ordersService from '@/services/orders.service.js';
import { Unauthorized } from '@/utils/errors/index.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, pageSize = 10, q = '' } = req.pagination ?? {};
    const result = await ordersService.listOrders({ page, pageSize, q });
    return res.jsonApi(200, { data: result.data, meta: result.meta });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new Unauthorized();
    }
    const { items } = req.body as { items: CheckoutItem[] };
    const order = await ordersService.createOrder(req.user, items);
    return res.jsonApi(201, { data: order, message: 'message:order_created' });
  } catch (error) {
    return next(error);
  }
}
