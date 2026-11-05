import type { ProductInput, ProductListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { requestBody } from '@/shared/http-input.js';
import type { ListLocals } from '@/shared/list-query.js';
import * as productsService from './products.service.js';

function productInput(req: Request, create = false): Partial<ProductInput> {
  const body = requestBody(req);
  return {
    name: create ? body.text('name') : body.optionalText('name'),
    description: body.optionalText('description', 100000),
    price: body.data.price === undefined ? undefined : body.integer('price'),
    stock: body.data.stock === undefined ? undefined : body.integer('stock'),
    categoryId: body.data.categoryId === null ? null : body.optionalText('categoryId', 36),
    imageStorageId: body.optionalText('imageStorageId'),
    imageStorageIds:
      body.data.imageStorageIds === undefined ? undefined : body.strings('imageStorageIds'),
    slug: body.optionalText('slug', 160),
    brand: body.optionalText('brand'),
    material: body.optionalText('material'),
    careInstructions: body.optionalText('careInstructions', 10000),
    seoTitle: body.optionalText('seoTitle'),
    seoDescription: body.optionalText('seoDescription'),
    sizeGuideId: body.data.sizeGuideId === null ? null : body.optionalText('sizeGuideId', 36),
    expectedVersion:
      body.data.expectedVersion === undefined ? undefined : body.integer('expectedVersion', 1),
  };
}

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
    const input = productInput(req, true);
    const body = requestBody(req);
    const product = await productsService.createProduct({
      ...input,
      name: body.text('name'),
      description: body.optionalText('description', 100000) ?? '',
      price: body.integer('price'),
      stock: body.integer('stock'),
    });
    return res.jsonApi(StatusCodes.CREATED, { data: product, message: 'message:product_created' });
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.updateProduct(String(req.params.id), productInput(req));
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
