import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { permissionsFor, requirePermission } from '@/middlewares/permission.middleware.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { COMMERCE_POLICY, CONTRACT_VERSION, TRANSITIONS } from '@/shared/commerce/contracts.js';
import { auditPolicies } from './system.audit.js';

const router = Router();
router.get('/me/capabilities', authRequired, (req, res) => {
  return res.jsonApi(200, {
    data: {
      contractVersion: CONTRACT_VERSION,
      permissions: req.user ? permissionsFor(req.user) : [],
    },
  });
});
router.get(
  '/admin/system/contracts',
  authRequired,
  requirePermission('system:read'),
  (_req, res) => {
    return res.jsonApi(200, {
      data: { version: CONTRACT_VERSION, policy: COMMERCE_POLICY, transitions: TRANSITIONS },
    });
  },
);
export default applyAuditPolicies(router, auditPolicies);
