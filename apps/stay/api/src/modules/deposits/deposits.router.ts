import {
  applyAuditPolicies,
  currentUser,
  queryText,
  type RouteAuditPolicies,
  uuidQueryRule,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { CONTRACT_STATUSES } from '@stay/shared';
import { Router } from 'express';
import { requireAbility, requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { readDepositInput } from './deposits.input.js';
import {
  createDeposit,
  type DepositListQuery,
  getDeposits,
  listDeposits,
} from './deposits.service.js';

const router = Router();
const sortFields: ('code' | 'createdAt')[] = ['code', 'createdAt'];
const depositQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  rules: () => ({
    buildingId: uuidQueryRule,
    status: `sometimes|required|in:${CONTRACT_STATUSES.join(',')}`,
  }),
  normalize: (query, base): DepositListQuery => ({
    ...base,
    buildingId: queryText(query, 'buildingId'),
    status: CONTRACT_STATUSES.find((status) => status === queryText(query, 'status')),
  }),
});

router.get(
  '/deposits',
  authRequired,
  requireScopedAbility('read', 'Deposit'),
  depositQuery,
  listHandler((req, query: DepositListQuery) => listDeposits(currentUser(req), query)),
);
router.get(
  '/contracts/:id/deposits',
  authRequired,
  requireScopedAbility('read', 'Deposit'),
  apiHandler((req) => getDeposits(currentUser(req), uuidRouteId(req))),
);
router.post(
  '/contracts/:id/deposits',
  authRequired,
  requireAbility('manage', 'Deposit'),
  apiHandler(
    (req) =>
      createDeposit(
        currentUser(req),
        uuidRouteId(req),
        readDepositInput(formBody(req)),
        req.get('Idempotency-Key'),
      ),
    201,
  ),
);

const auditPolicies = {
  'GET /deposits': { action: 'read', resourceType: 'deposit' },
  'GET /contracts/:id/deposits': { action: 'read', resourceType: 'deposit' },
  'POST /contracts/:id/deposits': { action: 'create', resourceType: 'deposit_entry' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
