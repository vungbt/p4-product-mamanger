import { Router } from 'express';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.get('/stats', authRequired, requireRole('admin'), dashboardController.stats);

export default router;
