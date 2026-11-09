import type { ListQuery } from '@p4/shared';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { DomainEventModel, sequelize } from '@/sequelize/models/index.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { currentUser, uuidRouteId } from '@/shared/http-input.js';
import { queryText, validateListQuery } from '@/shared/list-query.js';
import { listSearch } from '@/shared/list-search.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { eventHandlers } from './handlers.js';
import { auditPolicies } from './jobs.audit.js';
import { jobDto, retryEvent } from './jobs.service.js';

const router = Router();
const list = validateListQuery({
  sortFields: ['createdAt', 'attempts'],
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({ status: 'sometimes|required|in:pending,processing,delivered,dead_letter' }),
  normalize: (_query, base) => base,
});
router.get(
  '/admin/jobs',
  authRequired,
  requireAbility('read', 'System'),
  list,
  listHandler(async (req, query: ListQuery<'createdAt' | 'attempts'>) => {
    const status = queryText(req.query, 'status');
    const result = await DomainEventModel.findAndCountAll({
      where: {
        ...(status ? { status } : {}),
        ...listSearch(DomainEventModel, query.q, ['id', 'type', 'aggregateId', 'aggregateType']),
      },
      attributes: { exclude: ['payload', 'leaseToken'] },
      order: [
        [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ],
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return {
      data: result.rows.map(jobDto),
      meta: buildPaginationMeta(query.page, query.pageSize, result.count),
    };
  }),
);
router.get(
  '/admin/jobs/:id',
  authRequired,
  requireAbility('read', 'System'),
  apiHandler(async (req) => {
    const id = uuidRouteId(req);
    const row = await DomainEventModel.findByPk(id);
    if (!row) throw new NotFound();
    const [attempts] = await sequelize.query(
      'SELECT id,attempt,status,error_code,created_at FROM job_attempts WHERE event_id=:id ORDER BY created_at DESC LIMIT 50',
      { replacements: { id } },
    );
    return { ...jobDto(row), attempts };
  }),
);
router.post(
  '/admin/jobs/:id/retry',
  authRequired,
  requireAbility('manage', 'System'),
  apiHandler(async (req) => retryEvent(currentUser(req).id, uuidRouteId(req), eventHandlers)),
);
export default applyAuditPolicies(router, auditPolicies);
