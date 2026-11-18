import { applyAuditPolicies, currentUser } from '@p4/server-core';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { auditPolicies } from './me.audit.js';
import { getCapabilities, getMe } from './me.service.js';

const router = Router();

router.get(
  '/me',
  authRequired,
  apiHandler((req) => getMe(currentUser(req))),
);
router.get(
  '/me/capabilities',
  authRequired,
  apiHandler((req) => getCapabilities(currentUser(req))),
);

export default applyAuditPolicies(router, auditPolicies);
