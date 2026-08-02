import { Router } from 'express';
import * as productsController from '@/controllers/products.controller.js';
import * as reviewsController from '@/controllers/reviews.controller.js';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import { paginationMiddleware } from '@/middlewares/pagination.middleware.js';
import validate from '@/validation/index.js';
import { validateCreateProduct, validateUpdateProduct } from '@/validation/products.validation.js';

const validateReview = validate({
  rules: {
    rating: 'required|integer|min:1|max:5',
    comment: 'string',
  },
});

const validateAddImage = validate({
  rules: {
    imageStorageId: 'required|string',
    sortOrder: 'integer|min:0',
  },
});

const router = Router();

router.get('/', paginationMiddleware, productsController.list);
router.get('/:id', productsController.getById);
router.get('/:id/reviews', reviewsController.listByProduct);
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
