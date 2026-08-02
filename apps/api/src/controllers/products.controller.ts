import type { ProductInput } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import * as productsService from '@/services/products.service.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = 1, pageSize = 10, q = '' } = req.pagination ?? {};
    const result = await productsService.listProducts({ page, pageSize, q });
    return res.jsonApi(200, { data: result.data, meta: result.meta });
  } catch (error) {
    return next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.getProductById(String(req.params.id));
    return res.jsonApi(200, { data: product });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.createProduct(req.body as ProductInput);
    return res.jsonApi(201, { data: product, message: 'message:product_created' });
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
    return res.jsonApi(200, { data: product, message: 'message:product_updated' });
  } catch (error) {
    return next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.deleteProduct(String(req.params.id));
    return res.jsonApi(200, { data: product, message: 'message:product_deleted' });
  } catch (error) {
    return next(error);
  }
}
