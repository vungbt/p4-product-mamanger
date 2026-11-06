import * as refundsController from '@/modules/refunds/refunds.controller.js';
import type { RouteAuditPolicies } from '@/shared/audit/types.js';
import * as ordersController from './orders.controller.js';

export const auditPolicies = {
  'GET /': {
    action: 'read',
    resourceType: 'order',
  },
  'GET /mine': {
    action: 'read',
    resourceType: 'order',
  },
  'GET /:id': {
    action: 'read',
    resourceType: 'order',
  },
  'POST /': {
    auditedHandler: ordersController.create,
    action: 'create',
    resourceType: 'order',
  },
  'POST /:id/cancel': {
    auditedHandler: ordersController.cancel,
    action: 'cancel',
    resourceType: 'order',
  },
  'POST /:id/refunds': {
    auditedHandler: refundsController.create,
    action: 'refund',
    resourceType: 'refund',
  },
} satisfies RouteAuditPolicies;
