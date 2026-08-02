import { Router } from 'express';
import authRouter from './auth.router.js';
import dashboardRouter from './dashboard.router.js';
import filesRouter from './files.router.js';
import ordersRouter from './orders.router.js';
import productsRouter from './products.router.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/files', filesRouter);

export default apiRouter;
