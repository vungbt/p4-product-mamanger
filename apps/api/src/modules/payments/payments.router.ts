import { applyAuditPolicies } from '@p4/server-core';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { auditPolicies } from './payments.audit.js';
import * as paymentsController from './payments.controller.js';

const router = Router();
router.post('/:id/mock-pay', authRequired, paymentsController.mockPay);
export default applyAuditPolicies(router, auditPolicies);
