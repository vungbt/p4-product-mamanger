import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'GET /notifications': {
    action: 'read',
    resourceType: 'notification',
  },
  'GET /notifications/unread-count': {
    action: 'read',
    resourceType: 'notification',
  },
  'POST /notifications/read-all': {
    action: 'mark_read',
    resourceType: 'notification',
  },
  'POST /notifications/:id/read': {
    action: 'mark_read',
    resourceType: 'notification',
  },
  'GET /me/notification-preferences': {
    action: 'read',
    resourceType: 'notification',
  },
  'PATCH /me/notification-preferences': {
    action: 'update',
    resourceType: 'user',
  },
  'GET /admin/notification-templates': {
    action: 'read',
    resourceType: 'notification',
  },
  'PUT /admin/notification-templates': {
    action: 'update',
    resourceType: 'notification_template',
  },
} satisfies RouteAuditPolicies;
