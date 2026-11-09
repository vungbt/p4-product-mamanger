import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /me/capabilities': {
    action: 'read',
    resourceType: 'system',
  },
  'GET /admin/system/contracts': {
    action: 'read',
    resourceType: 'system',
  },
} satisfies RouteAuditPolicies;
