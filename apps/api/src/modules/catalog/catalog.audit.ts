import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /admin/products': {
    action: 'read',
    resourceType: 'product',
  },
  'GET /admin/products/:id': {
    action: 'read',
    resourceType: 'product',
  },
  'GET /products/by-slug/:slug': {
    action: 'read',
    resourceType: 'product',
  },
  'PATCH /products/:id/publication': {
    action: 'update',
    resourceType: 'product',
  },
  'GET /products/:id/variants': {
    action: 'read',
    resourceType: 'variant',
  },
  'GET /admin/products/:id/variants': {
    action: 'read',
    resourceType: 'variant',
  },
  'GET /admin/variants': {
    action: 'read',
    resourceType: 'variant',
  },
  'POST /products/:id/variants': {
    action: 'create',
    resourceType: 'variant',
  },
  'PATCH /products/:id/variants/:variantId': {
    action: 'update',
    resourceType: 'variant',
  },
  'PATCH /products/:id/variants/:variantId/images': {
    action: 'update',
    resourceType: 'variant',
  },
  'GET /admin/size-guides': {
    action: 'read',
    resourceType: 'size_guide',
  },
  'GET /admin/size-guides/:id': {
    action: 'read',
    resourceType: 'size_guide',
  },
  'POST /admin/size-guides': {
    action: 'create',
    resourceType: 'size_guide',
  },
  'PATCH /admin/size-guides/:id': {
    action: 'update',
    resourceType: 'size_guide',
  },
} satisfies RouteAuditPolicies;
