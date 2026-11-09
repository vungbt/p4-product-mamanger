import { Router } from 'express';
import { requireAbility } from '@/middlewares/ability.middleware.js';
import { authRequired } from '@/middlewares/auth.middleware.js';
import { ShipmentEventModel, ShipmentModel } from '@/sequelize/models/index.js';
import { apiHandler } from '@/shared/api-handler.js';
import { applyAuditPolicies } from '@/shared/audit/route-policy.js';
import { orderQuantities } from '@/shared/commerce/input.js';
import { currentUser, requestBody, uuidRouteId } from '@/shared/http-input.js';
import { NotFound } from '@/utils/errors/index.js';
import { ownedOrder } from '../orders/order-lifecycle.service.js';
import { auditPolicies } from './fulfillment.audit.js';
import * as fulfillment from './fulfillment.service.js';

const router = Router();
router.post(
  '/orders/:id/shipments',
  authRequired,
  requireAbility('manage', 'Fulfillment'),
  apiHandler(async (req) => {
    const body = requestBody(req);
    return fulfillment.createShipment(
      currentUser(req).id,
      uuidRouteId(req),
      body.integer('expectedVersion', 1),
      orderQuantities(body.data.items),
      body.text('carrier', 120),
    );
  }, 201),
);
router.get(
  '/orders/:id/shipments',
  authRequired,
  apiHandler(async (req) => fulfillment.listShipments(currentUser(req), uuidRouteId(req))),
);
for (const [action, state] of [
  ['pack', 'packed'],
  ['ready', 'ready_for_pickup'],
  ['handover', 'in_transit'],
  ['out-for-delivery', 'out_for_delivery'],
  ['deliver', 'delivered'],
  ['fail', 'delivery_failed'],
  ['return', 'returned'],
  ['lose', 'lost'],
  ['cancel', 'cancelled'],
] as const) {
  router.post(
    `/shipments/:id/${action}`,
    authRequired,
    requireAbility('manage', 'Fulfillment'),
    apiHandler(async (req) => {
      const body = requestBody(req);
      return fulfillment.transitionShipment(
        currentUser(req).id,
        uuidRouteId(req),
        state,
        body.integer('expectedVersion', 1),
        body.text('reference', 120),
        body.optionalText('trackingCode', 120),
      );
    }),
  );
}
router.get(
  '/shipments/:id/events',
  authRequired,
  apiHandler(async (req) => {
    const id = uuidRouteId(req);
    const shipment = await ShipmentModel.findByPk(id);
    if (!shipment) throw new NotFound();
    await ownedOrder(currentUser(req), shipment.orderId);
    return (
      await ShipmentEventModel.findAll({
        where: { shipmentId: id },
        order: [['occurredAt', 'ASC']],
        limit: 100,
      })
    ).map((row) => ({ id: row.id, type: row.type, occurredAt: row.occurredAt.toISOString() }));
  }),
);
export default applyAuditPolicies(router, auditPolicies);
