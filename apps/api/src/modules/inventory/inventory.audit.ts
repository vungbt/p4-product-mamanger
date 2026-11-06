import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'GET /admin/inventory': {
    action: 'read',
    resourceType: 'variant',
  },
  'GET /admin/inventory/movements': {
    action: 'read',
    resourceType: 'variant',
  },
  'POST /admin/inventory/receipts': {
    action: 'receipt',
    resourceType: 'variant',
  },
  'POST /admin/inventory/adjustments': {
    action: 'adjust',
    resourceType: 'variant',
  },
  'GET /admin/inventory/reconciliation': {
    action: 'read',
    resourceType: 'variant',
  },
} satisfies RouteAuditPolicies;
