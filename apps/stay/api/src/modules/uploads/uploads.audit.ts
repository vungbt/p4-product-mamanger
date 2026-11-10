import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'POST /uploads': {
    action: 'create',
    resourceType: 'upload',
  },
  'GET /uploads/:id': {
    action: 'read',
    resourceType: 'upload',
  },
  'POST /uploads/:id/complete': {
    action: 'complete',
    resourceType: 'upload',
  },
  'POST /uploads/:id/stub': {
    action: 'receive',
    resourceType: 'upload',
  },
  'GET /files/:id/stub': {
    action: 'read',
    resourceType: 'file',
  },
} satisfies RouteAuditPolicies;
