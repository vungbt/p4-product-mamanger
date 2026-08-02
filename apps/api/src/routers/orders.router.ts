import { Router } from 'express';
import * as ordersController from '@/controllers/orders.controller.js';
import * as refundsController from '@/controllers/refunds.controller.js';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import { paginationMiddleware } from '@/middlewares/pagination.middleware.js';
import {
  validateCheckoutBody,
  validateShipmentUpdateBody,
} from '@/validation/orders.validation.js';

const router = Router();

router.get('/', authRequired, requireRole('admin'), paginationMiddleware, ordersController.list);
router.get(
  '/mine',
  authRequired,
  requireRole('user', 'admin'),
  paginationMiddleware,
  ordersController.listMine,
);
router.get('/:id', authRequired, requireRole('user', 'admin'), ordersController.getOne);
router.post('/', authRequired, requireRole('user'), validateCheckoutBody, ordersController.create);
router.patch(
  '/:id/shipment',
  authRequired,
  requireRole('admin'),
  validateShipmentUpdateBody,
  ordersController.updateShipment,
);
router.post('/:id/cancel', authRequired, requireRole('user', 'admin'), ordersController.cancel);
router.post('/:id/refunds', authRequired, requireRole('admin'), refundsController.create);

export default router;
