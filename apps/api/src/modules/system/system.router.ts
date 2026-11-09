import { abilityRules, createAnonymousAbility } from '@p4/ability/shared';
import { Router } from 'express';
import { abilityOf, requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { COMMERCE_POLICY, CONTRACT_VERSION, TRANSITIONS } from '@/shared/commerce/contracts.js';
import { auditPolicies } from './system.audit.js';

const router = Router();
router.get('/me/capabilities', authRequired, (req, res) => {
  return res.jsonApi(200, {
    data: {
      contractVersion: CONTRACT_VERSION,
      rules: abilityRules(req.user ? abilityOf(req.user) : createAnonymousAbility()),
    },
  });
});
router.get(
  '/admin/system/contracts',
  authRequired,
  requireAbility('read', 'System'),
  (_req, res) => {
    return res.jsonApi(200, {
      data: { version: CONTRACT_VERSION, policy: COMMERCE_POLICY, transitions: TRANSITIONS },
    });
  },
);
export default applyAuditPolicies(router, auditPolicies);
