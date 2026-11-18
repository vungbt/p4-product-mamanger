import type { RouteAuditPolicies } from '@p4/server-core';
import * as couponsController from './coupons.controller.js';

export const auditPolicies = {
  'POST /preview': {
    action: 'read',
    resourceType: 'coupon',
  },
  'GET /': {
    action: 'read',
    resourceType: 'coupon',
  },
  'POST /': {
    auditedHandler: couponsController.create,
    action: 'create',
    resourceType: 'coupon',
  },
  'PUT /:id': {
    auditedHandler: couponsController.update,
    action: 'update',
    resourceType: 'coupon',
  },
  'DELETE /:id': {
    auditedHandler: couponsController.remove,
    action: 'delete',
    resourceType: 'coupon',
  },
} satisfies RouteAuditPolicies;
