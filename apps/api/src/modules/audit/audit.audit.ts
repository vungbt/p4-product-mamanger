import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'GET /admin/audit-logs': {
    action: 'read',
    resourceType: 'audit',
  },
  'GET /admin/audit-logs/:id': {
    action: 'read',
    resourceType: 'audit',
  },
} satisfies RouteAuditPolicies;
