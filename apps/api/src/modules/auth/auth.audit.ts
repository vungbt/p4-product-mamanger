import type { RouteAuditPolicies } from '@p4/server-core';
import * as authController from './auth.controller.js';

export const auditPolicies = {
  'POST /login': {
    auditedHandler: authController.login,
    action: 'login',
    resourceType: 'user',
  },
  'POST /google': {
    auditedHandler: authController.loginGoogle,
    action: 'login',
    resourceType: 'user',
  },
  'POST /refresh': {
    action: 'read',
    resourceType: 'user',
  },
  'GET /me': {
    action: 'read',
    resourceType: 'user',
  },
  'PATCH /me': {
    auditedHandler: authController.updateMe,
    action: 'update',
    resourceType: 'user',
  },
  'PATCH /password': {
    auditedHandler: authController.updatePassword,
    action: 'change_password',
    resourceType: 'user',
  },
  'POST /logout': {
    auditedHandler: authController.logout,
    action: 'logout',
    resourceType: 'user',
  },
} satisfies RouteAuditPolicies;
