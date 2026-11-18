import { randomUUID } from 'node:crypto';
import { NotFound, setAuditChanges } from '@p4/server-core';
import {
  NOTIFICATION_GROUPS,
  type NotificationGroup,
  type NotificationPreferences,
  type NotificationSettings,
  type PortalNotifications,
  type PushSubscriptionInput,
  type PushSubscriptionResult,
  type StayUser,
} from '@stay/shared';
import { QueryTypes, type Transaction } from 'sequelize';
import { emailEnabled, env, pushEnabled } from '@/configs/env.js';
import { sequelize } from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit.js';
import type { PortalPrincipal } from '@/types/express.js';

/** A staff account or a tenant (portal): preferences belong to the person, not the device. */
export type Principal = { userId: string } | { tenantId: string };

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  push: true,
  mutedGroups: [],
};

const principalColumn = (principal: Principal) =>
  'userId' in principal
    ? { column: 'user_id', id: principal.userId }
    : { column: 'tenant_id', id: principal.tenantId };

const isGroup = (value: string): value is NotificationGroup =>
  NOTIFICATION_GROUPS.some((group) => group === value);

export async function preferencesOf(
  principal: Principal,
  transaction?: Transaction,
): Promise<NotificationPreferences> {
  const { column, id } = principalColumn(principal);
  const [row] = await sequelize.query<{ email: boolean; push: boolean; mutedGroups: string[] }>(
    `SELECT email,push,muted_groups AS "mutedGroups" FROM notification_preferences WHERE ${column}=:id`,
    { replacements: { id }, transaction, type: QueryTypes.SELECT },
  );

  if (!row) return { ...DEFAULT_PREFERENCES, mutedGroups: [] };
  return { email: row.email, push: row.push, mutedGroups: row.mutedGroups.filter(isGroup) };
}

/** Whether `channel` may deliver a notification of `group` to this person. */
export function channelAllowed(
  preferences: NotificationPreferences,
  channel: 'email' | 'push',
  group: NotificationGroup,
): boolean {
  return preferences[channel] && !preferences.mutedGroups.includes(group);
}

async function settingsOf(principal: Principal, transaction?: Transaction) {
  const { column, id } = principalColumn(principal);
  const preferences = await preferencesOf(principal, transaction);
  const [email] = await sequelize.query<{ email: string | null }>(
    'userId' in principal
      ? 'SELECT email FROM users WHERE id=:id'
      : 'SELECT email FROM tenants WHERE id=:id',
    { replacements: { id }, transaction, type: QueryTypes.SELECT },
  );
  const [subscriptions] = await sequelize.query<{ count: number }>(
    column === 'user_id'
      ? 'SELECT count(*)::integer AS count FROM push_subscriptions WHERE user_id=:id'
      : `SELECT count(*)::integer AS count FROM push_subscriptions s
        JOIN tenant_portal_links l ON l.id=s.portal_link_id WHERE l.tenant_id=:id AND l.revoked_at IS NULL`,
    { replacements: { id }, transaction, type: QueryTypes.SELECT },
  );

  return {
    ...preferences,
    emailAvailable: emailEnabled(),
    hasEmail: Boolean(email?.email),
    pushPublicKey: pushEnabled() ? env.webPush.publicKey : null,
    pushSubscriptions: subscriptions?.count ?? 0,
  } satisfies NotificationSettings;
}

export const staffNotificationSettings = (user: StayUser) => settingsOf({ userId: user.id });

export const portalNotificationSettings = (portal: PortalPrincipal) =>
  settingsOf({ tenantId: portal.tenantId });

async function savePreferences(
  principal: Principal,
  input: NotificationPreferences,
): Promise<NotificationSettings> {
  return auditedTransaction(async (transaction) => {
    const { column, id } = principalColumn(principal);
    const before = await preferencesOf(principal, transaction);
    const mutedGroups = [...new Set(input.mutedGroups)].sort();

    await sequelize.query(
      `INSERT INTO notification_preferences(id,${column},email,push,muted_groups)
      VALUES (:rowId,:id,:email,:push,CAST(:groups AS text[]))
      ON CONFLICT (${column}) DO UPDATE SET email=EXCLUDED.email,push=EXCLUDED.push,
      muted_groups=EXCLUDED.muted_groups,updated_at=now()`,
      {
        replacements: {
          rowId: randomUUID(),
          id,
          email: input.email,
          push: input.push,
          // Array literal of validated group names (`NOTIFICATION_GROUPS`).
          groups: `{${mutedGroups.join(',')}}`,
        },
        transaction,
      },
    );
    setAuditChanges({
      before: { ...before },
      after: { email: input.email, push: input.push, mutedGroups },
    });
    return settingsOf(principal, transaction);
  });
}

export const updateStaffPreferences = (user: StayUser, input: NotificationPreferences) =>
  savePreferences({ userId: user.id }, input);

export const updatePortalPreferences = (portal: PortalPrincipal, input: NotificationPreferences) =>
  savePreferences({ tenantId: portal.tenantId }, input);

/* -------------------------------------------------------------------------- */
/* Push subscriptions                                                          */
/* -------------------------------------------------------------------------- */

type Owner = { userId: string } | { portalLinkId: string };

/**
 * Registers the browser's endpoint for this person (idempotent). One browser profile has one
 * endpoint per site: signing in as someone else on the same browser moves it to that person.
 */
async function subscribe(
  owner: Owner,
  input: PushSubscriptionInput,
  userAgent: string | undefined,
): Promise<PushSubscriptionResult> {
  return auditedTransaction(async (transaction) => {
    const userId = 'userId' in owner ? owner.userId : null;
    const portalLinkId = 'portalLinkId' in owner ? owner.portalLinkId : null;
    const [row] = await sequelize.query<{ id: string }>(
      `INSERT INTO push_subscriptions(id,user_id,portal_link_id,endpoint,p256dh,auth,user_agent)
      VALUES (:id,:userId,:portalLinkId,:endpoint,:p256dh,:auth,:userAgent)
      ON CONFLICT (endpoint) DO UPDATE SET user_id=EXCLUDED.user_id,
      portal_link_id=EXCLUDED.portal_link_id,p256dh=EXCLUDED.p256dh,auth=EXCLUDED.auth,
      user_agent=EXCLUDED.user_agent,failures=0,updated_at=now() RETURNING id`,
      {
        replacements: {
          id: randomUUID(),
          userId,
          portalLinkId,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          userAgent: userAgent?.slice(0, 255) ?? null,
        },
        transaction,
        type: QueryTypes.SELECT,
      },
    );

    // Never the endpoint or the keys: they address the device.
    setAuditChanges({ subscriptionId: row?.id ?? null, userId, portalLinkId });
    return { endpoint: input.endpoint, subscribed: true };
  });
}

/** Removes the endpoint only when it belongs to this person (unknown endpoint: no-op). */
async function unsubscribe(owner: Owner, endpoint: string): Promise<PushSubscriptionResult> {
  return auditedTransaction(async (transaction) => {
    const [column, id] =
      'userId' in owner ? ['user_id', owner.userId] : ['portal_link_id', owner.portalLinkId];
    const removed = await sequelize.query<{ id: string }>(
      `DELETE FROM push_subscriptions WHERE endpoint=:endpoint AND ${column}=:id RETURNING id`,
      { replacements: { endpoint, id }, transaction, type: QueryTypes.SELECT },
    );

    setAuditChanges({ subscriptionId: removed[0]?.id ?? null, removed: removed.length > 0 });
    return { endpoint, subscribed: false };
  });
}

export const subscribeStaffPush = (user: StayUser, input: PushSubscriptionInput, ua?: string) =>
  subscribe({ userId: user.id }, input, ua);

export const unsubscribeStaffPush = (user: StayUser, endpoint: string) =>
  unsubscribe({ userId: user.id }, endpoint);

export const subscribePortalPush = (
  portal: PortalPrincipal,
  input: PushSubscriptionInput,
  ua?: string,
) => subscribe({ portalLinkId: portal.linkId }, input, ua);

export const unsubscribePortalPush = (portal: PortalPrincipal, endpoint: string) =>
  unsubscribe({ portalLinkId: portal.linkId }, endpoint);

/* -------------------------------------------------------------------------- */
/* Tenant in-app list                                                          */
/* -------------------------------------------------------------------------- */

/** Tenant notifications of the session's contract (whole contract or this occupant). */
const PORTAL_SCOPE = `n.audience='tenant' AND n.contract_id=:contractId
  AND (n.tenant_id IS NULL OR n.tenant_id=:tenantId)`;

export async function listPortalNotifications(
  portal: PortalPrincipal,
): Promise<PortalNotifications> {
  const replacements = { contractId: portal.contractId, tenantId: portal.tenantId };
  const items = await sequelize.query<PortalNotifications['items'][number]>(
    `SELECT n.id,n.kind,n.title,n.body,n.path,
    to_char(n.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
    to_char(r.read_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "readAt"
    FROM notifications n
    LEFT JOIN notification_tenant_reads r ON r.notification_id=n.id AND r.tenant_id=:tenantId
    WHERE ${PORTAL_SCOPE} ORDER BY n.created_at DESC,n.id DESC LIMIT 50`,
    { replacements, type: QueryTypes.SELECT },
  );
  const [count] = await sequelize.query<{ count: number }>(
    `SELECT count(*)::integer AS count FROM notifications n WHERE ${PORTAL_SCOPE}
    AND NOT EXISTS(SELECT 1 FROM notification_tenant_reads r WHERE r.notification_id=n.id AND r.tenant_id=:tenantId)`,
    { replacements, type: QueryTypes.SELECT },
  );

  return { items, unreadCount: count?.count ?? 0 };
}

/** Marks one notification of the session's contract read (another contract → 404). */
export async function markPortalNotificationRead(
  portal: PortalPrincipal,
  id: string,
): Promise<{ id: string }> {
  return auditedTransaction(async (transaction) => {
    const found = await sequelize.query<{ id: string }>(
      `SELECT n.id FROM notifications n WHERE n.id=:id AND ${PORTAL_SCOPE}`,
      {
        replacements: { id, contractId: portal.contractId, tenantId: portal.tenantId },
        transaction,
        type: QueryTypes.SELECT,
      },
    );

    if (!found.length) throw new NotFound('notification_not_found');
    await sequelize.query(
      `INSERT INTO notification_tenant_reads(notification_id,tenant_id) VALUES (:id,:tenantId)
      ON CONFLICT DO NOTHING`,
      { replacements: { id, tenantId: portal.tenantId }, transaction },
    );
    setAuditChanges({
      notificationId: id,
      contractId: portal.contractId,
      tenantId: portal.tenantId,
    });
    return { id };
  });
}
