import { applyAuditPolicies, currentUser, requestBody, uuidRouteId } from '@p4/server-core';
import { Router } from 'express';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { apiHandler } from '@/shared/api-handler.js';
import { cartLines } from '@/shared/commerce/input.js';
import { getCart } from '../cart/cart.service.js';
import { auditPolicies } from './checkout.audit.js';
import * as checkout from './checkout.service.js';

const router = Router();
router.use('/checkout', authRequired);
router.post(
  '/checkout/quotes',
  apiHandler(async (req) => {
    const body = requestBody(req);
    const user = currentUser(req);
    const items =
      body.data.items === undefined
        ? cartLines((await getCart(user.id)).items)
        : cartLines(body.data.items);
    const addressId = body.optionalText('addressId', 36);
    const shippingMethodId = body.optionalText('shippingMethodId', 36);
    for (const [key, value] of Object.entries({ addressId, shippingMethodId }))
      if (value && !/^[a-f0-9-]{36}$/i.test(value)) return body.invalid(key);
    return checkout.createQuote(user.id, {
      items,
      addressId,
      shippingMethodId,
      couponCode: body.optionalText('couponCode', 80),
    });
  }, 201),
);
router.get(
  '/checkout/quotes/:id',
  apiHandler(async (req) => checkout.getQuote(currentUser(req).id, uuidRouteId(req))),
);
export default applyAuditPolicies(router, auditPolicies);
