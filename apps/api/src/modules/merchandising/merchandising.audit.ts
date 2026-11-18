import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /admin/collections': {
    action: 'read',
    resourceType: 'collection',
  },
  'GET /admin/collections/:id': {
    action: 'read',
    resourceType: 'collection',
  },
  'POST /admin/collections': {
    action: 'create',
    resourceType: 'collection',
  },
  'PATCH /admin/collections/:id': {
    action: 'update',
    resourceType: 'collection',
  },
  'GET /admin/banners': {
    action: 'read',
    resourceType: 'banner',
  },
  'GET /admin/banners/:id': {
    action: 'read',
    resourceType: 'banner',
  },
  'POST /admin/banners': {
    action: 'create',
    resourceType: 'banner',
  },
  'PATCH /admin/banners/:id': {
    action: 'update',
    resourceType: 'banner',
  },
  'GET /collections': {
    action: 'read',
    resourceType: 'collection',
  },
  'GET /collections/:slug': {
    action: 'read',
    resourceType: 'collection',
  },
  'GET /admin/navigation/:placement': {
    action: 'read',
    resourceType: 'navigation',
  },
  'PATCH /admin/navigation/:placement': {
    action: 'update',
    resourceType: 'navigation',
  },
  'GET /admin/home-layout': {
    action: 'read',
    resourceType: 'home',
  },
  'PATCH /admin/home-layout': {
    action: 'update',
    resourceType: 'home',
  },
  'GET /navigation/:placement': {
    action: 'read',
    resourceType: 'navigation',
  },
  'GET /storefront/home': {
    action: 'read',
    resourceType: 'merchandising',
  },
} satisfies RouteAuditPolicies;
