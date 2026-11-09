import type { RouteAuditPolicies } from '@p4/server-core';
import * as filesController from './files.controller.js';

export const auditPolicies = {
  'GET /sign-upload-url': {
    auditedHandler: filesController.getSignUploadUrl,
    action: 'create',
    resourceType: 'file',
  },
  'GET /sign-upload-urls': {
    auditedHandler: filesController.getSignUploadUrls,
    action: 'create',
    resourceType: 'file',
  },
  'POST /uploads': {
    action: 'create',
    resourceType: 'file',
  },
  'POST /uploads/:id/complete': {
    action: 'complete',
    resourceType: 'file',
  },
  'GET /uploads/:id': {
    action: 'read',
    resourceType: 'file',
  },
  'GET /:id/download': {
    action: 'read',
    resourceType: 'file',
  },
  'DELETE /:id': {
    action: 'delete',
    resourceType: 'file',
  },
} satisfies RouteAuditPolicies;
