import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.get('/stats', authRequired, requirePermission('report:read'), dashboardController.stats);

export default router;
