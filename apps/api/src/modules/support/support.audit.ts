import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'POST /support/tickets': {
    action: 'create',
    resourceType: 'support_ticket',
  },
  'GET /support/tickets/mine': {
    action: 'read',
    resourceType: 'support',
  },
  'GET /admin/support/tickets': {
    action: 'read',
    resourceType: 'support',
  },
  'GET /support/tickets/:id': {
    action: 'read',
    resourceType: 'support',
  },
  'GET /support/tickets/:id/messages': {
    action: 'read',
    resourceType: 'support',
  },
  'POST /support/tickets/:id/messages': {
    action: 'reply',
    resourceType: 'support_ticket',
  },
  'POST /admin/support/tickets/:id/assign': {
    action: 'assign',
    resourceType: 'support_ticket',
  },
  'POST /support/tickets/:id/close': {
    action: 'close',
    resourceType: 'support_ticket',
  },
} satisfies RouteAuditPolicies;
