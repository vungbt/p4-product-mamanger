import type { ListQuery } from '@p4/shared';
import { type NextFunction, type Request, type Response, Router } from 'express';
import type { WhereOptions } from 'sequelize';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import type { AuditLogAttributes } from '@/sequelize/models/audit-log.model.js';
import { AuditLogModel } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { uuidRouteId } from '@/shared/http-input.js';
import { dateRange } from '@/shared/list-filters.js';
import {
  dateFilters,
  dateQueryRule,
  type ListLocals,
  queryText,
  uuidQueryRule,
  validateListQuery,
} from '@/shared/list-query.js';
import type { ModelOrder } from '@/types/database.js';
import { NotFound } from '@/utils/errors/index.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { selectFields } from '@/utils/select-fields.js';
import { auditPolicies } from './audit.audit.js';

interface AuditQuery extends ListQuery<'createdAt' | 'action' | 'resourceType'> {
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  outcome?: 'success' | 'failure';
  requestId?: string;
  createdFrom?: string;
  createdTo?: string;
}
const sortFields: NonNullable<AuditQuery['sortBy']>[] = ['createdAt', 'action', 'resourceType'];
const auditFields = [
  'id',
  'actorId',
  'action',
  'resourceType',
  'resourceId',
  'outcome',
  'changes',
  'requestId',
  'reason',
] satisfies (keyof AuditLogAttributes)[];
const listQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({
    actorId: uuidQueryRule,
    action: 'string|max:128',
    resourceType: 'string|max:80',
    resourceId: 'string|max:128',
    outcome: 'sometimes|required|in:success,failure',
    requestId: 'string|max:80',
    createdFrom: dateQueryRule,
    createdTo: dateQueryRule,
  }),
  normalize: (query, base, req): AuditQuery => ({
    ...base,
    actorId: queryText(query, 'actorId'),
    action: queryText(query, 'action'),
    resourceType: queryText(query, 'resourceType'),
    resourceId: queryText(query, 'resourceId'),
    outcome:
      queryText(query, 'outcome') === 'success'
        ? 'success'
        : queryText(query, 'outcome') === 'failure'
          ? 'failure'
          : undefined,
    requestId: queryText(query, 'requestId'),
    ...dateFilters(query, req.t),
  }),
});
const router = Router();
router.get(
  '/admin/audit-logs',
  authRequired,
  requireAbility('read', 'AuditLog'),
  listQuery,
  async (_req: Request, res: Response<unknown, ListLocals<AuditQuery>>, next: NextFunction) => {
    try {
      const query = res.locals.listQuery;
      const where: WhereOptions<AuditLogAttributes> = {
        ...(query.actorId ? { actorId: query.actorId } : {}),
        ...(query.action ? { action: query.action } : {}),
        ...(query.resourceType ? { resourceType: query.resourceType } : {}),
        ...(query.resourceId ? { resourceId: query.resourceId } : {}),
        ...(query.outcome ? { outcome: query.outcome } : {}),
        ...(query.requestId ? { requestId: query.requestId } : {}),
        ...(query.createdFrom || query.createdTo
          ? { createdAt: dateRange(query.createdFrom, query.createdTo) }
          : {}),
      };
      const order: ModelOrder<AuditLogAttributes> = [
        [query.sortBy ?? 'createdAt', query.sortOrder === 'asc' ? 'ASC' : 'DESC'],
        ['id', 'ASC'],
      ];
      const { rows, count } = await AuditLogModel.findAndCountAll({
        where,
        order,
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
      });
      return res.jsonApi(200, {
        data: rows.map((row) => ({
          ...selectFields(row, auditFields),
          createdAt: row.createdAt.toISOString(),
        })),
        meta: buildPaginationMeta(query.page, query.pageSize, count),
      });
    } catch (error) {
      return next(error);
    }
  },
);
router.get(
  '/admin/audit-logs/:id',
  authRequired,
  requireAbility('read', 'AuditLog'),
  apiHandler(async (req) => {
    const row = await AuditLogModel.findByPk(uuidRouteId(req));
    if (!row) throw new NotFound();
    return { ...selectFields(row, auditFields), createdAt: row.createdAt.toISOString() };
  }),
);
export default applyAuditPolicies(router, auditPolicies);
