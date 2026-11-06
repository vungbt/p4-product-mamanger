import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'GET /stats': {
    action: 'read',
    resourceType: 'dashboard',
  },
} satisfies RouteAuditPolicies;
