import { Router } from 'express';
import * as couponsController from '@/controllers/coupons.controller.js';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import validate from '@/validation/index.js';

const validateCoupon = validate({
  rules: {
    code: 'required|string',
    type: 'required|string',
    value: 'required|integer|min:1',
    minOrderAmount: 'integer|min:0',
    maxDiscount: 'integer|min:0',
    usageLimit: 'integer|min:1',
    isActive: 'boolean',
  },
});

const validatePreview = validate({
  rules: {
    code: 'required|string',
    subtotal: 'required|integer|min:0',
  },
});

const router = Router();

router.post('/preview', authRequired, validatePreview, couponsController.preview);
router.get('/', authRequired, requireRole('admin'), couponsController.list);
router.post('/', authRequired, requireRole('admin'), validateCoupon, couponsController.create);
router.put('/:id', authRequired, requireRole('admin'), couponsController.update);
router.delete('/:id', authRequired, requireRole('admin'), couponsController.remove);

export default router;
