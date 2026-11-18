import type { RouteAuditPolicies } from '@p4/server-core';

/**
 * ST-30 staff routes. Audit facts hold ids, statuses and counts only: never the document body,
 * CCCD, signatures or passwords.
 */
export const documentAuditPolicies = {
  'GET /settings/landlord': { action: 'read', resourceType: 'landlord_profile' },
  'PUT /settings/landlord': { action: 'update', resourceType: 'landlord_profile' },
  'GET /contract-template-variables': { action: 'read', resourceType: 'contract_template' },
  'GET /contract-templates': { action: 'read', resourceType: 'contract_template' },
  'POST /contract-templates': { action: 'create', resourceType: 'contract_template' },
  'POST /contract-templates/import-docx': { action: 'read', resourceType: 'contract_template' },
  'GET /contract-templates/:id': { action: 'read', resourceType: 'contract_template' },
  'PUT /contract-templates/:id': { action: 'update', resourceType: 'contract_template' },
  'POST /contract-templates/:id/versions': { action: 'update', resourceType: 'contract_template' },
  'POST /contract-templates/:id/preview': { action: 'read', resourceType: 'contract_template' },
  'GET /contract-template-versions/:id': { action: 'read', resourceType: 'contract_template' },
  'GET /contracts/:id/documents': { action: 'read', resourceType: 'contract_document' },
  'POST /contracts/:id/documents': { action: 'create', resourceType: 'contract_document' },
  'GET /documents/:id': { action: 'read', resourceType: 'contract_document' },
  'PUT /documents/:id': { action: 'update', resourceType: 'contract_document' },
  'POST /documents/:id/send': { action: 'submit', resourceType: 'contract_document' },
  'POST /documents/:id/owner-sign': { action: 'confirm', resourceType: 'contract_document' },
  'POST /documents/:id/cancel': { action: 'cancel', resourceType: 'contract_document' },
  'POST /documents/:id/paper': { action: 'complete', resourceType: 'contract_document' },
  'POST /documents/:id/supersede': { action: 'create', resourceType: 'contract_document' },
  'GET /documents/:id/pdf': { action: 'read', resourceType: 'contract_document' },
  'GET /documents/:id/scan': { action: 'read', resourceType: 'contract_document' },
} satisfies RouteAuditPolicies;

/** Tenant portal and public verification routes. */
export const documentPortalAuditPolicies = {
  'GET /portal/documents': { action: 'read', resourceType: 'tenant_portal' },
  'GET /portal/documents/:id': { action: 'read', resourceType: 'tenant_portal' },
  'POST /portal/documents/:id/sign': { action: 'confirm', resourceType: 'contract_document' },
  'POST /portal/documents/:id/reject': { action: 'reject', resourceType: 'contract_document' },
  'GET /portal/documents/:id/pdf': { action: 'read', resourceType: 'tenant_portal' },
  'GET /public/documents/verify/:code': { action: 'read', resourceType: 'document_verification' },
  'POST /public/documents/verify/:code': { action: 'read', resourceType: 'document_verification' },
} satisfies RouteAuditPolicies;
