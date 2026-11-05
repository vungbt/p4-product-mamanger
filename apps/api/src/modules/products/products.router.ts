import { Router } from 'express';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import { validateProductsListQuery } from '@/modules/products/products.validation.js';
import * as reviewsController from '@/modules/reviews/reviews.controller.js';
import { validateReview, validateReviewsListQuery } from '@/modules/reviews/reviews.validation.js';
import * as productsController from './products.controller.js';
import {
  validateAddImage,
  validateCreateProduct,
  validateUpdateProduct,
} from './products.validation.js';

const router = Router();

router.get('/', validateProductsListQuery, productsController.list);
router.get('/:id', productsController.getById);
router.get('/:id/reviews', validateReviewsListQuery, reviewsController.listByProduct);
router.post(
  '/:id/reviews',
  authRequired,
  requireRole('user', 'admin'),
  validateReview,
  reviewsController.create,
);
router.delete(
  '/:id/reviews/:reviewId',
  authRequired,
  requireRole('user', 'admin'),
  reviewsController.remove,
);

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
router.post(
  '/:id/images',
  authRequired,
  requireRole('admin'),
  validateAddImage,
  productsController.addImage,
);
router.delete(
  '/:id/images/:imageId',
  authRequired,
  requireRole('admin'),
  productsController.removeImage,
);

export default router;
