import { Router } from 'express';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import { validateOrdersListQuery } from '@/modules/orders/orders.validation.js';
import * as refundsController from '@/modules/refunds/refunds.controller.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { auditPolicies } from './orders.audit.js';
import * as ordersController from './orders.controller.js';
import { validateCheckoutBody } from './orders.validation.js';

const router = Router();

router.get(
  '/',
  authRequired,
  requirePermission('order:read'),
  validateOrdersListQuery,
  ordersController.list,
);
router.get(
  '/mine',
  authRequired,
  requireRole('user', 'admin'),
  validateOrdersListQuery,
  ordersController.listMine,
);
router.get('/:id', authRequired, requireRole('user', 'admin'), ordersController.getOne);
router.post('/', authRequired, requireRole('user'), validateCheckoutBody, ordersController.create);
router.post('/:id/cancel', authRequired, requireRole('user', 'admin'), ordersController.cancel);
router.post(
  '/:id/refunds',
  authRequired,
  requirePermission('refund:manage'),
  refundsController.create,
);

export default applyAuditPolicies(router, auditPolicies);
