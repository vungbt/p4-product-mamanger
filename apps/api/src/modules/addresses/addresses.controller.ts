import type { ShippingAddressInput } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Unauthorized } from '@/utils/errors/index.js';
import * as addressesService from './addresses.service.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const data = await addressesService.listAddresses(req.user.id);
    return res.jsonApi(StatusCodes.OK, { data });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const body = req.body as ShippingAddressInput & { isDefault?: boolean };
    const data = await addressesService.createAddress(req.user, body);
    return res.jsonApi(StatusCodes.CREATED, { data, message: 'message:address_created' });
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const data = await addressesService.updateAddress(req.user.id, String(req.params.id), req.body);
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:address_updated' });
  } catch (error) {
    return next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const data = await addressesService.deleteAddress(req.user.id, String(req.params.id));
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:address_deleted' });
  } catch (error) {
    return next(error);
  }
}
