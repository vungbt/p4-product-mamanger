import type { RouteAuditPolicies } from '@/shared/audit/types.js';

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
