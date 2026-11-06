import type { RouteAuditPolicies } from '@/shared/audit/types.js';

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
