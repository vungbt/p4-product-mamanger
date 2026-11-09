import type { ListLocals } from '@p4/server-core';
import { requestBody, Unauthorized } from '@p4/server-core';
import type { ReviewListQuery } from '@p4/shared';
import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as reviewsService from './reviews.service.js';

export async function listByProduct(
  req: Request,
  res: Response<unknown, ListLocals<ReviewListQuery | undefined>>,
  next: NextFunction,
) {
  try {
    const result = await reviewsService.listReviews(String(req.params.id), res.locals.listQuery);
    return res.jsonApi(StatusCodes.OK, result);
  } catch (error) {
    return next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new Unauthorized();
    const body = requestBody(req);
    const data = await reviewsService.createReview(req.user, String(req.params.id), {
      rating: body.integer('rating', 1, 5),
      comment: body.text('comment', 10000),
      orderItemId: body.optionalText('orderItemId', 36),
      mediaIds: body.data.mediaIds === undefined ? [] : body.strings('mediaIds', 10, 36),
    });
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
