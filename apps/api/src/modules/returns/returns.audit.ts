import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'POST /orders/:id/returns': {
    action: 'create',
    resourceType: 'return',
  },
  'GET /returns/mine': {
    action: 'read',
    resourceType: 'return',
  },
  'GET /admin/returns': {
    action: 'read',
    resourceType: 'return',
  },
  'GET /returns/:id': {
    action: 'read',
    resourceType: 'return',
  },
  'POST /returns/:id/approve': {
    action: 'approve',
    resourceType: 'return',
  },
  'POST /returns/:id/reject': {
    action: 'reject',
    resourceType: 'return',
  },
  'POST /returns/:id/in-transit': {
    action: 'dispatch',
    resourceType: 'return',
  },
  'POST /returns/:id/receive': {
    action: 'receive',
    resourceType: 'return',
  },
  'POST /returns/:id/inspect': {
    action: 'inspect',
    resourceType: 'return',
  },
  'POST /returns/:id/complete': {
    action: 'complete',
    resourceType: 'return',
  },
} satisfies RouteAuditPolicies;
