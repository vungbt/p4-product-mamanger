import {
  applyAuditPolicies,
  currentUser,
  queryText,
  type RouteAuditPolicies,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { type RequestHandler, Router } from 'express';
import { requireAbility, requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { rateLimit } from '@/middlewares/rate-limit.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import {
  exportResidents,
  listResidents,
  type ResidentListQuery,
  registerResident,
  residentDate,
} from './residents.service.js';

const router = Router();
const residentsQuery = validateListQuery({
  sortFields: ['fullName'],
  defaultSort: 'fullName',
  rules: () => ({ date: 'required|string', status: 'sometimes|required|in:all,unregistered' }),
  normalize: (query, base): ResidentListQuery => ({
    ...base,
    date: residentDate(queryText(query, 'date')),
    status: queryText(query, 'status') === 'unregistered' ? 'unregistered' : 'all',
  }),
});

router.get(
  '/buildings/:buildingId/residents',
  authRequired,
  requireScopedAbility('read', 'Tenant'),
  residentsQuery,
  listHandler((req, query: ResidentListQuery) =>
    listResidents(currentUser(req), uuidRouteId(req, 'buildingId'), query),
  ),
);
router.post(
  '/resident-stays/:id/registration',
  authRequired,
  requireAbility('manage', 'Tenant'),
  apiHandler((req) => {
    const body = formBody(req);
    const registeredOn = body.text('registeredOn', 10);
    const note = body.optionalText('note', 2000);

    body.assertValid();
    return registerResident(currentUser(req), uuidRouteId(req), { registeredOn, note });
  }),
);
router.delete(
  '/resident-stays/:id/registration',
  authRequired,
  requireAbility('manage', 'Tenant'),
  apiHandler((req) => registerResident(currentUser(req), uuidRouteId(req), null)),
);
const exportHandler: RequestHandler = (req, res, next) => {
  // Resolve and commit the export audit before returning personal data to the client.
  Promise.resolve()
    .then(() => {
      const body = formBody(req);
      const date = body.text('date', 10);

      body.assertValid();
      return exportResidents(currentUser(req), uuidRouteId(req, 'buildingId'), date);
    })
    .then((file) => {
      res.attachment('tam-tru.xlsx');
      res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(file);
    })
    .catch(next);
};
router.post(
  '/buildings/:buildingId/residents/export',
  authRequired,
  requireScopedAbility('read', 'Tenant'),
  rateLimit('stay-residents-export', 10),
  exportHandler,
);

const auditPolicies = {
  'GET /buildings/:buildingId/residents': { action: 'read', resourceType: 'resident' },
  'POST /resident-stays/:id/registration': {
    action: 'update',
    resourceType: 'resident_registration',
  },
  'DELETE /resident-stays/:id/registration': {
    action: 'delete',
    resourceType: 'resident_registration',
  },
  'POST /buildings/:buildingId/residents/export': {
    action: 'export',
    resourceType: 'resident_export',
    auditedHandler: exportHandler,
  },
} satisfies RouteAuditPolicies;

export default applyAuditPolicies(router, auditPolicies);
