import { applyAuditPolicies, currentUser, uuidRouteId } from '@p4/server-core';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { validateRefundsListQuery } from '@/modules/refunds/refunds.validation.js';
import { apiHandler } from '@/shared/api-handler.js';
import { ownedRefund, refundDto } from './refund-processing.service.js';
import { auditPolicies } from './refunds.audit.js';
import * as refundsController from './refunds.controller.js';

const router = Router();

router.get(
  '/',
  authRequired,
  requireAbility('read', 'Refund'),
  validateRefundsListQuery,
  refundsController.list,
);

router.get(
  '/:id',
  authRequired,
  apiHandler(async (req) => refundDto(await ownedRefund(currentUser(req), uuidRouteId(req)))),
);
export default applyAuditPolicies(router, auditPolicies);
