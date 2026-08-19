import type { ReviewInput } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Unauthorized } from '@/utils/errors/index.js';
import * as reviewsService from './reviews.service.js';

export async function listByProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await reviewsService.listReviews(String(req.params.id));
    return res.jsonApi(StatusCodes.OK, { data });
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const data = await reviewsService.createReview(
      req.user,
      String(req.params.id),
      req.body as ReviewInput,
    );
    return res.jsonApi(StatusCodes.CREATED, { data, message: 'message:review_created' });
  } catch (error) {
    return next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const data = await reviewsService.deleteReview(req.user, String(req.params.reviewId));
    return res.jsonApi(StatusCodes.OK, { data, message: 'message:review_deleted' });
  } catch (error) {
    return next(error);
  }
}
