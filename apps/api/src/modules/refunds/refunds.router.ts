import { Router } from 'express';
import { authRequired, requireRole } from '@/middlewares/auth.middleware.js';
import { validateRefundsListQuery } from '@/modules/refunds/refunds.validation.js';
import * as refundsController from './refunds.controller.js';

const router = Router();

router.get(
  '/',
  authRequired,
  requireRole('admin'),
  validateRefundsListQuery,
  refundsController.list,
);

export default router;
