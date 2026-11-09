import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /settings': {
    action: 'read',
    resourceType: 'settings',
  },
  'PUT /settings': {
    action: 'update',
    resourceType: 'settings',
  },
  'GET /services': {
    action: 'read',
    resourceType: 'service',
  },
  'POST /services': {
    action: 'create',
    resourceType: 'service',
  },
  'PUT /services/:id': {
    action: 'update',
    resourceType: 'service',
  },
} satisfies RouteAuditPolicies;
