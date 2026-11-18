import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'POST /orders/:id/exchanges': {
    action: 'create',
    resourceType: 'exchange',
  },
  'GET /exchanges/mine': {
    action: 'read',
    resourceType: 'exchange',
  },
  'GET /admin/exchanges': {
    action: 'read',
    resourceType: 'exchange',
  },
  'GET /exchanges/:id': {
    action: 'read',
    resourceType: 'exchange',
  },
  'POST /exchanges/:id/approve': {
    action: 'approve',
    resourceType: 'exchange',
  },
  'POST /exchanges/:id/reject': {
    action: 'reject',
    resourceType: 'exchange',
  },
  'POST /exchanges/:id/create-replacement': {
    action: 'create',
    resourceType: 'exchange',
  },
} satisfies RouteAuditPolicies;
