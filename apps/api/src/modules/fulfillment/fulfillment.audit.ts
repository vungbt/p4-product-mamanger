import type { RouteAuditPolicies } from '@/shared/audit/types.js';

export const auditPolicies = {
  'POST /orders/:id/shipments': {
    action: 'create',
    resourceType: 'shipment',
  },
  'GET /orders/:id/shipments': {
    action: 'read',
    resourceType: 'shipment',
  },
  'POST /shipments/:id/pack': {
    action: 'pack',
    resourceType: 'shipment',
  },
  'POST /shipments/:id/ready': {
    action: 'ready',
    resourceType: 'shipment',
  },
  'POST /shipments/:id/handover': {
    action: 'handover',
    resourceType: 'shipment',
  },
  'POST /shipments/:id/out-for-delivery': {
    action: 'dispatch',
    resourceType: 'shipment',
  },
  'POST /shipments/:id/deliver': {
    action: 'deliver',
    resourceType: 'shipment',
  },
  'POST /shipments/:id/fail': {
    action: 'fail',
    resourceType: 'shipment',
  },
  'POST /shipments/:id/return': {
    action: 'return',
    resourceType: 'shipment',
  },
  'POST /shipments/:id/lose': {
    action: 'lose',
    resourceType: 'shipment',
  },
  'POST /shipments/:id/cancel': {
    action: 'cancel',
    resourceType: 'shipment',
  },
  'GET /shipments/:id/events': {
    action: 'read',
    resourceType: 'shipment',
  },
} satisfies RouteAuditPolicies;
