import {
  applyAuditPolicies,
  currentUser,
  queryText,
  uuidRouteId,
  validateListQuery,
} from '@p4/server-core';
import { CONTRACT_STATUSES } from '@stay/shared';
import { Router } from 'express';
import { requireScopedAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler, listHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { auditPolicies } from './contracts.audit.js';
import { readChangeInput } from './contracts.changes.input.js';
import { changeContract } from './contracts.changes.js';
import { readContractInput } from './contracts.input.js';
import {
  activateContract,
  type ContractListQuery,
  type ContractSortField,
  cancelContract,
  createContract,
  getContract,
  listContracts,
  moveInPreview,
  updateContract,
} from './contracts.service.js';

const router = Router();
const sortFields: ContractSortField[] = ['code', 'startDate', 'endDate', 'createdAt'];
const validateContractListQuery = validateListQuery({
  sortFields,
  defaultSort: 'createdAt',
  rules: () => ({
    buildingId:
      'sometimes|required|string|regex:/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/',
    roomId:
      'sometimes|required|string|regex:/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/',
    status: `sometimes|required|in:${CONTRACT_STATUSES.join(',')}`,
    expiring: 'sometimes|required|in:true,false',
  }),
  normalize: (query, base): ContractListQuery => ({
    ...base,
    buildingId: queryText(query, 'buildingId'),
    roomId: queryText(query, 'roomId'),
    status: CONTRACT_STATUSES.find((s) => s === queryText(query, 'status')),
    expiring: queryText(query, 'expiring') === 'true',
  }),
});

router.get(
  '/contracts',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  validateContractListQuery,
  listHandler((req, query: ContractListQuery) => listContracts(currentUser(req), query)),
);
router.post(
  '/contracts',
  authRequired,
  requireScopedAbility('create', 'Contract'),
  apiHandler(
    (req) =>
      createContract(
        currentUser(req),
        readContractInput(formBody(req)),
        req.get('Idempotency-Key'),
      ),
    201,
  ),
);
router.get(
  '/contracts/:id',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  apiHandler((req) => getContract(currentUser(req), uuidRouteId(req))),
);
router.put(
  '/contracts/:id',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) => {
    const body = formBody(req);
    const input = readContractInput(body);
    const version = body.integer('version', 1);

    body.assertValid();
    return updateContract(currentUser(req), uuidRouteId(req), input, version);
  }),
);
router.post(
  '/contracts/:id/activate',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) => activateContract(currentUser(req), uuidRouteId(req))),
);
router.post(
  '/contracts/:id/cancel',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) => cancelContract(currentUser(req), uuidRouteId(req))),
);
router.get(
  '/contracts/:id/move-in-preview',
  authRequired,
  requireScopedAbility('read', 'Contract'),
  apiHandler((req) => moveInPreview(currentUser(req), uuidRouteId(req))),
);

router.post(
  '/contracts/:id/renew',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) =>
    changeContract(
      currentUser(req),
      uuidRouteId(req),
      'renew',
      readChangeInput(formBody(req), 'renew'),
      req.get('Idempotency-Key'),
    ),
  ),
);

router.post(
  '/contracts/:id/rent-change',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) =>
    changeContract(
      currentUser(req),
      uuidRouteId(req),
      'rent-change',
      readChangeInput(formBody(req), 'rent-change'),
      req.get('Idempotency-Key'),
    ),
  ),
);

router.post(
  '/contracts/:id/occupants',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) =>
    changeContract(
      currentUser(req),
      uuidRouteId(req),
      'occupants',
      readChangeInput(formBody(req), 'occupants'),
      req.get('Idempotency-Key'),
    ),
  ),
);

router.post(
  '/contracts/:id/vehicles',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) =>
    changeContract(
      currentUser(req),
      uuidRouteId(req),
      'vehicles',
      readChangeInput(formBody(req), 'vehicles'),
      req.get('Idempotency-Key'),
    ),
  ),
);

router.post(
  '/contracts/:id/services',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) =>
    changeContract(
      currentUser(req),
      uuidRouteId(req),
      'services',
      readChangeInput(formBody(req), 'services'),
      req.get('Idempotency-Key'),
    ),
  ),
);

router.post(
  '/contracts/:id/room-change',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) =>
    changeContract(
      currentUser(req),
      uuidRouteId(req),
      'room-change',
      readChangeInput(formBody(req), 'room-change'),
      req.get('Idempotency-Key'),
    ),
  ),
);

router.post(
  '/contracts/:id/occupants/:occupantId/leave',
  authRequired,
  requireScopedAbility('update', 'Contract'),
  apiHandler((req) =>
    changeContract(
      currentUser(req),
      uuidRouteId(req),
      'leave',
      readChangeInput(formBody(req), 'leave'),
      req.get('Idempotency-Key'),
      uuidRouteId(req, 'occupantId'),
    ),
  ),
);

export default applyAuditPolicies(router, auditPolicies);
