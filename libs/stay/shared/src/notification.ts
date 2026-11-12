/**
 * Notification events (in-app, email, browser push). Each event belongs to one group that a
 * person can mute for the email and browser channels; the in-app list always shows it.
 */
export const NOTIFICATION_GROUPS = [
  'payments',
  'invoices',
  'reminders',
  'requests',
  'announcements',
] as const;

export type NotificationGroup = (typeof NOTIFICATION_GROUPS)[number];

export const NOTIFICATION_KINDS = [
  // Staff (owner and managers of the building)
  'payment_claim.created',
  'maintenance.created',
  'tenant_request.created',
  'reading.reminder',
  'drafts.ready',
  'reminder.unreachable',
  'automation',
  // Tenant (occupants of one contract, or one occupant)
  'payment.recorded',
  'payment_claim.rejected',
  'invoice.issued',
  'invoice.due_soon',
  'invoice.overdue',
  'request.updated',
  'announcement.created',
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_KIND_GROUPS: Record<NotificationKind, NotificationGroup> = {
  'payment_claim.created': 'payments',
  'maintenance.created': 'requests',
  'tenant_request.created': 'requests',
  'reading.reminder': 'reminders',
  'drafts.ready': 'reminders',
  'reminder.unreachable': 'reminders',
  automation: 'reminders',
  'payment.recorded': 'payments',
  'payment_claim.rejected': 'payments',
  'invoice.issued': 'invoices',
  'invoice.due_soon': 'reminders',
  'invoice.overdue': 'reminders',
  'request.updated': 'requests',
  'announcement.created': 'announcements',
};

/** Groups that only reach staff or only reach tenants (the settings show the relevant ones). */
export const STAFF_NOTIFICATION_GROUPS: readonly NotificationGroup[] = [
  'payments',
  'requests',
  'reminders',
];
export const TENANT_NOTIFICATION_GROUPS: readonly NotificationGroup[] = [
  'payments',
  'invoices',
  'reminders',
  'requests',
  'announcements',
];

/**
 * Email and browser channels plus muted groups. Defaults: everything on. In-app notifications
 * are always recorded.
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  mutedGroups: NotificationGroup[];
}

/** Preferences with what the server can deliver (`emailAvailable`: SMTP configured). */
export interface NotificationSettings extends NotificationPreferences {
  emailAvailable: boolean;
  /** Whether the person has an email address on file. */
  hasEmail: boolean;
  /** VAPID public key (base64url) when browser push is configured, else null. */
  pushPublicKey: string | null;
  /** Browser subscriptions registered for this person. */
  pushSubscriptions: number;
}

/** `PushSubscription.toJSON()` of the browser. */
export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushSubscriptionResult {
  endpoint: string;
  subscribed: boolean;
}

/** Tenant portal in-app notification (own contract only). */
export interface PortalNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Portal path, e.g. `/p/invoices/{id}`. */
  path: string;
  createdAt: string;
  readAt: string | null;
}

export interface PortalNotifications {
  items: PortalNotification[];
  unreadCount: number;
}

/** Server-Sent Events: `event: notification` carries this (no personal data beyond the text). */
export interface NotificationStreamEvent {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  path: string;
  createdAt: string;
}
