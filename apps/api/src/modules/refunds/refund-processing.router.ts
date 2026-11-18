import { applyAuditPolicies, currentUser, requestBody, uuidRouteId } from '@p4/server-core';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { auditPolicies } from './refund-processing.audit.js';
import * as refunds from './refund-processing.service.js';

const router = Router();
router.post(
  '/admin/refunds/:id/reconcile',
  authRequired,
  requireAbility('manage', 'Refund'),
  apiHandler(async (req) => refunds.reconcileRefund(currentUser(req).id, uuidRouteId(req))),
);
router.post(
  '/admin/refunds/:id/retry',
  authRequired,
  requireAbility('manage', 'Refund'),
  apiHandler(async (req) =>
    refunds.retryRefund(
      currentUser(req).id,
      uuidRouteId(req),
      requestBody(req).integer('expectedVersion', 1),
    ),
  ),
);
router.post(
  '/admin/refunds/:id/manual-confirmation',
  authRequired,
  requireAbility('manage', 'Refund'),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return refunds.manualRefund(
      currentUser(req).id,
      uuidRouteId(req),
      body.integer('expectedVersion', 1),
      body.text('reference', 120),
      body.integer('amount', 1),
    );
  }),
);
export default applyAuditPolicies(router, auditPolicies);
