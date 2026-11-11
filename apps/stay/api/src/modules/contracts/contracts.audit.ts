import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'POST /contracts/:id/renew': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/rent-change': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/occupants': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/vehicles': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/services': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/room-change': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/occupants/:occupantId/leave': { action: 'update', resourceType: 'contract' },
  'GET /contracts': { action: 'read', resourceType: 'contract' },
  'POST /contracts': { action: 'create', resourceType: 'contract' },
  'GET /contracts/:id': { action: 'read', resourceType: 'contract' },
  'PUT /contracts/:id': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/activate': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/cancel': { action: 'cancel', resourceType: 'contract' },
  'GET /contracts/:id/move-in-preview': { action: 'read', resourceType: 'contract' },
  'POST /contracts/:id/notice': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/cancel-notice': { action: 'update', resourceType: 'contract' },
  'POST /contracts/:id/settlement-preview': { action: 'read', resourceType: 'contract' },
  'POST /contracts/:id/settle': { action: 'update', resourceType: 'contract' },
} satisfies RouteAuditPolicies;
