import type { ProductInput, ProductListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { ListLocals } from '@/shared/list-query.js';
import * as productsService from './products.service.js';

export async function list(
  _req: Request,
  res: Response<unknown, ListLocals<ProductListQuery>>,
  next: NextFunction,
) {
  try {
    const result = await productsService.listProducts(res.locals.listQuery);
    return res.jsonApi(StatusCodes.OK, { data: result.data, meta: result.meta });
  } catch (error) {
    return next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.getProductById(String(req.params.id));
    return res.jsonApi(StatusCodes.OK, { data: product });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.createProduct(req.body as ProductInput);
    return res.jsonApi(StatusCodes.CREATED, { data: product, message: 'message:product_created' });
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.updateProduct(
      String(req.params.id),
      req.body as Partial<ProductInput>,
    );
    return res.jsonApi(StatusCodes.OK, { data: product, message: 'message:product_updated' });
  } catch (error) {
    return next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.deleteProduct(String(req.params.id));
    return res.jsonApi(StatusCodes.OK, { data: product, message: 'message:product_deleted' });
  } catch (error) {
    return next(error);
  }
}

export async function addImage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await productsService.addProductImage(String(req.params.id), req.body);
    return res.jsonApi(StatusCodes.CREATED, { data, message: 'message:product_updated' });
  } catch (error) {
    return next(error);
  }
}

export async function removeImage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await productsService.removeProductImage(
      String(req.params.id),
      String(req.params.imageId),
    );
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:product_updated' });
  } catch (error) {
    return next(error);
  }
}
