import { applyAuditPolicies } from '@p4/server-core';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import { validateOrdersListQuery } from '@/modules/orders/orders.validation.js';
import * as refundsController from '@/modules/refunds/refunds.controller.js';
import { auditPolicies } from './orders.audit.js';
import * as ordersController from './orders.controller.js';
import { validateCheckoutBody } from './orders.validation.js';

const router = Router();

router.get(
  '/',
  authRequired,
  requireAbility('read', 'Order'),
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
  requireAbility('manage', 'Refund'),
  refundsController.create,
);

export default applyAuditPolicies(router, auditPolicies);
