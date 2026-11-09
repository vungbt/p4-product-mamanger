import type { RouteAuditPolicies } from '@p4/server-core';
import * as categoriesController from './categories.controller.js';

export const auditPolicies = {
  'GET /': {
    action: 'read',
    resourceType: 'category',
  },
  'GET /:id': {
    action: 'read',
    resourceType: 'category',
  },
  'POST /': {
    auditedHandler: categoriesController.create,
    action: 'create',
    resourceType: 'category',
  },
  'PUT /:id': {
    auditedHandler: categoriesController.update,
    action: 'update',
    resourceType: 'category',
  },
  'DELETE /:id': {
    auditedHandler: categoriesController.remove,
    action: 'delete',
    resourceType: 'category',
  },
} satisfies RouteAuditPolicies;
