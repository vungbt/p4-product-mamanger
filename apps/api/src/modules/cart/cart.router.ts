import { applyAuditPolicies, currentUser, requestBody, uuidRouteId } from '@p4/server-core';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { cartLines } from '@/shared/commerce/input.js';
import { auditPolicies } from './cart.audit.js';
import * as cart from './cart.service.js';

const router = Router();
router.use('/cart', authRequired);
router.get(
  '/cart',
  apiHandler(async (req) => cart.getCart(currentUser(req).id)),
);
router.post(
  '/cart/items',
  apiHandler(async (req) => {
    const body = requestBody(req);
    const line = cartLines([{ variantId: body.data.variantId, quantity: body.data.quantity }])[0];
    if (!line) return body.invalid('variantId');
    return cart.addItem(currentUser(req).id, body.integer('expectedVersion', 1), line);
  }, 201),
);
router.patch(
  '/cart/items/:id',
  apiHandler(async (req) => {
    const body = requestBody(req);
    return cart.changeItem(
      currentUser(req).id,
      body.integer('expectedVersion', 1),
      uuidRouteId(req),
      body.integer('quantity', 1, 99),
    );
  }),
);
router.delete(
  '/cart/items/:id',
  apiHandler(async (req) =>
    cart.changeItem(
      currentUser(req).id,
      requestBody(req).integer('expectedVersion', 1),
      uuidRouteId(req),
      null,
    ),
  ),
);
router.delete(
  '/cart/items',
  apiHandler(async (req) =>
    cart.changeItem(
      currentUser(req).id,
      requestBody(req).integer('expectedVersion', 1),
      null,
      null,
    ),
  ),
);
router.post(
  '/cart/merge',
  apiHandler(async (req) =>
    cart.mergeCart(
      currentUser(req).id,
      req.header('Idempotency-Key') ?? '',
      cartLines(requestBody(req).data.items),
    ),
  ),
);
export default applyAuditPolicies(router, auditPolicies);
