import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { auditPolicies } from './dashboard.audit.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.get('/stats', authRequired, requireAbility('read', 'Report'), dashboardController.stats);

export default applyAuditPolicies(router, auditPolicies);
