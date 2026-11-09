import { randomUUID } from 'node:crypto';
import {
  applyAuditPolicies,
  buildPaginationMeta,
  currentUser,
  listSearch,
  NotFound,
  queryText,
  requestBody,
  searchPattern,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import type { ListQuery, PromotionListQuery } from '@p4/shared';
import { Router } from 'express';
import { Op } from 'sequelize';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { CouponModel, CouponRedemptionModel, PromotionModel } from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { auditedTransaction, recordAudit } from '@/shared/audit/audited-command.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { selectFields } from '@/utils/select-fields.js';
import { toCoupon } from '../coupons/coupons.service.js';
import { auditPolicies } from './promotions.audit.js';
import { promotionDto } from './promotions.service.js';
import { ruleInput } from './promotions.validation.js';

const router = Router();
const read = [authRequired, requireAbility('read', 'Promotion')];
const write = [authRequired, requireAbility('write', 'Promotion')];
const list = validateListQuery({
  sortFields: ['name', 'priority', 'createdAt'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({ isActive: 'sometimes|required|in:true,false' }),
  normalize: (query, base): PromotionListQuery => ({
    ...base,
    isActive:
      queryText(query, 'isActive') === undefined
        ? undefined
        : queryText(query, 'isActive') === 'true',
  }),
});
router.get(
  '/admin/promotions',
  ...read,
  list,
  listHandler(async (_req, query: PromotionListQuery) => {
    const result = await PromotionModel.findAndCountAll({
      where: {
        ...(query.q ? { name: { [Op.iLike]: searchPattern(query.q) } } : {}),
        ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      },
      order: [
        [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map(promotionDto),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
router.get(
  '/admin/promotions/:id',
  ...read,
  apiHandler(async (req) => {
    const row = await PromotionModel.findByPk(uuidRouteId(req));
    if (!row) throw new NotFound();
    return promotionDto(row);
  }),
);
for (const method of ['post', 'patch'] as const) {
  router[method](
    method === 'post' ? '/admin/promotions' : '/admin/promotions/:id',
    ...write,
    apiHandler(
      async (req) => {
        const body = requestBody(req);
        const input = {
          ...ruleInput(req),
          name: body.text('name', 120),
          priority: body.data.priority === undefined ? 0 : body.integer('priority', 0, 1000),
        };
        return auditedTransaction(async (transaction) => {
          let row: PromotionModel | null;
          if (method === 'post')
            row = await PromotionModel.create(
              { id: randomUUID(), ...input, version: 1 },
              { transaction },
            );
          else {
            row = await PromotionModel.findByPk(uuidRouteId(req), {
              transaction,
              lock: transaction.LOCK.UPDATE,
            });
            if (!row) throw new NotFound();
            assertVersion(row.version, body.integer('expectedVersion', 1));
            await row.update({ ...input, version: row.version + 1 }, { transaction });
          }
          await recordAudit(
            {
              actorId: currentUser(req).id,
              action: `promotion.${method === 'post' ? 'created' : 'updated'}`,
              resourceType: 'promotion',
              resourceId: row.id,
            },
            transaction,
          );
          return promotionDto(row);
        });
      },
      method === 'post' ? 201 : 200,
    ),
  );
}
router.get(
  '/admin/coupons/:id',
  ...read,
  apiHandler(async (req) => {
    const row = await CouponModel.findByPk(uuidRouteId(req));
    if (!row) throw new NotFound();
    return toCoupon(row);
  }),
);
const redemptions = validateListQuery({
  sortFields: ['createdAt', 'amount'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({}),
  normalize: (_query, base) => base,
});
router.get(
  '/admin/coupons/:id/redemptions',
  ...read,
  redemptions,
  listHandler(async (req, query: ListQuery<'createdAt' | 'amount'>) => {
    const couponId = uuidRouteId(req);
    if (!(await CouponModel.findByPk(couponId))) throw new NotFound();
    const result = await CouponRedemptionModel.findAndCountAll({
      where: {
        couponId,
        ...listSearch(CouponRedemptionModel, query.q, ['orderId', 'userId', 'status']),
      },
      order: [
        [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map((row) => ({
        ...selectFields(row, [
          'id',
          'couponId',
          'orderId',
          'userId',
          'status',
          'amount',
          'ruleVersion',
        ]),
        createdAt: row.createdAt.toISOString(),
      })),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
export default applyAuditPolicies(router, auditPolicies);
