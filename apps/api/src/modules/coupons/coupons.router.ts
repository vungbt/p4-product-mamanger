import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import { validateCouponsListQuery } from '@/modules/coupons/coupons.validation.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { auditPolicies } from './coupons.audit.js';
import * as couponsController from './coupons.controller.js';
import { validateCoupon, validatePreview } from './coupons.validation.js';

const router = Router();

router.post('/preview', authRequired, validatePreview, couponsController.preview);
router.get(
  '/',
  authRequired,
  requirePermission('promotion:read'),
  validateCouponsListQuery,
  couponsController.list,
);
router.post(
  '/',
  authRequired,
  requirePermission('promotion:write'),
  validateCoupon,
  couponsController.create,
);
router.put('/:id', authRequired, requirePermission('promotion:write'), couponsController.update);
router.delete('/:id', authRequired, requirePermission('promotion:write'), couponsController.remove);

export default applyAuditPolicies(router, auditPolicies);
