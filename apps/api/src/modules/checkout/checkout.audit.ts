import { Transaction } from 'sequelize';
import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'POST /checkout/quotes': {
    transaction: { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    action: 'create',
    resourceType: 'checkout_quote',
  },
  'GET /checkout/quotes/:id': {
    action: 'read',
    resourceType: 'checkout',
  },
} satisfies RouteAuditPolicies;
