import type { RouteAuditPolicies } from '@p4/server-core';

// Bulk creation and the maintenance switch record their own rows (`room.bulk_create`,
// `room.maintenance_on` / `room.maintenance_off`).
export const auditPolicies = {
  'GET /buildings/:buildingId/rooms': {
    action: 'read',
    resourceType: 'room',
  },
  'GET /buildings/:buildingId/rooms/summary': {
    action: 'read',
    resourceType: 'room',
  },
  'POST /buildings/:buildingId/rooms': {
    action: 'create',
    resourceType: 'room',
  },
  'POST /buildings/:buildingId/rooms/bulk/preview': {
    action: 'read',
    resourceType: 'room',
  },
  'POST /buildings/:buildingId/rooms/bulk': {
    action: 'create',
    resourceType: 'room',
  },
  'GET /rooms/:id': {
    action: 'read',
    resourceType: 'room',
  },
  'PUT /rooms/:id': {
    action: 'update',
    resourceType: 'room',
  },
  'POST /rooms/:id/maintenance': {
    action: 'update',
    resourceType: 'room',
  },
  'POST /rooms/:id/archive': {
    action: 'archive',
    resourceType: 'room',
  },
} satisfies RouteAuditPolicies;
