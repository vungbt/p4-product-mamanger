import type { ListLocals } from '@p4/server-core';
import { requestBody, Unauthorized } from '@p4/server-core';
import type { OrderListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ProductVariantModel } from '@/sequelize/models/index.js';
import { cartLines } from '@/shared/commerce/input.js';
import { cancelAll } from './order-lifecycle.service.js';
import { placeLegacyOrder, placeOrder } from './order-placement.service.js';
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
    const body = requestBody(req);
    const key = req.header('Idempotency-Key') ?? '';
    if (body.data.quoteId !== undefined) {
      const result = await placeOrder(req.user, body.text('quoteId', 36), key);
      res.setHeader('Idempotent-Replayed', String(result.replayed));
      return res.jsonApi(StatusCodes.CREATED, { data: result.order });
    }
    const raw: unknown = body.data.items;
    if (!Array.isArray(raw)) return body.invalid('items');
    const lines = [];
    for (const item of raw) {
      const value: unknown = item;
      if (
        !value ||
        typeof value !== 'object' ||
        !('productId' in value) ||
        !('quantity' in value) ||
        typeof value.productId !== 'string'
      )
        return body.invalid('items');
      const variant = await ProductVariantModel.findOne({
        where: { productId: value.productId, isDefault: true },
      });
      if (!variant) return body.invalid('items');
      lines.push({ variantId: variant.id, quantity: value.quantity });
    }
    let shippingAddress: import('@p4/shared').ShippingAddressInput | undefined;
    if (body.data.shippingAddress) {
      const address = body.data.shippingAddress;
      if (
        typeof address !== 'object' ||
        !('fullName' in address) ||
        !('phone' in address) ||
        !('line1' in address) ||
        !('city' in address) ||
        typeof address.fullName !== 'string' ||
        typeof address.phone !== 'string' ||
        typeof address.line1 !== 'string' ||
        typeof address.city !== 'string' ||
        !address.fullName.trim() ||
        !address.phone.trim() ||
        !address.line1.trim() ||
        !address.city.trim() ||
        JSON.stringify(address).length > 2000
      )
        return body.invalid('shippingAddress');
      shippingAddress = {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        city: address.city,
      };
    }
    const order = await placeLegacyOrder(
      req.user,
      {
        items: cartLines(lines),
        addressId: body.optionalText('addressId', 36),
        shippingAddress,
        couponCode: body.optionalText('couponCode', 80),
      },
      key,
    );
    return res.jsonApi(StatusCodes.CREATED, { data: order, message: 'message:order_created' });
  } catch (error) {
    return next(error);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    await cancelAll(req.user, String(req.params.id));
    const order = await ordersService.getOrderById(String(req.params.id), req.user);
    return res.jsonApi(StatusCodes.OK, { data: order, message: 'message:order_cancelled' });
  } catch (error) {
    return next(error);
  }
}
