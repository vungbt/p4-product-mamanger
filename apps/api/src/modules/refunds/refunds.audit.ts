import type { RouteAuditPolicies } from '@/shared/audit/types.js';

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
