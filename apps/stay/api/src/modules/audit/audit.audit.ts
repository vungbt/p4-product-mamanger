import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /audit-logs': { action: 'read', resourceType: 'audit' },
  'GET /audit-logs/:id': { action: 'read', resourceType: 'audit' },
} satisfies RouteAuditPolicies;
