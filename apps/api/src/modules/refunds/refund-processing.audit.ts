import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'POST /admin/refunds/:id/reconcile': {
    action: 'reconcile',
    resourceType: 'refund',
  },
  'POST /admin/refunds/:id/retry': {
    action: 'retry',
    resourceType: 'refund',
  },
  'POST /admin/refunds/:id/manual-confirmation': {
    action: 'confirm',
    resourceType: 'refund',
  },
} satisfies RouteAuditPolicies;
