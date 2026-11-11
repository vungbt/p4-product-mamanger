import {
  applyAuditPolicies,
  currentUser,
  InputValidError,
  type RouteAuditPolicies,
  uuidRouteId,
} from '@p4/server-core';
import { isPeriod } from '@stay/shared';
import { type Request, Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { assertOverviewPeriod, buildingOverview } from './overview.service.js';

const router = Router();

/** Optional `?period=YYYY-MM`; validated here (validatorjs string rules split on `|`). */
function overviewPeriod(req: Request): string | undefined {
  const period = req.query.period;

  if (period === undefined) return undefined;
  if (!isPeriod(period))
    throw new InputValidError('input_valid_error', { period: ['Kỳ phải có dạng YYYY-MM.'] });
  return assertOverviewPeriod(period);
}

// ST-19 Tổng quan: read-only aggregation; managers of other buildings get 404.
router.get(
  '/buildings/:buildingId/overview',
  authRequired,
  requireScopedAbility('read', 'Report'),
  apiHandler((req) =>
    buildingOverview(currentUser(req), uuidRouteId(req, 'buildingId'), overviewPeriod(req)),
  ),
);

const auditPolicies = {
  'GET /buildings/:buildingId/overview': { action: 'read', resourceType: 'report' },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
