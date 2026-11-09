import type { Review, ReviewInput, ReviewListQuery, User } from '@p4/shared';
import { Op, type WhereOptions } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import { canAccessRecord, hasAccess } from '@/middlewares/ability.middleware.js';
import {
  FileModel,
  OrderItemModel,
  OrderModel,
  ProductModel,
  ReviewModel,
  sequelize,
  UserModel,
} from '@/sequelize/models/index.js';
import type { ReviewAttributes } from '@/sequelize/models/review.model.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { recordAudit } from '@/shared/audit/record.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { searchPattern } from '@/shared/list-filters.js';
import type { ModelOrder } from '@/types/database.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { BadRequest, Forbidden, NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';

type ReviewWithUser = ReviewModel & { user?: UserModel };

const reviewFields = [
  'id',
  'productId',
  'userId',
  'rating',
  'comment',
  'moderationStatus',
  'verifiedPurchase',
  'mediaIds',
  'reply',
  'version',
] satisfies (keyof Review)[];

export function toReview(row: ReviewWithUser): Review {
  return {
    ...selectFields(row, reviewFields),

    createdAt: row.createdAt.toISOString(),
  };
}

export async function listReviews(productId: string, query?: ReviewListQuery) {
  const product = await ProductModel.findByPk(productId);
  if (product?.status !== 'active') throw new NotFound(errorKeys.productNotFound);
  const options = {
    where: {
      productId,
      moderationStatus: 'published',
      ...(query?.rating !== undefined ? { rating: query.rating } : {}),
      ...(query?.q ? { comment: { [Op.iLike]: searchPattern(query.q) } } : {}),
    } satisfies WhereOptions<ReviewAttributes>,
    include: [{ model: UserModel, as: 'user', attributes: ['id', 'displayName'] }],
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
  if (
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5 ||
    typeof input.comment !== 'string' ||
    input.comment.length > 10000
  )
    throw new BadRequest(errorKeys.invalidQuantity);
  return auditedTransaction(async (transaction) => {
    await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:key))', {
      replacements: { key: `review:${user.id}:${productId}` },
      transaction,
    });
    const product = await ProductModel.findByPk(productId, { transaction });
    if (product?.status !== 'active') throw new NotFound(errorKeys.productNotFound);
    const orders = await OrderModel.findAll({
      where: { userId: user.id },
      attributes: ['id'],
      transaction,
    });
    const purchase = await OrderItemModel.findOne({
      where: {
        productId,
        orderId: orders.map((row) => row.id),
        fulfilledQuantity: { [Op.gt]: 0 },
        ...(input.orderItemId ? { id: input.orderItemId } : {}),
      },
      transaction,
    });
    if (!purchase)
      throw new BaseError('verified_purchase_required', 403, 'verified_purchase_required');
    const { ShipmentItemModel, ShipmentModel } = await import('@/sequelize/models/index.js');
    const shipments = await ShipmentModel.findAll({
      where: { orderId: purchase.orderId, fulfillmentStatus: 'delivered' },
      transaction,
    });
    if (
      !shipments.length ||
      !(await ShipmentItemModel.count({
        where: { orderItemId: purchase.id, shipmentId: shipments.map((row) => row.id) },
        transaction,
      }))
    )
      throw new BaseError('delivery_required', 409, 'delivery_required');
    const mediaIds = input.mediaIds ?? [];
    if (mediaIds.length > 10) throw new BadRequest('review_media_limit');
    for (const id of mediaIds) {
      const file = await FileModel.findByPk(id, { transaction });
      if (
        !file ||
        file.metadata?.ownerId !== user.id ||
        file.metadata?.purpose !== 'review' ||
        file.metadata?.private
      )
        throw new Forbidden();
    }
    if (await ReviewModel.count({ where: { productId, userId: user.id }, transaction }))
      throw new BadRequest(errorKeys.reviewExists);
    const row = await ReviewModel.create(
      {
        productId,
        userId: user.id,
        orderItemId: purchase.id,
        rating: input.rating,
        comment: input.comment,
        mediaIds,
        verifiedPurchase: true,
        moderationStatus: 'pending',
      },
      { transaction },
    );
    await recordAudit(
      { actorId: user.id, action: 'review.created', resourceType: 'review', resourceId: row.id },
      transaction,
    );
    return toReview(row);
  });
}

export async function deleteReview(user: User, reviewId: string) {
  return auditedTransaction(async (transaction) => {
    const row = await ReviewModel.findByPk(reviewId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new NotFound(errorKeys.notFound);
    if (!canAccessRecord(user, 'moderate', 'Review', row)) throw new Forbidden();
    await row.update({ moderationStatus: 'hidden', version: row.version + 1 }, { transaction });
    await recordAudit(
      { actorId: user.id, action: 'review.removed', resourceType: 'review', resourceId: row.id },
      transaction,
    );
    return { ok: true };
  });
}

export async function changeReview(
  user: User,
  id: string,
  version: number,
  input:
    | { rating: number; comment: string; mediaIds?: string[] }
    | { moderationStatus: 'published' | 'hidden'; reason: string }
    | { reply: string },
) {
  return auditedTransaction(async (transaction) => {
    const row = await ReviewModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new NotFound();
    assertVersion(row.version, version);
    if ('rating' in input) {
      if (row.userId !== user.id) throw new Forbidden();
      await row.update(
        {
          rating: input.rating,
          comment: input.comment,
          moderationStatus: 'pending',
          version: row.version + 1,
        },
        { transaction },
      );
    } else if ('reply' in input) {
      if (!hasAccess(user, 'reply', 'Review')) throw new Forbidden();
      await row.update({ reply: input.reply, version: row.version + 1 }, { transaction });
    } else {
      if (!hasAccess(user, 'moderate', 'Review')) throw new Forbidden();
      await row.update(
        {
          moderationStatus: input.moderationStatus,
          moderationReason: input.reason,
          version: row.version + 1,
        },
        { transaction },
      );
    }
    await recordAudit(
      {
        actorId: user.id,
        action: 'review.updated',
        resourceType: 'review',
        resourceId: row.id,
        changes: { ...input },
      },
      transaction,
    );
    return toReview(row);
  });
}
