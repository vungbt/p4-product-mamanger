import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /contracts': { action: 'read', resourceType: 'contract' },
  'POST /contracts': { action: 'create', resourceType: 'contract' },
  'GET /contracts/:id': { action: 'read', resourceType: 'contract' },
  'PUT /contracts/:id': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/activate': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/cancel': { action: 'cancel', resourceType: 'contract' },
  'GET /contracts/:id/move-in-preview': { action: 'read', resourceType: 'contract' },
} satisfies RouteAuditPolicies;
