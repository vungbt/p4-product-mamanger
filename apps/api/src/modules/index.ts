import { Router } from 'express';
import addressesRouter from './addresses/addresses.router.js';
import authRouter from './auth/auth.router.js';
import categoriesRouter from './categories/categories.router.js';
import couponsRouter from './coupons/coupons.router.js';
import dashboardRouter from './dashboard/dashboard.router.js';
import filesRouter from './files/files.router.js';
import ordersRouter from './orders/orders.router.js';
import paymentsRouter from './payments/payments.router.js';
import productsRouter from './products/products.router.js';
import refundsRouter from './refunds/refunds.router.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/coupons', couponsRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/refunds', refundsRouter);
apiRouter.use('/addresses', addressesRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/files', filesRouter);

export default apiRouter;
