import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import * as refunds from './refund-processing.service.js';

const router = Router();
router.post(
  '/admin/refunds/:id/reconcile',
  authRequired,
  requirePermission('refund:manage'),
  apiHandler(async (req) => refunds.reconcileRefund(currentUser(req).id, uuidRouteId(req))),
);
router.post(
  '/admin/refunds/:id/retry',
  authRequired,
  requirePermission('refund:manage'),
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
  requirePermission('refund:manage'),
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
export default router;
