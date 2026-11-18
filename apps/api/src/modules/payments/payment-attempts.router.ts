import { applyAuditPolicies, currentUser, requestBody, uuidRouteId } from '@p4/server-core';
import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { PaymentAttemptModel } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { ownedOrder } from '../orders/order-lifecycle.service.js';
import { auditPolicies } from './payment-attempts.audit.js';
import * as service from './payment-attempts.service.js';

const router = Router();
router.post(
  '/orders/:id/payment-attempts',
  authRequired,
  apiHandler(
    async (req) =>
      service.createPaymentAttempt(
        currentUser(req),
        uuidRouteId(req),
        requestBody(req).enum('provider', ['cod', 'stripe', 'mock']),
        req.header('Idempotency-Key') ?? '',
      ),
    201,
  ),
);
router.get(
  '/orders/:id/payments',
  authRequired,
  apiHandler(async (req) => {
    const id = uuidRouteId(req);
    await ownedOrder(currentUser(req), id);
    return (
      await PaymentAttemptModel.findAll({
        where: { orderId: id },
        order: [
          ['createdAt', 'DESC'],
          ['id', 'ASC'],
        ],
      })
    ).map(service.paymentAttemptDto);
  }),
);
router.post(
  '/admin/payments/:id/reconcile',
  authRequired,
  requireAbility('manage', 'Payment'),
  apiHandler(async (req) => service.reconcilePayment(currentUser(req).id, uuidRouteId(req))),
);
router.post(
  '/admin/payments/:id/cod-collection',
  authRequired,
  requireAbility('manage', 'Payment'),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return service.collectCod(
      currentUser(req).id,
      uuidRouteId(req),
      body.text('reference', 120),
      body.integer('amount'),
    );
  }),
);
export default applyAuditPolicies(router, auditPolicies);
