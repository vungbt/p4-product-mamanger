import type {
  ContentStatus,
  ExchangeStatus,
  FulfillmentStatus,
  JobStatus,
  OrderLifecycleStatus,
  PaymentAttemptStatus,
  Permission,
  ProductPublicationStatus,
  RefundAttemptStatus,
  ReturnStatus,
} from '@p4/shared';

export const CONTRACT_VERSION = '2026-11-05.1';
export const PERMISSIONS: readonly Permission[] = [
  'system:read',
  'system:manage',
  'staff:read',
  'staff:manage',
  'customer:read',
  'customer:manage',
  'audit:read',
  'catalog:read',
  'catalog:write',
  'inventory:read',
  'inventory:write',
  'settings:manage',
  'promotion:read',
  'promotion:write',
  'order:read',
  'order:manage',
  'payment:read',
  'payment:manage',
  'fulfillment:read',
  'fulfillment:manage',
  'return:read',
  'return:manage',
  'refund:read',
  'refund:manage',
  'review:read',
  'review:moderate',
  'review:reply',
  'content:read',
  'content:write',
  'content:publish',
  'support:read',
  'support:manage',
  'notification:read',
  'notification:manage',
  'report:read',
  'report:export',
];

export interface LifecycleStates {
  order: OrderLifecycleStatus;
  payment: PaymentAttemptStatus;
  shipment: FulfillmentStatus;
  return: ReturnStatus;
  refund: RefundAttemptStatus;
  exchange: ExchangeStatus;
  product: ProductPublicationStatus;
  content: ContentStatus;
  job: JobStatus;
}

type Transitions = {
  [Kind in keyof LifecycleStates]: Record<LifecycleStates[Kind], readonly LifecycleStates[Kind][]>;
};

export const TRANSITIONS: Transitions = {
  order: {
    pending_confirmation: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['completed'],
    completed: [],
    cancelled: [],
  },
  payment: {
    pending: ['processing', 'expired', 'cancelled'],
    processing: ['paid', 'failed', 'expired', 'cancelled'],
    paid: [],
    failed: [],
    expired: [],
    cancelled: [],
  },
  shipment: {
    pending_pack: ['packed', 'cancelled'],
    packed: ['ready_for_pickup', 'cancelled'],
    ready_for_pickup: ['in_transit', 'cancelled'],
    in_transit: ['out_for_delivery', 'returned', 'lost'],
    out_for_delivery: ['delivered', 'delivery_failed'],
    delivery_failed: ['out_for_delivery', 'returned', 'lost'],
    delivered: [],
    returned: [],
    lost: [],
    cancelled: [],
  },
  return: {
    requested: ['approved', 'rejected', 'cancelled'],
    approved: ['in_transit', 'cancelled'],
    in_transit: ['received'],
    received: ['inspected'],
    inspected: ['completed'],
    completed: [],
    rejected: [],
    cancelled: [],
  },
  refund: {
    requested: ['processing', 'cancelled'],
    processing: ['succeeded', 'failed'],
    succeeded: [],
    failed: [],
    cancelled: [],
  },
  exchange: {
    requested: ['approved', 'rejected', 'cancelled'],
    approved: ['awaiting_return'],
    awaiting_return: ['return_received'],
    return_received: ['replacement_processing'],
    replacement_processing: ['completed'],
    completed: [],
    rejected: [],
    cancelled: [],
  },
  product: {
    draft: ['active', 'archived'],
    active: ['inactive', 'archived'],
    inactive: ['active', 'archived'],
    archived: [],
  },
  content: {
    draft: ['scheduled', 'published', 'archived'],
    scheduled: ['draft', 'published', 'archived'],
    published: ['archived'],
    archived: ['draft'],
  },
  job: {
    queued: ['running', 'cancelled'],
    running: ['succeeded', 'failed', 'dead_letter'],
    succeeded: [],
    failed: ['queued', 'dead_letter'],
    dead_letter: ['queued'],
    cancelled: [],
  },
};

export const COMMERCE_POLICY = {
  currency: 'VND',
  moneyUnit: 'currency_unit',
  timezone: 'UTC',
  quoteTtlSeconds: 600,
  reservationTtlSeconds: 1800,
  returnWindowDays: 7,
  idempotencyTtlHours: 24,
  maxPageSize: 100,
};
