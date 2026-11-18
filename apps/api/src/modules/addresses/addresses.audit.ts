import type { RouteAuditPolicies } from '@p4/server-core';
import * as addressesController from './addresses.controller.js';

export const auditPolicies = {
  'PATCH /:id/default': {
    action: 'update',
    resourceType: 'address',
  },
  'GET /': {
    action: 'read',
    resourceType: 'address',
  },
  'POST /': {
    auditedHandler: addressesController.create,
    action: 'create',
    resourceType: 'address',
  },
  'PUT /:id': {
    auditedHandler: addressesController.update,
    action: 'update',
    resourceType: 'address',
  },
  'DELETE /:id': {
    auditedHandler: addressesController.remove,
    action: 'delete',
    resourceType: 'address',
  },
} satisfies RouteAuditPolicies;
