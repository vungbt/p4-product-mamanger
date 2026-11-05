import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { requirePermission } from '@/middlewares/permission.middleware.js';
import { validateRefundsListQuery } from '@/modules/refunds/refunds.validation.js';
import { apiHandler } from '@/shared/api-handler.js';
import { currentUser, uuidRouteId } from '@/shared/http-input.js';
import { ownedRefund, refundDto } from './refund-processing.service.js';
import * as refundsController from './refunds.controller.js';

const router = Router();

router.get(
  '/',
  authRequired,
  requirePermission('refund:read'),
  validateRefundsListQuery,
  refundsController.list,
);

router.get(
  '/:id',
  authRequired,
  apiHandler(async (req) => refundDto(await ownedRefund(currentUser(req), uuidRouteId(req)))),
);
export default router;
