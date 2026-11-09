import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /cart': {
    action: 'read',
    resourceType: 'cart',
  },
  'POST /cart/items': {
    action: 'create',
    resourceType: 'cart',
  },
  'PATCH /cart/items/:id': {
    action: 'update',
    resourceType: 'cart',
  },
  'DELETE /cart/items/:id': {
    action: 'delete',
    resourceType: 'cart',
  },
  'DELETE /cart/items': {
    action: 'delete',
    resourceType: 'cart',
  },
  'POST /cart/merge': {
    action: 'merge',
    resourceType: 'cart',
  },
} satisfies RouteAuditPolicies;
