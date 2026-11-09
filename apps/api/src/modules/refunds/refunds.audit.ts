import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /': {
    action: 'read',
    resourceType: 'refund',
  },
  'GET /:id': {
    action: 'read',
    resourceType: 'refund',
  },
} satisfies RouteAuditPolicies;
