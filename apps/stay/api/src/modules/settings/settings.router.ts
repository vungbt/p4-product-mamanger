import { applyAuditPolicies, uuidRouteId } from '@p4/server-core';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { formBody } from '@/shared/input.js';
import { auditPolicies } from './settings.audit.js';
import { readNewServiceInput, readServiceInput, readSettingsInput } from './settings.input.js';
import {
  createService,
  getService,
  getSettings,
  listServices,
  updateService,
  updateSettings,
} from './settings.service.js';

const router = Router();

router.get(
  '/settings',
  authRequired,
  requireAbility('read', 'Settings'),
  apiHandler(() => getSettings()),
);
router.put(
  '/settings',
  authRequired,
  requireAbility('manage', 'Settings'),
  apiHandler(async (req) => {
    const { version, ...input } = readSettingsInput(formBody(req));

    return updateSettings(input, version);
  }),
);

router.get(
  '/services',
  authRequired,
  requireAbility('read', 'Settings'),
  apiHandler(() => listServices()),
);
router.post(
  '/services',
  authRequired,
  requireAbility('manage', 'Settings'),
  apiHandler(async (req) => createService(await readNewServiceInput(formBody(req))), 201),
);
router.put(
  '/services/:id',
  authRequired,
  requireAbility('manage', 'Settings'),
  apiHandler(async (req) => {
    const service = await getService(uuidRouteId(req));
    const { version, ...input } = await readServiceInput(formBody(req), service);

    return updateService(service.id, input, version);
  }),
);

export default applyAuditPolicies(router, auditPolicies);
