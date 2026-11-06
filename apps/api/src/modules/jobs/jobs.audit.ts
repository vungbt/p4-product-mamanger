import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'GET /admin/jobs': {
    action: 'read',
    resourceType: 'job',
  },
  'GET /admin/jobs/:id': {
    action: 'read',
    resourceType: 'job',
  },
  'POST /admin/jobs/:id/retry': {
    action: 'retry',
    resourceType: 'job',
  },
} satisfies RouteAuditPolicies;
