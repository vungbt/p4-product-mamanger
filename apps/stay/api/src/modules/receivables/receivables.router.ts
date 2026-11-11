import {
  applyAuditPolicies,
  currentUser,
  queryText,
  type RouteAuditPolicies,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { RECEIVABLE_BUCKETS, RECEIVABLE_SORT_FIELDS } from '@stay/shared';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { listHandler } from '@/shared/api-handler.js';
import { listReceivables, type ReceivableListQuery } from './receivables.service.js';

const router = Router();
const receivableQuery = validateListQuery({
  sortFields: RECEIVABLE_SORT_FIELDS,
  defaultSort: 'remaining',
  defaultOrder: 'desc',
  rules: () => ({
    bucket: `sometimes|required|in:${RECEIVABLE_BUCKETS.join(',')}`,
  }),
  normalize: (query, base): ReceivableListQuery => ({
    ...base,
    bucket: RECEIVABLE_BUCKETS.find((bucket) => bucket === queryText(query, 'bucket')),
  }),
});

// ST-18 Công nợ: read-only; managers of other buildings get 404.
router.get(
  '/buildings/:buildingId/receivables',
  authRequired,
  requireScopedAbility('read', 'Invoice'),
  receivableQuery,
  listHandler((req, query: ReceivableListQuery) =>
    listReceivables(currentUser(req), uuidRouteId(req, 'buildingId'), query),
  ),
);

const auditPolicies = {
  'GET /buildings/:buildingId/receivables': { action: 'read', resourceType: 'invoice' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
