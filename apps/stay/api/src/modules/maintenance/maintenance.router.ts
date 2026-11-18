import {
  applyAuditPolicies,
  currentUser,
  queryText,
  type RouteAuditPolicies,
  uuidQueryRule,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { MAINTENANCE_SOURCES, MAINTENANCE_STATUSES } from '@stay/shared';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { readExpenseDetails } from '../expenses/expenses.input.js';
import { listCategories } from '../expenses/expenses.service.js';
import { readJobInput, readJobUpdate } from './maintenance.input.js';
import {
  addMaintenanceExpense,
  createMaintenance,
  getMaintenance,
  listMaintenance,
  type MaintenanceListQuery,
  type MaintenanceSortField,
  updateMaintenance,
} from './maintenance.service.js';

const router = Router();
const sortFields: MaintenanceSortField[] = ['createdAt'];
const maintenanceQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  defaultOrder: 'desc',
  rules: () => ({
    buildingId: uuidQueryRule,
    roomId: uuidQueryRule,
    status: `sometimes|required|in:${MAINTENANCE_STATUSES.join(',')}`,
    source: `sometimes|required|in:${MAINTENANCE_SOURCES.join(',')}`,
  }),
  normalize: (query, base): MaintenanceListQuery => ({
    ...base,
    buildingId: queryText(query, 'buildingId'),
    roomId: queryText(query, 'roomId'),
    status: MAINTENANCE_STATUSES.find((v) => v === queryText(query, 'status')),
    source: MAINTENANCE_SOURCES.find((v) => v === queryText(query, 'source')),
  }),
});

// Read scoped Maintenance; writes use create/update (operations managers), never unconditional manage.
router.get(
  '/maintenance',
  authRequired,
  requireScopedAbility('read', 'Maintenance'),
  maintenanceQuery,
  listHandler((req, query: MaintenanceListQuery) => listMaintenance(currentUser(req), query)),
);
router.get(
  '/maintenance/expense-categories',
  authRequired,
  requireScopedAbility('read', 'Maintenance'),
  apiHandler(() => listCategories()),
);
router.get(
  '/maintenance/:id',
  authRequired,
  requireScopedAbility('read', 'Maintenance'),
  apiHandler((req) => getMaintenance(currentUser(req), uuidRouteId(req))),
);
router.post(
  '/maintenance',
  authRequired,
  requireScopedAbility('create', 'Maintenance'),
  apiHandler((req) => createMaintenance(currentUser(req), readJobInput(formBody(req))), 201),
);
router.put(
  '/maintenance/:id',
  authRequired,
  requireScopedAbility('update', 'Maintenance'),
  apiHandler((req) =>
    updateMaintenance(currentUser(req), uuidRouteId(req), readJobUpdate(formBody(req))),
  ),
);
router.post(
  '/maintenance/:id/expense',
  authRequired,
  requireScopedAbility('update', 'Maintenance'),
  apiHandler((req) => {
    // Room/building always come from the locked job, never from the caller.
    return addMaintenanceExpense(
      currentUser(req),
      uuidRouteId(req),
      readExpenseDetails(formBody(req)),
    );
  }, 201),
);

const auditPolicies = {
  'GET /maintenance': { action: 'read', resourceType: 'maintenance' },
  'GET /maintenance/expense-categories': { action: 'read', resourceType: 'maintenance' },
  'GET /maintenance/:id': { action: 'read', resourceType: 'maintenance' },
  'POST /maintenance': { action: 'create', resourceType: 'maintenance' },
  'PUT /maintenance/:id': { action: 'update', resourceType: 'maintenance' },
  'POST /maintenance/:id/expense': { action: 'create', resourceType: 'maintenance' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
