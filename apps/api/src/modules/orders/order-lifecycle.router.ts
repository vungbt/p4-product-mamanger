import type { ListQuery } from '@p4/shared';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { permissionsFor, requirePermission } from '@/middlewares/permission.middleware.js';
import { CancellationRequestModel, OrderEventModel } from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { orderQuantities } from '@/shared/commerce/input.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import { validateListQuery } from '@/shared/list-query.js';
import { listSearch } from '@/shared/list-search.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { auditPolicies } from './order-lifecycle.audit.js';
import * as orders from './order-lifecycle.service.js';

const router = Router();
for (const [path, state] of [
  ['confirm', 'confirmed'],
  ['start-processing', 'processing'],
] as const) {
  router.post(
    `/orders/:id/${path}`,
    authRequired,
    requirePermission('order:manage'),
    apiHandler(async (req) =>
      orders.transitionOrder(
        currentUser(req).id,
        uuidRouteId(req),
        state,
        requestBody(req).integer('expectedVersion', 1),
      ),
    ),
  );
}
const events = validateListQuery({
  sortFields: ['createdAt'],
  defaultSort: 'createdAt',
  rules: () => ({}),
  normalize: (_query, base) => base,
});
router.get(
  '/orders/:id/events',
  authRequired,
  events,
  listHandler(async (req, query: ListQuery<'createdAt'>) => {
    const id = uuidRouteId(req);
    const user = currentUser(req);
    await orders.ownedOrder(user, id);
    const result = await OrderEventModel.findAndCountAll({
      where: {
        orderId: id,
        ...listSearch(OrderEventModel, query.q, ['type', 'detail']),
        ...(permissionsFor(user).includes('order:read') ? {} : { public: true }),
      },
      order: [
        ['createdAt', query.sortOrder === 'desc' ? 'DESC' : 'ASC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map((row) => ({
        id: row.id,
        type: row.type,
        detail: row.detail,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
router.post(
  '/orders/:id/cancellation-requests',
  authRequired,
  apiHandler(async (req) => {
    const body = requestBody(req);
    return orders.requestCancellation(
      currentUser(req),
      uuidRouteId(req),
      body.integer('expectedVersion', 1),
      orderQuantities(body.data.items),
      body.text('reason', 1000),
    );
  }, 201),
);
router.get(
  '/cancellation-requests/:id',
  authRequired,
  apiHandler(async (req) => {
    const row = await CancellationRequestModel.findByPk(uuidRouteId(req));
    if (!row) throw new NotFound();
    await orders.ownedOrder(currentUser(req), row.orderId);
    return orders.cancellationDto(row);
  }),
);
for (const action of ['approve', 'reject'] as const) {
  router.post(
    `/cancellation-requests/:id/${action}`,
    authRequired,
    requirePermission('order:manage'),
    apiHandler(async (req) => {
      const body = requestBody(req);
      return orders.resolveCancellation(
        currentUser(req),
        uuidRouteId(req),
        body.integer('expectedVersion', 1),
        action === 'approve',
        action === 'reject' ? body.text('reason', 1000) : '',
      );
    }),
  );
}
export default applyAuditPolicies(router, auditPolicies);
