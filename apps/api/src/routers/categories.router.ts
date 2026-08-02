import { Router } from 'express';
import * as categoriesController from '@/controllers/categories.controller.js';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import validate from '@/validation/index.js';

const validateCategory = validate({
  rules: {
    name: 'required|string',
    slug: 'required|string',
    description: 'string',
  },
});

const router = Router();

router.get('/', categoriesController.list);
router.get('/:id', categoriesController.getById);
router.post('/', authRequired, requireRole('admin'), validateCategory, categoriesController.create);
router.put('/:id', authRequired, requireRole('admin'), categoriesController.update);
router.delete('/:id', authRequired, requireRole('admin'), categoriesController.remove);

export default router;
