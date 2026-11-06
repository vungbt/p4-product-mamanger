import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'GET /products/facets': {
    action: 'read',
    resourceType: 'discovery',
  },
  'GET /search/suggestions': {
    action: 'read',
    resourceType: 'discovery',
  },
} satisfies RouteAuditPolicies;
