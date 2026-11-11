/** Automations are opt-in for each building. 409 on a stale version. */
export interface StayAutomationSettings {
  readingReminder: boolean;
  createDrafts: boolean;
  beforeDue: boolean;
  afterDue: boolean;
  tenantRemindersDisabled: boolean;
  version: number;
}

export interface StayNotification {
  id: string;
  buildingId: string;
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
