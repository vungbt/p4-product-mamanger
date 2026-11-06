import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'GET /admin/promotions': {
    action: 'read',
    resourceType: 'promotion',
  },
  'GET /admin/promotions/:id': {
    action: 'read',
    resourceType: 'promotion',
  },
  'POST /admin/promotions': {
    action: 'create',
    resourceType: 'promotion',
  },
  'PATCH /admin/promotions/:id': {
    action: 'update',
    resourceType: 'promotion',
  },
  'GET /admin/coupons/:id': {
    action: 'read',
    resourceType: 'promotion',
  },
  'GET /admin/coupons/:id/redemptions': {
    action: 'read',
    resourceType: 'promotion',
  },
} satisfies RouteAuditPolicies;
