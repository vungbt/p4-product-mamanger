import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'POST /orders/:id/confirm': {
    action: 'confirm',
    resourceType: 'order',
  },
  'POST /orders/:id/start-processing': {
    action: 'process',
    resourceType: 'order',
  },
  'GET /orders/:id/events': {
    action: 'read',
    resourceType: 'order',
  },
  'POST /orders/:id/cancellation-requests': {
    action: 'create',
    resourceType: 'cancellation',
  },
  'GET /cancellation-requests/:id': {
    action: 'read',
    resourceType: 'order',
  },
  'POST /cancellation-requests/:id/approve': {
    action: 'approve',
    resourceType: 'cancellation',
  },
  'POST /cancellation-requests/:id/reject': {
    action: 'reject',
    resourceType: 'cancellation',
  },
} satisfies RouteAuditPolicies;
