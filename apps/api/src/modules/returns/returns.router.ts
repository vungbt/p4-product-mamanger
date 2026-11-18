import {
  applyAuditPolicies,
  buildPaginationMeta,
  currentUser,
  listSearch,
  queryText,
  requestBody,
  uuidQueryRule,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import type { ReturnInspection } from '@p4/shared';
import { RETURN_STATUS_VALUES, type ReturnListQuery } from '@p4/shared';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { ReturnRequestModel } from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { orderQuantities } from '@/shared/commerce/input.js';
import { auditPolicies } from './returns.audit.js';
import * as returns from './returns.service.js';

const router = Router();
router.post(
  '/orders/:id/returns',
  authRequired,
  apiHandler(async (req) => {
    const body = requestBody(req);
    const evidenceIds =
      body.data.evidenceIds === undefined ? [] : body.strings('evidenceIds', 10, 36);
    if (evidenceIds.some((id) => !/^[a-f0-9-]{36}$/i.test(id))) return body.invalid('evidenceIds');
    return returns.requestReturn(
      currentUser(req),
      uuidRouteId(req),
      body.integer('expectedVersion', 1),
      orderQuantities(body.data.items),
      evidenceIds,
      body.text('reason', 1000),
    );
  }, 201),
);
const list = validateListQuery({
  sortFields: ['createdAt', 'status'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({
    status: `sometimes|required|in:${RETURN_STATUS_VALUES.join(',')}`,
    orderId: uuidQueryRule,
  }),
  normalize: (query, base): ReturnListQuery => ({
    ...base,
    status: RETURN_STATUS_VALUES.find((value) => value === queryText(query, 'status')),
    orderId: queryText(query, 'orderId'),
  }),
});
for (const admin of [false, true])
  router.get(
    admin ? '/admin/returns' : '/returns/mine',
    authRequired,
    ...(admin ? [requireAbility('read', 'Return')] : []),
    list,
    listHandler(async (req, query: ReturnListQuery) => {
      const result = await ReturnRequestModel.findAndCountAll({
        where: {
          ...(admin ? {} : { userId: currentUser(req).id }),
          ...(query.status ? { status: query.status } : {}),
          ...(query.orderId ? { orderId: query.orderId } : {}),
          ...listSearch(ReturnRequestModel, query.q, ['id', 'orderId', 'reason']),
        },
        order: [
          [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
          ['id', 'ASC'],
        ],
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      });
      return {
        data: result.rows.map(returns.returnDto),
        meta: buildPaginationMeta(query.page, query.pageSize, result.count),
      };
    }),
  );
router.get(
  '/returns/:id',
  authRequired,
  apiHandler(async (req) =>
    returns.returnDto(await returns.getReturn(currentUser(req), uuidRouteId(req))),
  ),
);
for (const [action, status] of [
  ['approve', 'approved'],
  ['reject', 'rejected'],
  ['in-transit', 'in_transit'],
  ['receive', 'received'],
  ['inspect', 'inspected'],
  ['complete', 'completed'],
] as const) {
  router.post(
    `/returns/:id/${action}`,
    authRequired,
    requireAbility('manage', 'Return'),
    apiHandler(async (req) => {
      const body = requestBody(req);
      let inspection: ReturnInspection[] | undefined;
      if (action === 'inspect') {
        const raw: unknown = body.data.inspection;
        if (!Array.isArray(raw) || raw.length > 100) return body.invalid('inspection');
        inspection = raw.map((line: unknown) => {
          if (
            !line ||
            typeof line !== 'object' ||
            !('orderItemId' in line) ||
            !('saleableQuantity' in line) ||
            !('damagedQuantity' in line) ||
            typeof line.orderItemId !== 'string' ||
            typeof line.saleableQuantity !== 'number' ||
            typeof line.damagedQuantity !== 'number'
          )
            return body.invalid('inspection');
          return {
            orderItemId: line.orderItemId,
            saleableQuantity: line.saleableQuantity,
            damagedQuantity: line.damagedQuantity,
          };
        });
      }
      return returns.transitionReturn(
        currentUser(req).id,
        uuidRouteId(req),
        status,
        body.integer('expectedVersion', 1),
        action === 'reject' ? body.text('reason', 1000) : (body.optionalText('reason', 1000) ?? ''),
        inspection,
      );
    }),
  );
}
export default applyAuditPolicies(router, auditPolicies);
