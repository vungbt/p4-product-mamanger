import type { RouteAuditPolicies } from '@p4/server-core';

export const auditPolicies = {
  'GET /buildings': {
    action: 'read',
    resourceType: 'building',
  },
  'POST /buildings': {
    action: 'create',
    resourceType: 'building',
  },
  'GET /buildings/:id': {
    action: 'read',
    resourceType: 'building',
  },
  'PUT /buildings/:id': {
    action: 'update',
    resourceType: 'building',
  },
  'POST /buildings/:id/archive': {
    action: 'archive',
    resourceType: 'building',
  },
  'GET /buildings/:id/prices': {
    action: 'read',
    resourceType: 'building_price',
  },
  'PUT /buildings/:id/prices': {
    action: 'update',
    resourceType: 'building_price',
  },
} satisfies RouteAuditPolicies;
