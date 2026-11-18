import {
  applyAuditPolicies,
  currentUser,
  dateFilters,
  dateQueryRule,
  queryText,
  uuidQueryRule,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { auditPolicies } from './audit.audit.js';
import { type AuditQuery, getAuditLog, listAuditLogs } from './audit.service.js';

const listQuery = validateListQuery({
  sortFields: ['createdAt', 'action', 'resourceType'] as const,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({
    actorId: uuidQueryRule,
    buildingId: uuidQueryRule,
    action: 'string|max:128',
    resourceType: 'string|max:80',
    resourceId: 'string|max:128',
    from: dateQueryRule,
    to: dateQueryRule,
  }),
  normalize: (query, base, req): AuditQuery => {
    const { createdFrom, createdTo } = dateFilters(
      { createdFrom: query.from, createdTo: query.to },
      req.t,
    );

    return {
      ...base,
      actorId: queryText(query, 'actorId'),
      action: queryText(query, 'action'),
      resourceType: queryText(query, 'resourceType'),
      resourceId: queryText(query, 'resourceId'),
      buildingId: queryText(query, 'buildingId'),
      from: createdFrom,
      to: createdTo,
    };
  },
});
const router = Router();

router.get(
  '/audit-logs',
  authRequired,
  requireScopedAbility('read', 'AuditLog'),
  listQuery,
  listHandler((req, query: AuditQuery) => listAuditLogs(currentUser(req), query)),
);
router.get(
  '/audit-logs/:id',
  authRequired,
  requireScopedAbility('read', 'AuditLog'),
  apiHandler((req) => getAuditLog(currentUser(req), uuidRouteId(req))),
);

export default applyAuditPolicies(router, auditPolicies);
