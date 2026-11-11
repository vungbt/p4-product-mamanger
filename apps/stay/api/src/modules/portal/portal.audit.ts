import type { RouteAuditPolicies } from '@p4/server-core';

/** Staff routes: link writes record `tenant_portal_link.*` rows (ids only, never the token). */
export const linkAuditPolicies = {
  'GET /contracts/:id/portal-links': { action: 'read', resourceType: 'tenant_portal_link' },
  'POST /contracts/:id/portal-links': { action: 'create', resourceType: 'tenant_portal_link' },
  'DELETE /portal-links/:id': { action: 'delete', resourceType: 'tenant_portal_link' },
} satisfies RouteAuditPolicies;

/**
 * Tenant portal routes. Reads never call `setAuditChanges`; sign-in/out record
 * `tenant_portal.session_*` rows (ids only), a wrong attempt `tenant_portal.verification_failed`.
 */
export const portalAuditPolicies = {
  'POST /portal/links/lookup': { action: 'read', resourceType: 'tenant_portal_link' },
  'POST /portal/sessions': { action: 'login', resourceType: 'tenant_portal_session' },
  'DELETE /portal/sessions': { action: 'logout', resourceType: 'tenant_portal_session' },
  'GET /portal/me': { action: 'read', resourceType: 'tenant_portal' },
  'GET /portal/invoices': { action: 'read', resourceType: 'tenant_portal' },
  'GET /portal/invoices/:id': { action: 'read', resourceType: 'tenant_portal' },
  'GET /portal/contract': { action: 'read', resourceType: 'tenant_portal' },
  'GET /portal/usage': { action: 'read', resourceType: 'tenant_portal' },
  'GET /portal/notices': { action: 'read', resourceType: 'tenant_portal' },
} satisfies RouteAuditPolicies;
