import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /admin/roles': {
    action: 'read',
    resourceType: 'user',
  },
  'GET /admin/staff': {
    action: 'read',
    resourceType: 'user',
  },
  'GET /admin/customers': {
    action: 'read',
    resourceType: 'user',
  },
  'POST /admin/staff/invitations': {
    action: 'create',
    resourceType: 'user',
  },
  'POST /staff/invitations/accept': {
    action: 'accept',
    resourceType: 'user',
  },
  'PATCH /admin/staff/:id/role': {
    action: 'update',
    resourceType: 'user',
  },
  'PATCH /admin/staff/:id/status': {
    action: 'update',
    resourceType: 'user',
  },
  'PATCH /admin/customers/:id/status': {
    action: 'update',
    resourceType: 'user',
  },
} satisfies RouteAuditPolicies;
