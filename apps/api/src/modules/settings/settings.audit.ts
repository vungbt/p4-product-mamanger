import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'GET /shop/config': {
    action: 'read',
    resourceType: 'settings',
  },
  'GET /admin/settings/shop': {
    action: 'read',
    resourceType: 'settings',
  },
  'GET /admin/settings/commerce': {
    action: 'read',
    resourceType: 'settings',
  },
  'PATCH /admin/settings/shop': {
    action: 'update',
    resourceType: 'settings',
  },
  'PATCH /admin/settings/commerce': {
    action: 'update',
    resourceType: 'settings',
  },
  'GET /admin/shipping-methods': {
    action: 'read',
    resourceType: 'settings',
  },
  'GET /admin/shipping-methods/:id': {
    action: 'read',
    resourceType: 'settings',
  },
  'POST /admin/shipping-methods': {
    action: 'create',
    resourceType: 'shipping_method',
  },
  'PATCH /admin/shipping-methods/:id': {
    action: 'update',
    resourceType: 'shipping_method',
  },
  'POST /shipping/quotes': {
    action: 'read',
    resourceType: 'shipping_method',
  },
} satisfies RouteAuditPolicies;
