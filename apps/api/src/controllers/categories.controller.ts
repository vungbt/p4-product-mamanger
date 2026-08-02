import type { CategoryInput } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as categoriesService from '@/services/categories.service.js';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    return res.jsonApi(StatusCodes.OK, { data: await categoriesService.listCategories() });
  } catch (error) {
    return next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    return res.jsonApi(StatusCodes.OK, {
      data: await categoriesService.getCategoryById(String(req.params.id)),
    });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await categoriesService.createCategory(req.body as CategoryInput);
    return res.jsonApi(StatusCodes.CREATED, { data, message: 'message:category_created' });
  } catch (error) {
    return next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await categoriesService.updateCategory(
      String(req.params.id),
      req.body as Partial<CategoryInput>,
    );
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:category_updated' });
  } catch (error) {
    return next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await categoriesService.deleteCategory(String(req.params.id));
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:category_deleted' });
  } catch (error) {
    return next(error);
  }
}
