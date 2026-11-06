import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'POST /admin/imports/:resource': {
    action: 'import',
    resourceType: 'process',
  },
  'GET /admin/import-templates/:resource': {
    action: 'read',
    resourceType: 'process',
  },
  'POST /admin/exports': {
    action: 'export',
    resourceType: 'process',
  },
  'POST /files/uploads/batch': {
    action: 'create',
    resourceType: 'upload_batch',
  },
  'POST /files/uploads/batch/complete': {
    action: 'submit',
    resourceType: 'process',
  },
  'GET /processes': {
    action: 'read',
    resourceType: 'process',
  },
  'GET /processes/:id': {
    action: 'read',
    resourceType: 'process',
  },
  'GET /processes/:id/items': {
    action: 'read',
    resourceType: 'process',
  },
  'POST /processes/:id/confirm': {
    action: 'confirm',
    resourceType: 'process',
  },
  'POST /processes/:id/cancel': {
    action: 'cancel',
    resourceType: 'process',
  },
  'GET /processes/:id/download': {
    action: 'read',
    resourceType: 'process',
  },
} satisfies RouteAuditPolicies;
