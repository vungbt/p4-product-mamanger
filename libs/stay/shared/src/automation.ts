import type { NotificationKind } from './notification.js';

/** Upper bound of `readingReminderDaysBefore`. */
export const READING_REMINDER_DAYS_MAX = 10;

/** Automations are opt-in for each building. 409 on a stale version. */
export interface StayAutomationSettings {
  /** Owner reminder on the reading day, sent only while rooms still lack readings. */
  readingReminder: boolean;
  /** Owner reminder `readingReminderDaysBefore` days before the reading day. */
  readingReminderBefore: boolean;
  /** 0–10, default 1; 0 turns the early reminder off. */
  readingReminderDaysBefore: number;
  createDrafts: boolean;
  beforeDue: boolean;
  afterDue: boolean;
  tenantRemindersDisabled: boolean;
  version: number;
}

export interface StayNotification {
  id: string;
  buildingId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  path: string;
  createdAt: string;
  readAt: string | null;
}

export interface StayNotifications {
  items: StayNotification[];
  unreadCount: number;
}
