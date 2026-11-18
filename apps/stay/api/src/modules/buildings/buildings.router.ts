import {
  applyAuditPolicies,
  currentUser,
  InputValidError,
  queryText,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { BUILDING_STATUS_FILTERS, isIsoDate, isoDateInTimeZone } from '@stay/shared';
import { Router } from 'express';
import { requireAbility, requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { getBuildingPrices, setBuildingPrice } from './building-prices.service.js';
import { auditPolicies } from './buildings.audit.js';
import { readBuildingInput, readPriceOverrideInput } from './buildings.input.js';
import {
  archiveBuilding,
  type BuildingListQuery,
  type BuildingSortField,
  createBuilding,
  findAccessibleBuilding,
  getBuilding,
  listBuildings,
  updateBuilding,
} from './buildings.service.js';

const router = Router();
const sortFields: BuildingSortField[] = ['code', 'name', 'createdAt'];

const validateBuildingListQuery = validateListQuery({
  sortFields,
  defaultSort: 'code',
  rules: () => ({ status: `sometimes|required|in:${BUILDING_STATUS_FILTERS.join(',')}` }),
  normalize: (query, base): BuildingListQuery => ({
    ...base,
    status:
      BUILDING_STATUS_FILTERS.find((value) => value === queryText(query, 'status')) ?? 'active',
  }),
});

router.get(
  '/buildings',
  authRequired,
  requireScopedAbility('read', 'Building'),
  validateBuildingListQuery,
  listHandler((req, query: BuildingListQuery) => listBuildings(currentUser(req), query)),
);
router.post(
  '/buildings',
  authRequired,
  requireAbility('manage', 'Building'),
  apiHandler(async (req) => createBuilding(await readBuildingInput(formBody(req))), 201),
);
router.get(
  '/buildings/:id',
  authRequired,
  requireScopedAbility('read', 'Building'),
  apiHandler((req) => getBuilding(currentUser(req), uuidRouteId(req))),
);
router.put(
  '/buildings/:id',
  authRequired,
  requireAbility('manage', 'Building'),
  apiHandler(async (req) => {
    const user = currentUser(req);
    const building = await findAccessibleBuilding(user, uuidRouteId(req), 'manage');
    const body = formBody(req);
    const version = body.integer('version', 1);
    const input = await readBuildingInput(body, building);

    return updateBuilding(user, building.id, input, version);
  }),
);
router.post(
  '/buildings/:id/archive',
  authRequired,
  requireAbility('manage', 'Building'),
  apiHandler((req) => archiveBuilding(currentUser(req), uuidRouteId(req))),
);
router.get(
  '/buildings/:id/prices',
  authRequired,
  requireScopedAbility('read', 'Building'),
  apiHandler((req) => {
    // Prices in force today (Asia/Ho_Chi_Minh) unless `?date=YYYY-MM-DD`.
    const date = queryText(req.query, 'date') ?? isoDateInTimeZone(new Date());

    if (!isIsoDate(date))
      throw new InputValidError('input_valid_error', {
        date: [req.t('error:invalid_date', { attribute: req.t('validator:attribute.date') })],
      });
    return getBuildingPrices(currentUser(req), uuidRouteId(req), date);
  }),
);
router.put(
  '/buildings/:id/prices',
  authRequired,
  requireAbility('manage', 'Building'),
  apiHandler(async (req) => {
    const user = currentUser(req);
    const building = await findAccessibleBuilding(user, uuidRouteId(req), 'manage');

    return setBuildingPrice(user, building.id, await readPriceOverrideInput(formBody(req)));
  }),
);

export default applyAuditPolicies(router, auditPolicies);
