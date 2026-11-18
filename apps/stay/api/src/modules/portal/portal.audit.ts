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
  // Part B tenant writes: rows with `actorId: null` and the link/tenant ids (no free text).
  'POST /portal/invoices/:id/payment-claims': { action: 'create', resourceType: 'payment_claim' },
  'POST /portal/payment-claims/:id/cancel': { action: 'cancel', resourceType: 'payment_claim' },
  'GET /portal/maintenance': { action: 'read', resourceType: 'tenant_portal' },
  'POST /portal/maintenance': { action: 'create', resourceType: 'maintenance_request' },
  'POST /portal/maintenance/:id/cancel': { action: 'cancel', resourceType: 'maintenance_request' },
  'GET /portal/requests': { action: 'read', resourceType: 'tenant_portal' },
  'POST /portal/requests': { action: 'create', resourceType: 'tenant_request' },
  'POST /portal/requests/:id/cancel': { action: 'cancel', resourceType: 'tenant_request' },
  'POST /portal/uploads': { action: 'create', resourceType: 'upload' },
  'POST /portal/uploads/:id/complete': { action: 'complete', resourceType: 'upload' },
} satisfies RouteAuditPolicies;
