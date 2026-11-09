import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /me': {
    action: 'read',
    resourceType: 'user',
  },
  'GET /me/capabilities': {
    action: 'read',
    resourceType: 'system',
  },
} satisfies RouteAuditPolicies;
