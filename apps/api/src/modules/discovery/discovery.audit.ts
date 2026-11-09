import type { RouteAuditPolicies } from '@p4/server-core';

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
