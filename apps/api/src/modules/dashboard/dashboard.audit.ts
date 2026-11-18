import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /stats': {
    action: 'read',
    resourceType: 'dashboard',
  },
} satisfies RouteAuditPolicies;
