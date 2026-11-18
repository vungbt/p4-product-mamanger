import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /admin/reports/sales': {
    action: 'read',
    resourceType: 'report',
  },
  'GET /admin/reports/orders': {
    action: 'read',
    resourceType: 'report',
  },
  'GET /admin/reports/inventory': {
    action: 'read',
    resourceType: 'report',
  },
  'GET /admin/reports/products': {
    action: 'read',
    resourceType: 'report',
  },
  'POST /admin/report-exports': {
    action: 'export',
    resourceType: 'report_export',
  },
  'GET /admin/report-exports/:id': {
    action: 'read',
    resourceType: 'report',
  },
  'GET /admin/report-exports/:id/download': {
    action: 'read',
    resourceType: 'report',
  },
} satisfies RouteAuditPolicies;
