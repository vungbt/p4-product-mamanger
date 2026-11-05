import { Router } from 'express';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import { validateCouponsListQuery } from '@/modules/coupons/coupons.validation.js';
import * as couponsController from './coupons.controller.js';
import { validateCoupon, validatePreview } from './coupons.validation.js';

const router = Router();

router.post('/preview', authRequired, validatePreview, couponsController.preview);
router.get(
  '/',
  authRequired,
  requireRole('admin'),
  validateCouponsListQuery,
  couponsController.list,
);
router.post('/', authRequired, requireRole('admin'), validateCoupon, couponsController.create);
router.put('/:id', authRequired, requireRole('admin'), couponsController.update);
router.delete('/:id', authRequired, requireRole('admin'), couponsController.remove);

export default router;
