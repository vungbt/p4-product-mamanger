import { randomUUID } from 'node:crypto';
import type { ReviewListQuery } from '@p4/shared';
import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { OrderItemModel, ProductModel, ReviewModel, sequelize } from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, requestBody, routeId, uuidRouteId } from '@/shared/http-input.js';
import { searchPattern } from '@/shared/list-filters.js';
import { queryNumber, queryText, validateListQuery } from '@/shared/list-query.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { auditPolicies } from './reviews.audit.js';
import * as reviews from './reviews.service.js';

const router = Router();
const adminList = validateListQuery({
  sortFields: ['rating', 'createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({
    rating: 'sometimes|required|integer|min:1|max:5',
    status: 'sometimes|required|in:pending,published,hidden',
    productId: 'string|max:128',
  }),
  normalize: (query, base) => ({
    ...base,
    rating: queryNumber(query, 'rating'),
    status: queryText(query, 'status'),
    productId: queryText(query, 'productId'),
  }),
});

router.post(
  '/order-items/:id/reviews',
  authRequired,
  apiHandler(async (req) => {
    const body = requestBody(req);
    const item = await OrderItemModel.findByPk(uuidRouteId(req));
    if (!item) throw new NotFound();
    return reviews.createReview(currentUser(req), item.productId, {
      orderItemId: item.id,
      rating: body.integer('rating', 1, 5),
      comment: body.text('comment', 10000),
      mediaIds: body.data.mediaIds === undefined ? [] : body.strings('mediaIds', 10, 36),
    });
  }, 201),
);
router.patch(
  '/reviews/:id',
  authRequired,
  apiHandler(async (req) => {
    const body = requestBody(req);
    return reviews.changeReview(
      currentUser(req),
      uuidRouteId(req),
      body.integer('expectedVersion', 1),
      { rating: body.integer('rating', 1, 5), comment: body.text('comment', 10000) },
    );
  }),
);
router.post(
  '/reviews/:id/moderation',
  authRequired,
  requireAbility('moderate', 'Review'),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return reviews.changeReview(
      currentUser(req),
      uuidRouteId(req),
      body.integer('expectedVersion', 1),
      {
        moderationStatus: body.enum('status', ['published', 'hidden']),
        reason: body.text('reason', 1000),
      },
    );
  }),
);
router.put(
  '/reviews/:id/reply',
  authRequired,
  requireAbility('reply', 'Review'),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return reviews.changeReview(
      currentUser(req),
      uuidRouteId(req),
      body.integer('expectedVersion', 1),
      { reply: body.text('reply', 10000) },
    );
  }),
);
router.post(
  '/reviews/:id/reports',
  authRequired,
  apiHandler(async (req) => {
    const id = uuidRouteId(req);
    if (!(await ReviewModel.findOne({ where: { id, moderationStatus: 'published' } })))
      throw new NotFound();
    await sequelize.query(
      'INSERT INTO review_reports (id,review_id,user_id,reason,created_at,updated_at) VALUES (:id,:reviewId,:userId,:reason,NOW(),NOW()) ON CONFLICT (review_id,user_id) DO NOTHING',
      {
        replacements: {
          id: randomUUID(),
          reviewId: id,
          userId: currentUser(req).id,
          reason: requestBody(req).text('reason', 1000),
        },
      },
    );
    return { accepted: true };
  }, 202),
);
router.get(
  '/admin/reviews',
  authRequired,
  requireAbility('read', 'Review'),
  adminList,
  listHandler(async (req, query: ReviewListQuery) => {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 10;
    const result = await ReviewModel.findAndCountAll({
      where: {
        ...(query.rating ? { rating: query.rating } : {}),
        ...(query.q ? { comment: { [Op.iLike]: searchPattern(query.q) } } : {}),
        ...(queryText(req.query, 'status')
          ? { moderationStatus: queryText(req.query, 'status') }
          : {}),
        ...(queryText(req.query, 'productId')
          ? { productId: queryText(req.query, 'productId') }
          : {}),
      },
      order: [
        [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return {
      data: result.rows.map(reviews.toReview),
      meta: buildPaginationMeta(page, pageSize, result.count),
    };
  }),
);
router.get(
  '/products/:id/review-summary',
  apiHandler(async (req) => {
    const productId = routeId(req);
    if (!(await ProductModel.findOne({ where: { id: productId, status: 'active' } })))
      throw new NotFound();
    const rows = await ReviewModel.findAll({
      where: { productId, moderationStatus: 'published', rating: { [Op.between]: [1, 5] } },
      attributes: ['rating'],
    });
    const distribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: rows.filter((row) => row.rating === rating).length,
    }));
    return {
      count: rows.length,
      average: rows.length ? rows.reduce((sum, row) => sum + row.rating, 0) / rows.length : 0,
      distribution,
    };
  }),
);
export default applyAuditPolicies(router, auditPolicies);
