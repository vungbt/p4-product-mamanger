import type { ExchangeLine } from '@p4/shared';
import { EXCHANGE_STATUS_VALUES, type ExchangeListQuery } from '@p4/shared';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { ExchangeRequestModel } from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import { queryText, uuidQueryRule, validateListQuery } from '@/shared/list-query.js';
import { listSearch } from '@/shared/list-search.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { auditPolicies } from './exchanges.audit.js';
import * as exchanges from './exchanges.service.js';

const router = Router();
router.post(
  '/orders/:id/exchanges',
  authRequired,
  apiHandler(async (req) => {
    const body = requestBody(req);
    const returnId = body.text('returnId', 36);
    const raw: unknown = body.data.items;
    if (
      !/^[a-f0-9-]{36}$/i.test(returnId) ||
      !Array.isArray(raw) ||
      !raw.length ||
      raw.length > 100
    )
      return body.invalid('items');
    const items = raw.map((line: unknown): ExchangeLine => {
      if (
        !line ||
        typeof line !== 'object' ||
        !('orderItemId' in line) ||
        !('variantId' in line) ||
        !('quantity' in line) ||
        typeof line.orderItemId !== 'string' ||
        typeof line.variantId !== 'string' ||
        !/^[a-f0-9-]{36}$/i.test(line.orderItemId) ||
        !/^[a-f0-9-]{36}$/i.test(line.variantId) ||
        typeof line.quantity !== 'number' ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > 99
      )
        return body.invalid('items');
      return { orderItemId: line.orderItemId, variantId: line.variantId, quantity: line.quantity };
    });
    return exchanges.requestExchange(
      currentUser(req),
      uuidRouteId(req),
      returnId,
      items,
      body.text('reason', 1000),
    );
  }, 201),
);
const list = validateListQuery({
  sortFields: ['createdAt', 'status'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({
    status: `sometimes|required|in:${EXCHANGE_STATUS_VALUES.join(',')}`,
    orderId: uuidQueryRule,
  }),
  normalize: (query, base): ExchangeListQuery => ({
    ...base,
    status: EXCHANGE_STATUS_VALUES.find((value) => value === queryText(query, 'status')),
    orderId: queryText(query, 'orderId'),
  }),
});
for (const admin of [false, true])
  router.get(
    admin ? '/admin/exchanges' : '/exchanges/mine',
    authRequired,
    ...(admin ? [requireAbility('read', 'Return')] : []),
    list,
    listHandler(async (req, query: ExchangeListQuery) => {
      const result = await ExchangeRequestModel.findAndCountAll({
        where: {
          ...(admin ? {} : { userId: currentUser(req).id }),
          ...(query.status ? { status: query.status } : {}),
          ...(query.orderId ? { orderId: query.orderId } : {}),
          ...listSearch(ExchangeRequestModel, query.q, ['id', 'orderId', 'reason']),
        },
        order: [
          [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
          ['id', 'ASC'],
        ],
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      });
      return {
        data: result.rows.map(exchanges.exchangeDto),
        meta: buildPaginationMeta(query.page, query.pageSize, result.count),
      };
    }),
  );
router.get(
  '/exchanges/:id',
  authRequired,
  apiHandler(async (req) =>
    exchanges.exchangeDto(await exchanges.ownedExchange(currentUser(req), uuidRouteId(req))),
  ),
);
router.post(
  '/exchanges/:id/approve',
  authRequired,
  requireAbility('manage', 'Return'),
  apiHandler(async (req) =>
    exchanges.approveExchange(
      currentUser(req).id,
      uuidRouteId(req),
      requestBody(req).integer('expectedVersion', 1),
    ),
  ),
);
router.post(
  '/exchanges/:id/reject',
  authRequired,
  requireAbility('manage', 'Return'),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return exchanges.rejectExchange(
      currentUser(req).id,
      uuidRouteId(req),
      body.integer('expectedVersion', 1),
      body.text('reason', 1000),
    );
  }),
);
router.post(
  '/exchanges/:id/create-replacement',
  authRequired,
  requireAbility('manage', 'Return'),
  apiHandler(
    async (req) =>
      exchanges.createReplacement(
        currentUser(req).id,
        uuidRouteId(req),
        requestBody(req).integer('expectedVersion', 1),
      ),
    201,
  ),
);
export default applyAuditPolicies(router, auditPolicies);
