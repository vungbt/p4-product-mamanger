import { Router } from 'express';
import * as refundsController from '@/controllers/refunds.controller.js';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import addressesRouter from './addresses.router.js';
import authRouter from './auth.router.js';
import categoriesRouter from './categories.router.js';
import couponsRouter from './coupons.router.js';
import dashboardRouter from './dashboard.router.js';
import filesRouter from './files.router.js';
import ordersRouter from './orders.router.js';
import paymentsRouter from './payments.router.js';
import productsRouter from './products.router.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/coupons', couponsRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.get('/refunds', authRequired, requireRole('admin'), refundsController.list);
apiRouter.use('/addresses', addressesRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/files', filesRouter);

export default apiRouter;
