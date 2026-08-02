import type { Review, ReviewInput, User } from '@p4/shared';
import { errorKeys } from '@/constants/index.js';
import { ProductModel, ReviewModel, UserModel } from '@/sequelize/models/index.js';
import { BadRequest, Forbidden, NotFound } from '@/utils/errors/index.js';

type ReviewWithUser = ReviewModel & { user?: UserModel };

function toReview(row: ReviewWithUser): Review {
  return {
    id: row.id,
    productId: row.productId,
    userId: row.userId,
    userEmail: row.user?.email,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listReviews(productId: string) {
  const product = await ProductModel.findByPk(productId);
  if (!product) throw new NotFound(errorKeys.productNotFound);
  const rows = (await ReviewModel.findAll({
    where: { productId },
    include: [{ model: UserModel, as: 'user', attributes: ['id', 'email'] }],
    order: [['createdAt', 'DESC']],
  })) as ReviewWithUser[];
  return rows.map(toReview);
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
