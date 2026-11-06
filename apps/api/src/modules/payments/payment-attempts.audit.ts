import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'POST /orders/:id/payment-attempts': {
    action: 'create',
    resourceType: 'payment_attempt',
  },
  'GET /orders/:id/payments': {
    action: 'read',
    resourceType: 'payment',
  },
  'POST /admin/payments/:id/reconcile': {
    action: 'reconcile',
    resourceType: 'payment_attempt',
  },
  'POST /admin/payments/:id/cod-collection': {
    action: 'collect_payment',
    resourceType: 'payment_attempt',
  },
} satisfies RouteAuditPolicies;
