import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'POST /order-items/:id/reviews': {
    action: 'create',
    resourceType: 'review',
  },
  'PATCH /reviews/:id': {
    action: 'update',
    resourceType: 'review',
  },
  'POST /reviews/:id/moderation': {
    action: 'moderate',
    resourceType: 'review',
  },
  'PUT /reviews/:id/reply': {
    action: 'reply',
    resourceType: 'review',
  },
  'POST /reviews/:id/reports': {
    action: 'create',
    resourceType: 'review_report',
  },
  'GET /admin/reviews': {
    action: 'read',
    resourceType: 'review',
  },
  'GET /products/:id/review-summary': {
    action: 'read',
    resourceType: 'review',
  },
} satisfies RouteAuditPolicies;
