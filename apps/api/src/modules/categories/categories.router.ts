import { Router } from 'express';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import * as categoriesController from './categories.controller.js';
import { validateCategory } from './categories.validation.js';

const router = Router();

router.get('/', categoriesController.list);
router.get('/:id', categoriesController.getById);
router.post('/', authRequired, requireRole('admin'), validateCategory, categoriesController.create);
router.put('/:id', authRequired, requireRole('admin'), categoriesController.update);
router.delete('/:id', authRequired, requireRole('admin'), categoriesController.remove);

export default router;
