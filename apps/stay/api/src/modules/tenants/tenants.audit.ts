import type { RouteAuditPolicies } from '@p4/server-core';

// Tenant audit rows never hold personal values: see `auditFacts` in tenants.service.ts.
export const auditPolicies = {
  'POST /tenants/:id/credentials': { action: 'reset_password', resourceType: 'tenant' },
  'POST /tenants/:id/credentials/email': { action: 'update', resourceType: 'tenant' },
  'GET /tenants': {
    action: 'read',
    resourceType: 'tenant',
  },
  'POST /tenants': {
    action: 'create',
    resourceType: 'tenant',
  },
  'GET /tenants/import/template': {
    action: 'read',
    resourceType: 'tenant_import',
  },
  'POST /tenants/import/preview': {
    action: 'read',
    resourceType: 'tenant_import',
  },
  'POST /tenants/import': {
    action: 'import',
    resourceType: 'tenant',
  },
  'GET /tenants/:id': {
    action: 'read',
    resourceType: 'tenant',
  },
  'PUT /tenants/:id': {
    action: 'update',
    resourceType: 'tenant',
  },
  'POST /tenants/:id/reveal-id': {
    action: 'inspect',
    resourceType: 'tenant',
  },
  'POST /tenants/:id/archive': {
    action: 'archive',
    resourceType: 'tenant',
  },
  'POST /tenants/:id/documents': {
    action: 'create',
    resourceType: 'tenant_document',
  },
  'POST /tenants/:id/vehicles': {
    action: 'create',
    resourceType: 'vehicle',
  },
  'PUT /tenants/:id/vehicles/:vehicleId': {
    action: 'update',
    resourceType: 'vehicle',
  },
  'DELETE /tenants/:id/vehicles/:vehicleId': {
    action: 'delete',
    resourceType: 'vehicle',
  },
} satisfies RouteAuditPolicies;
