import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /wishlist': {
    action: 'read',
    resourceType: 'wishlist',
  },
  'PUT /wishlist/items/:productId': {
    action: 'update',
    resourceType: 'wishlist',
  },
  'DELETE /wishlist/items/:productId': {
    action: 'delete',
    resourceType: 'wishlist',
  },
  'POST /stock-alert-subscriptions': {
    action: 'create',
    resourceType: 'stock_alert_subscription',
  },
  'GET /stock-alert-subscriptions/mine': {
    action: 'read',
    resourceType: 'wishlist',
  },
  'DELETE /stock-alert-subscriptions/:id': {
    action: 'delete',
    resourceType: 'stock_alert_subscription',
  },
} satisfies RouteAuditPolicies;
