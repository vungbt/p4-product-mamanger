import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'POST /auth/register': {
    action: 'create',
    resourceType: 'user',
  },
  'POST /auth/email-verification-requests': {
    action: 'request_verification',
    resourceType: 'user',
  },
  'POST /auth/password-reset-requests': {
    action: 'request_password_reset',
    resourceType: 'user',
  },
  'POST /auth/email-verifications': {
    action: 'verify',
    resourceType: 'user',
  },
  'POST /auth/password-resets': {
    action: 'reset_password',
    resourceType: 'user',
  },
  'GET /me/profile': {
    action: 'read',
    resourceType: 'user',
  },
  'PATCH /me/profile': {
    action: 'update',
    resourceType: 'user',
  },
  'GET /me/preferences': {
    action: 'read',
    resourceType: 'user',
  },
  'PATCH /me/preferences': {
    action: 'update',
    resourceType: 'user',
  },
  'POST /me/email-change-requests': {
    action: 'change_email',
    resourceType: 'user',
  },
  'POST /me/email-changes/confirm': {
    action: 'confirm',
    resourceType: 'user',
  },
  'GET /me/sessions': {
    action: 'read',
    resourceType: 'user',
  },
  'DELETE /me/sessions/:id': {
    action: 'revoke_session',
    resourceType: 'session',
  },
  'POST /me/sessions/revoke-others': {
    action: 'revoke_session',
    resourceType: 'user',
  },
} satisfies RouteAuditPolicies;
