import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /expense-categories': { action: 'read', resourceType: 'expense_category' },
  'POST /expense-categories': { action: 'create', resourceType: 'expense_category' },
  'PUT /expense-categories/:id': { action: 'update', resourceType: 'expense_category' },
  'GET /expenses': { action: 'read', resourceType: 'expense' },
  'POST /expenses': { action: 'create', resourceType: 'expense' },
  'PUT /expenses/:id': { action: 'update', resourceType: 'expense' },
  'DELETE /expenses/:id': { action: 'delete', resourceType: 'expense' },
} satisfies RouteAuditPolicies;
