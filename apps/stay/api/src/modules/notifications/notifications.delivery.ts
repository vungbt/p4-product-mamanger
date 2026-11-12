/**
 * Worker side of notifications: drains the `domain_events` outbox after commit.
 *
 * 1. `stay.notification.dispatch` (one per notification) resolves the recipients, checks their
 *    preferences and queues one `stay.notification.email` per address and one
 *    `stay.notification.push` per browser subscription (deduplicated, same transaction).
 * 2. Email/push events re-check preferences, access and the delivery guard, then call the
 *    transport. Failures retry with backoff; permanent failures and the 5th failure dead-letter.
 */
import { randomUUID } from 'node:crypto';
import { logger } from '@p4/server-core';
import type { JsonValue } from '@p4/shared';
import { NOTIFICATION_KIND_GROUPS, type NotificationKind } from '@stay/shared';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import { DomainEventModel, InvoiceModel, sequelize } from '@/sequelize/models/index.js';
import { automationRunAllowed } from '../automation/automation.jobs.js';
import { webOrigin } from '../invoices/invoices.share.js';
import { contractContext, portalOpen } from '../portal/portal.access.js';
import { invoiceEmailExtras } from './notifications.invoice-email.js';
import { type DeliveryGuard, DISPATCH_EVENT, primaryOccupant } from './notifications.publish.js';
import { channelAllowed, type Principal, preferencesOf } from './notifications.service.js';
import { renderEmail } from './notifications.templates.js';
import {
  configuredTransports,
  DeliveryError,
  type NotificationTransports,
} from './notifications.transports.js';

export const EMAIL_EVENT = 'stay.notification.email';
export const PUSH_EVENT = 'stay.notification.push';
const EVENT_TYPES = [DISPATCH_EVENT, EMAIL_EVENT, PUSH_EVENT];
export const MAX_DELIVERY_ATTEMPTS = 5;
/** Delay before attempt n + 1 (after the n-th failure). */
const BACKOFF_MS = [30_000, 2 * 60_000, 10 * 60_000, 30 * 60_000];
const LEASE_MS = 90_000;

interface StoredNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  path: string;
  audience: 'staff' | 'tenant';
  buildingId: string;
  buildingName: string;
  contractId: string | null;
  tenantId: string | null;
}

/** Delivery skipped on purpose (opt-out, guard, recipient gone): the event is done. */
type Outcome = 'sent' | 'skipped';

/* -------------------------------------------------------------------------- */
/* Payload helpers                                                             */
/* -------------------------------------------------------------------------- */

function objectOf(value: JsonValue | undefined): Record<string, JsonValue> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function stringOf(payload: Record<string, JsonValue>, key: string): string | undefined {
  const value = payload[key];

  return typeof value === 'string' ? value : undefined;
}

function guardOf(payload: Record<string, JsonValue>): DeliveryGuard {
  const guard = objectOf(payload.guard);

  return {
    automationRunId: stringOf(guard, 'automationRunId'),
    unpaidInvoiceId: stringOf(guard, 'unpaidInvoiceId'),
  };
}

async function loadNotification(
  id: string,
  transaction?: Transaction,
): Promise<StoredNotification | null> {
  const [row] = await sequelize.query<StoredNotification>(
    `SELECT n.id,n.kind,n.title,n.body,n.path,n.audience,n.building_id AS "buildingId",
    b.name AS "buildingName",n.contract_id AS "contractId",n.tenant_id AS "tenantId"
    FROM notifications n JOIN buildings b ON b.id=n.building_id WHERE n.id=:id`,
    { replacements: { id }, transaction, type: QueryTypes.SELECT },
  );

  return row ?? null;
}

const groupOf = (notification: StoredNotification) =>
  NOTIFICATION_KIND_GROUPS[notification.kind] ?? 'reminders';

/** Active owners, and active managers assigned to the building. */
async function staffRecipients(buildingId: string, transaction?: Transaction, userId?: string) {
  return sequelize.query<{ id: string; email: string }>(
    `SELECT u.id,u.email FROM users u WHERE u.account_status='active'
    AND (u.role='owner' OR (u.role='manager' AND EXISTS(
      SELECT 1 FROM building_members m WHERE m.user_id=u.id AND m.building_id=:buildingId)))
    ${userId ? 'AND u.id=:userId' : ''} ORDER BY u.id`,
    { replacements: { buildingId, userId }, transaction, type: QueryTypes.SELECT },
  );
}

/** Still worth delivering: automation switch on, invoice still unpaid. */
async function guardAllows(guard: DeliveryGuard): Promise<boolean> {
  if (guard.automationRunId && !(await automationRunAllowed(guard.automationRunId))) return false;
  if (guard.unpaidInvoiceId) {
    const invoice = await InvoiceModel.findByPk(guard.unpaidInvoiceId);

    if (
      !invoice ||
      (invoice.status !== 'issued' && invoice.status !== 'partially_paid') ||
      invoice.paidTotal >= invoice.total
    )
      return false;
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/* Dispatch                                                                    */
/* -------------------------------------------------------------------------- */

async function enqueueChild(
  type: string,
  dedupeKey: string,
  aggregateId: string,
  payload: Record<string, JsonValue>,
  now: Date,
  transaction: Transaction,
) {
  await sequelize.query(
    `INSERT INTO domain_events(id,type,aggregate_type,aggregate_id,payload,status,attempts,available_at,dedupe_key,created_at,updated_at)
    VALUES (:id,:type,'notification',:aggregateId,CAST(:payload AS jsonb),'pending',0,:now,:dedupeKey,now(),now())
    ON CONFLICT (dedupe_key) DO NOTHING`,
    {
      replacements: {
        id: randomUUID(),
        type,
        aggregateId,
        payload: JSON.stringify(payload),
        now,
        dedupeKey,
      },
      transaction,
    },
  );
}

/**
 * Queues the email/push deliveries of one notification for every reachable recipient whose
 * preferences allow the channel and the event group. Only configured channels are queued.
 */
async function dispatch(
  event: DomainEventModel,
  now: Date,
  transports: NotificationTransports,
  transaction: Transaction,
) {
  const payload = objectOf(event.payload);
  const notification = await loadNotification(
    stringOf(payload, 'notificationId') ?? '',
    transaction,
  );

  if (!notification) return;
  const group = groupOf(notification);
  const shared: Record<string, JsonValue> = {
    notificationId: notification.id,
    ...(payload.guard ? { guard: payload.guard } : {}),
    ...(typeof payload.invoiceId === 'string' ? { invoiceId: payload.invoiceId } : {}),
    ...(typeof payload.emailAmount === 'number' ? { emailAmount: payload.emailAmount } : {}),
  };
  const emailLink = stringOf(payload, 'emailLink');
  const allowed = async (principal: Principal, channel: 'email' | 'push') =>
    channelAllowed(await preferencesOf(principal, transaction), channel, group);

  if (notification.audience === 'staff') {
    for (const user of await staffRecipients(notification.buildingId, transaction)) {
      if (transports.email && user.email && (await allowed({ userId: user.id }, 'email')))
        await enqueueChild(
          EMAIL_EVENT,
          `n:${notification.id}:email:user:${user.id}`,
          notification.id,
          { ...shared, userId: user.id },
          now,
          transaction,
        );
      if (!transports.push || !(await allowed({ userId: user.id }, 'push'))) continue;
      const subscriptions = await sequelize.query<{ id: string }>(
        'SELECT id FROM push_subscriptions WHERE user_id=:id ORDER BY id',
        { replacements: { id: user.id }, transaction, type: QueryTypes.SELECT },
      );

      for (const subscription of subscriptions)
        await enqueueChild(
          PUSH_EVENT,
          `n:${notification.id}:push:${subscription.id}`,
          notification.id,
          { ...shared, subscriptionId: subscription.id },
          now,
          transaction,
        );
    }
    return;
  }
  if (!notification.contractId) return;
  // Email: the addressed occupant, else the contract's primary occupant (one email per event).
  const emailTenant = notification.tenantId
    ? { id: notification.tenantId }
    : await primaryOccupant(notification.contractId, transaction);

  if (transports.email && emailTenant && (await allowed({ tenantId: emailTenant.id }, 'email')))
    await enqueueChild(
      EMAIL_EVENT,
      `n:${notification.id}:email:tenant:${emailTenant.id}`,
      notification.id,
      { ...shared, tenantId: emailTenant.id, ...(emailLink ? { emailLink } : {}) },
      now,
      transaction,
    );
  if (!transports.push) return;
  // Push: every subscribed portal link of the contract (or of the addressed occupant).
  const subscriptions = await sequelize.query<{ id: string; tenantId: string }>(
    `SELECT s.id,l.tenant_id AS "tenantId" FROM push_subscriptions s
    JOIN tenant_portal_links l ON l.id=s.portal_link_id
    WHERE l.contract_id=:contractId AND l.revoked_at IS NULL
    AND (CAST(:tenantId AS uuid) IS NULL OR l.tenant_id=CAST(:tenantId AS uuid)) ORDER BY s.id`,
    {
      replacements: { contractId: notification.contractId, tenantId: notification.tenantId },
      transaction,
      type: QueryTypes.SELECT,
    },
  );

  for (const subscription of subscriptions)
    if (await allowed({ tenantId: subscription.tenantId }, 'push'))
      await enqueueChild(
        PUSH_EVENT,
        `n:${notification.id}:push:${subscription.id}`,
        notification.id,
        { ...shared, subscriptionId: subscription.id },
        now,
        transaction,
      );
}

/* -------------------------------------------------------------------------- */
/* Email and push                                                              */
/* -------------------------------------------------------------------------- */

async function deliverEmail(
  event: DomainEventModel,
  transports: NotificationTransports,
): Promise<Outcome> {
  if (!transports.email) return 'skipped';
  const payload = objectOf(event.payload);
  const notification = await loadNotification(stringOf(payload, 'notificationId') ?? '');
  const userId = stringOf(payload, 'userId');
  const tenantId = stringOf(payload, 'tenantId');

  if (!notification || (!userId && !tenantId)) return 'skipped';
  let to: string | null = null;
  let recipientName: string | null = null;

  if (userId) {
    // Still active and still staff of the building.
    to = (await staffRecipients(notification.buildingId, undefined, userId))[0]?.email ?? null;
  } else if (tenantId) {
    const [tenant] = await sequelize.query<{ email: string | null; fullName: string | null }>(
      'SELECT email, full_name AS "fullName" FROM tenants WHERE id=:id AND archived_at IS NULL',
      { replacements: { id: tenantId }, type: QueryTypes.SELECT },
    );

    to = tenant?.email ?? null;
    recipientName = tenant?.fullName ?? null;
  }
  const principal: Principal = userId ? { userId } : { tenantId: tenantId ?? '' };

  if (
    !to ||
    !channelAllowed(await preferencesOf(principal), 'email', groupOf(notification)) ||
    !(await guardAllows(guardOf(payload)))
  )
    return 'skipped';
  const link =
    stringOf(payload, 'emailLink') ??
    (notification.audience === 'staff' ? `${webOrigin(undefined)}${notification.path}` : null);

  const guard = objectOf(payload.guard);
  const invoiceId = stringOf(payload, 'invoiceId') ?? stringOf(guard, 'unpaidInvoiceId');
  const invoice = invoiceId
    ? await invoiceEmailExtras({
        kind: notification.kind,
        invoiceId,
        emailAmount: typeof payload.emailAmount === 'number' ? payload.emailAmount : null,
        audience: notification.audience,
      })
    : null;

  await transports.email.send({
    id: event.id,
    to,
    ...renderEmail({
      kind: notification.kind,
      buildingName: notification.buildingName,
      title: notification.title,
      body: notification.body,
      link,
      audience: notification.audience,
      recipientName,
      invoice,
    }),
  });
  return 'sent';
}

async function deliverPush(
  event: DomainEventModel,
  transports: NotificationTransports,
): Promise<Outcome> {
  if (!transports.push) return 'skipped';
  const payload = objectOf(event.payload);
  const notification = await loadNotification(stringOf(payload, 'notificationId') ?? '');
  const [subscription] = await sequelize.query<{
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userId: string | null;
    portalLinkId: string | null;
    tenantId: string | null;
    contractId: string | null;
    revokedAt: Date | null;
  }>(
    `SELECT s.id,s.endpoint,s.p256dh,s.auth,s.user_id AS "userId",s.portal_link_id AS "portalLinkId",
    l.tenant_id AS "tenantId",l.contract_id AS "contractId",l.revoked_at AS "revokedAt"
    FROM push_subscriptions s LEFT JOIN tenant_portal_links l ON l.id=s.portal_link_id WHERE s.id=:id`,
    { replacements: { id: stringOf(payload, 'subscriptionId') ?? '' }, type: QueryTypes.SELECT },
  );

  if (!notification || !subscription) return 'skipped';
  let principal: Principal;

  if (notification.audience === 'staff') {
    // The endpoint may have moved to another person (same browser) since the dispatch.
    if (
      !subscription.userId ||
      !(await staffRecipients(notification.buildingId, undefined, subscription.userId)).length
    )
      return 'skipped';
    principal = { userId: subscription.userId };
  } else {
    if (
      !subscription.tenantId ||
      !subscription.contractId ||
      subscription.revokedAt ||
      subscription.contractId !== notification.contractId ||
      (notification.tenantId && notification.tenantId !== subscription.tenantId)
    )
      return 'skipped';
    const context = await contractContext(subscription.contractId);

    if (!context || !portalOpen(context.contract, context.occupants, subscription.tenantId))
      return 'skipped';
    principal = { tenantId: subscription.tenantId };
  }
  if (
    !channelAllowed(await preferencesOf(principal), 'push', groupOf(notification)) ||
    !(await guardAllows(guardOf(payload)))
  )
    return 'skipped';
  try {
    await transports.push.send(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      {
        title: notification.title,
        body: notification.body,
        url: notification.path,
        tag: notification.id,
      },
    );
  } catch (error) {
    if (error instanceof DeliveryError && error.gone) {
      await sequelize.query('DELETE FROM push_subscriptions WHERE id=:id', {
        replacements: { id: subscription.id },
      });
      return 'skipped';
    }
    await sequelize.query('UPDATE push_subscriptions SET failures=failures+1 WHERE id=:id', {
      replacements: { id: subscription.id },
    });
    throw error;
  }
  await sequelize.query(
    'UPDATE push_subscriptions SET failures=0,last_success_at=now() WHERE id=:id',
    { replacements: { id: subscription.id } },
  );
  return 'sent';
}

/* -------------------------------------------------------------------------- */
/* Outbox loop                                                                 */
/* -------------------------------------------------------------------------- */

/** Claims the next due notification event (skip-locked lease, like P4's outbox worker). */
async function claim(now: Date): Promise<DomainEventModel | 'exhausted' | null> {
  return sequelize.transaction(async (transaction) => {
    const row = await DomainEventModel.findOne({
      where: {
        type: { [Op.in]: EVENT_TYPES },
        [Op.or]: [
          { status: 'pending', availableAt: { [Op.lte]: now } },
          { status: 'processing', leaseUntil: { [Op.lte]: now } },
        ],
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: true,
      order: [['availableAt', 'ASC']],
    });

    if (!row) return null;
    if (row.attempts >= MAX_DELIVERY_ATTEMPTS) {
      // A worker died mid-delivery on the last attempt.
      await row.update(
        {
          status: 'dead_letter',
          leaseToken: null,
          leaseUntil: null,
          lastErrorCode: 'lease_attempts_exhausted',
        },
        { transaction },
      );
      return 'exhausted';
    }
    await row.update(
      {
        status: 'processing',
        leaseToken: randomUUID(),
        leaseUntil: new Date(now.getTime() + LEASE_MS),
        attempts: row.attempts + 1,
      },
      { transaction },
    );
    return row;
  });
}

async function complete(
  event: DomainEventModel,
  now: Date,
  code: string | null,
  transaction?: Transaction,
) {
  await DomainEventModel.update(
    {
      status: 'delivered',
      deliveredAt: now,
      leaseUntil: null,
      leaseToken: null,
      lastErrorCode: code,
    },
    { where: { id: event.id, leaseToken: event.leaseToken }, transaction },
  );
}

/**
 * Processes one due notification event; `false` when nothing is due. Transports are injected
 * (tests use fakes); a disabled channel (`null`) is never queued and queued events are skipped.
 */
export async function deliverNotifications(
  now: Date,
  transports: NotificationTransports = configuredTransports(),
): Promise<boolean> {
  const event = await claim(now);

  if (event === null) return false;
  if (event === 'exhausted') return true;
  try {
    if (event.type === DISPATCH_EVENT) {
      await sequelize.transaction(async (transaction) => {
        await dispatch(event, now, transports, transaction);
        await complete(event, now, null, transaction);
      });
    } else {
      const outcome =
        event.type === EMAIL_EVENT
          ? await deliverEmail(event, transports)
          : await deliverPush(event, transports);

      await complete(event, now, outcome === 'skipped' ? 'skipped' : null);
    }
  } catch (error) {
    const failure = error instanceof DeliveryError ? error : null;
    const dead = Boolean(failure?.permanent) || event.attempts >= MAX_DELIVERY_ATTEMPTS;

    // Event id and code only: never addresses, endpoints or bodies.
    logger.error(`[stay-worker] Notification ${event.type} ${event.id} failed`);
    await DomainEventModel.update(
      {
        status: dead ? 'dead_letter' : 'pending',
        availableAt: new Date(
          now.getTime() + (BACKOFF_MS[event.attempts - 1] ?? BACKOFF_MS.at(-1) ?? 60_000),
        ),
        leaseUntil: null,
        leaseToken: null,
        lastErrorCode: failure?.code ?? 'delivery_failed',
      },
      { where: { id: event.id, leaseToken: event.leaseToken } },
    );
  }
  return true;
}
