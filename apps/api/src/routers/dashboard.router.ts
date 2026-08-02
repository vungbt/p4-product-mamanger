import { Router } from 'express';
import * as dashboardController from '@/controllers/dashboard.controller.js';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';

const router = Router();

router.get('/stats', authRequired, requireRole('admin'), dashboardController.stats);

export default router;
