import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /internal/metrics': {
    action: 'read',
    resourceType: 'operations',
  },
  'POST /admin/operations/inventory-reconciliation': {
    action: 'reconcile',
    resourceType: 'system',
  },
} satisfies RouteAuditPolicies;
