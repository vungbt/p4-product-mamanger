import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { auditPolicies } from './categories.audit.js';
import * as categoriesController from './categories.controller.js';
import { validateCategory, validateCategoryListQuery } from './categories.validation.js';

const router = Router();

router.get('/', validateCategoryListQuery, categoriesController.list);
router.get('/:id', categoriesController.getById);
router.post(
  '/',
  authRequired,
  requirePermission('catalog:write'),
  validateCategory,
  categoriesController.create,
);
router.put('/:id', authRequired, requirePermission('catalog:write'), categoriesController.update);
router.delete(
  '/:id',
  authRequired,
  requirePermission('catalog:write'),
  categoriesController.remove,
);

export default applyAuditPolicies(router, auditPolicies);
