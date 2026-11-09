import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
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
  requireAbility('write', 'Catalog'),
  validateCategory,
  categoriesController.create,
);
router.put('/:id', authRequired, requireAbility('write', 'Catalog'), categoriesController.update);
router.delete(
  '/:id',
  authRequired,
  requireAbility('write', 'Catalog'),
  categoriesController.remove,
);

export default applyAuditPolicies(router, auditPolicies);
