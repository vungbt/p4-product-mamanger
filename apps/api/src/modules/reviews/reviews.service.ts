import type { Review, ReviewInput, ReviewListQuery, User } from '@p4/shared';
import { Op, type WhereOptions } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import { ProductModel, ReviewModel, UserModel } from '@/sequelize/models/index.js';
import type { ReviewAttributes } from '@/sequelize/models/review.model.js';
import { searchPattern } from '@/shared/list-filters.js';
import type { ModelOrder } from '@/types/database.js';
import { BadRequest, Forbidden, NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';

type ReviewWithUser = ReviewModel & { user?: UserModel };

const reviewFields = ['id', 'productId', 'userId', 'rating', 'comment'] satisfies (keyof Review)[];

function toReview(row: ReviewWithUser): Review {
  return {
    ...selectFields(row, reviewFields),
    userEmail: row.user?.email,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listReviews(productId: string, query?: ReviewListQuery) {
  const product = await ProductModel.findByPk(productId);
  if (!product) throw new NotFound(errorKeys.productNotFound);
  const options = {
    where: {
      productId,
      ...(query?.rating !== undefined ? { rating: query.rating } : {}),
      ...(query?.q ? { comment: { [Op.iLike]: searchPattern(query.q) } } : {}),
    } satisfies WhereOptions<ReviewAttributes>,
    include: [{ model: UserModel, as: 'user', attributes: ['id', 'email'] }],
    order: [
      [query?.sortBy ?? 'createdAt', query?.sortOrder === 'asc' ? 'ASC' : 'DESC'],
      ['id', 'ASC'],
    ] satisfies ModelOrder<ReviewAttributes>,
  };

  if (!query) return { data: (await ReviewModel.findAll(options)).map(toReview) };

  const { rows, count } = await ReviewModel.findAndCountAll({
    ...options,
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });
  return { data: rows.map(toReview), meta: buildPaginationMeta(query.page, query.pageSize, count) };
}

export async function createReview(user: User, productId: string, input: ReviewInput) {
  const product = await ProductModel.findByPk(productId);
  if (!product) throw new NotFound(errorKeys.productNotFound);
  if (input.rating < 1 || input.rating > 5) throw new BadRequest(errorKeys.invalidQuantity);

  const existing = await ReviewModel.findOne({ where: { productId, userId: user.id } });
  if (existing) throw new BadRequest(errorKeys.reviewExists);

  const row = await ReviewModel.create({
    productId,
    userId: user.id,
    rating: input.rating,
    comment: input.comment ?? '',
  });
  const full = (await ReviewModel.findByPk(row.id, {
    include: [{ model: UserModel, as: 'user', attributes: ['id', 'email'] }],
  })) as ReviewWithUser;
  return toReview(full);
}

export async function deleteReview(user: User, reviewId: string) {
  const row = await ReviewModel.findByPk(reviewId);
  if (!row) throw new NotFound(errorKeys.notFound);
  if (user.role !== 'admin' && row.userId !== user.id) {
    throw new Forbidden(errorKeys.forbidden);
  }
  await row.destroy();
  return { ok: true as const };
}
