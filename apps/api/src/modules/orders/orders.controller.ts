import type { OrderListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { ListLocals } from '@/shared/list-query.js';
import { Unauthorized } from '@/utils/errors/index.js';
import type { CheckoutInput } from './orders.service.js';
import * as ordersService from './orders.service.js';

export async function list(
  _req: Request,
  res: Response<unknown, ListLocals<OrderListQuery>>,
  next: NextFunction,
) {
  try {
    const result = await ordersService.listOrders(res.locals.listQuery);
    return res.jsonApi(StatusCodes.OK, { data: result.data, meta: result.meta });
  } catch (error) {
    return next(error);
  }
}

export async function listMine(
  req: Request,
  res: Response<unknown, ListLocals<OrderListQuery>>,
  next: NextFunction,
) {
  try {
    if (!req.user) throw new Unauthorized();
    const result = await ordersService.listMyOrders(req.user.id, res.locals.listQuery);
    return res.jsonApi(StatusCodes.OK, { data: result.data, meta: result.meta });
  } catch (error) {
    return next(error);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const order = await ordersService.getOrderById(String(req.params.id), req.user);
    return res.jsonApi(StatusCodes.OK, { data: order });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const order = await ordersService.createOrder(req.user, req.body as CheckoutInput);
    return res.jsonApi(StatusCodes.CREATED, { data: order, message: 'message:order_created' });
  } catch (error) {
    return next(error);
  }
}

export async function updateShipment(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.updateShipment(String(req.params.id), req.body);
    return res.jsonApi(StatusCodes.OK, { data: order, message: 'message:shipment_updated' });
  } catch (error) {
    return next(error);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const order = await ordersService.cancelOrder(String(req.params.id), req.user);
    return res.jsonApi(StatusCodes.OK, { data: order, message: 'message:order_cancelled' });
  } catch (error) {
    return next(error);
  }
}
