import { applyAuditPolicies } from '@p4/server-core';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { validateCouponsListQuery } from '@/modules/coupons/coupons.validation.js';
import { auditPolicies } from './coupons.audit.js';
import * as couponsController from './coupons.controller.js';
import { validateCoupon, validatePreview } from './coupons.validation.js';

const router = Router();

router.post('/preview', authRequired, validatePreview, couponsController.preview);
router.get(
  '/',
  authRequired,
  requireAbility('read', 'Promotion'),
  validateCouponsListQuery,
  couponsController.list,
);
router.post(
  '/',
  authRequired,
  requireAbility('write', 'Promotion'),
  validateCoupon,
  couponsController.create,
);
router.put('/:id', authRequired, requireAbility('write', 'Promotion'), couponsController.update);
router.delete('/:id', authRequired, requireAbility('write', 'Promotion'), couponsController.remove);

export default applyAuditPolicies(router, auditPolicies);
