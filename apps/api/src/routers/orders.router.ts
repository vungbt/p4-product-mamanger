import { Router } from 'express';
import * as ordersController from '@/controllers/orders.controller.js';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import { paginationMiddleware } from '@/middlewares/pagination.middleware.js';
import { validateCheckoutBody } from '@/validation/orders.validation.js';

const router = Router();

router.get('/', authRequired, requireRole('admin'), paginationMiddleware, ordersController.list);
router.post('/', authRequired, requireRole('user'), validateCheckoutBody, ordersController.create);

export default router;
