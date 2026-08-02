import { Router } from 'express';
import * as productsController from '@/controllers/products.controller.js';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import { paginationMiddleware } from '@/middlewares/pagination.middleware.js';
import { validateCreateProduct, validateUpdateProduct } from '@/validation/products.validation.js';

const router = Router();

router.get('/', paginationMiddleware, productsController.list);
router.get('/:id', productsController.getById);
router.post(
  '/',
  authRequired,
  requireRole('admin'),
  validateCreateProduct,
  productsController.create,
);
router.put(
  '/:id',
  authRequired,
  requireRole('admin'),
  validateUpdateProduct,
  productsController.update,
);
router.delete('/:id', authRequired, requireRole('admin'), productsController.remove);

export default router;
