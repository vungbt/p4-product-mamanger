import type { AbilityAction, AbilitySubject } from '@p4/shared';

/**
 * Actions checked by CASL.
 *
 * The ability is created with `anyAction: '*'`, so `manage` is an ordinary
 * action (state transitions and operations) rather than CASL's wildcard.
 */
export const ABILITY_ACTIONS = [
  'read',
  'write',
  'manage',
  'publish',
  'moderate',
  'reply',
  'export',
] as const satisfies readonly AbilityAction[];

export const ANY_ACTION = '*';
export const ANY_SUBJECT = 'all';

/** Business areas protected by CASL. Customer-owned subjects carry a `userId`. */
export const ABILITY_SUBJECTS = [
  'System',
  'Staff',
  'Customer',
  'AuditLog',
  'Catalog',
  'Inventory',
  'Settings',
  'Promotion',
  'Order',
  'Payment',
  'Fulfillment',
  'Return',
  'Refund',
  'Review',
  'Content',
  'Support',
  'Notification',
  'Report',
] as const satisfies readonly AbilitySubject[];
