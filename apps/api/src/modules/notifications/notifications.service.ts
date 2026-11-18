import { randomUUID } from 'node:crypto';
import { BaseError } from '@p4/server-core';
import type { Notification, NotificationPreferences } from '@p4/shared';
import { Op } from 'sequelize';
import {
  AccountTokenModel,
  type DomainEventModel,
  NotificationDeliveryModel,
  NotificationModel,
  NotificationPreferencesModel,
  NotificationTemplateModel,
  OrderModel,
  RefundModel,
  StockAlertSubscriptionModel,
  SupportTicketModel,
  UserModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { unseal } from '@/shared/commerce/encryption.js';
import { selectFields } from '@/utils/select-fields.js';
import { markNotificationRead, publishRealtime } from '../realtime/realtime.service.js';

export const TEMPLATE_TYPES = [
  'order.placed',
  'order.confirmed',
  'order.shipment_delivered',
  'refund.succeeded',
  'support.message',
  'stock.available',
] as const;
export function notificationDto(row: NotificationModel): Notification {
  return {
    ...selectFields(row, ['id', 'type', 'title', 'body', 'href']),
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
export async function preferences(userId: string) {
  const [row] = await NotificationPreferencesModel.findOrCreate({
    where: { userId },
    defaults: {
      userId,
      transactionalEmail: true,
      marketingEmail: false,
      stockEmail: false,
      version: 1,
    },
  });
  return row;
}
export function preferencesDto(row: NotificationPreferencesModel): NotificationPreferences {
  return selectFields(row, ['transactionalEmail', 'marketingEmail', 'stockEmail', 'version']);
}

export async function sendEmail(input: { to: string; subject: string; text: string; key: string }) {
  const endpoint = process.env.MAIL_API_URL;
  const token = process.env.MAIL_API_TOKEN;
  if (!endpoint || !token)
    throw new BaseError('mail_provider_not_configured', 503, 'mail_provider_not_configured');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      'Idempotency-Key': input.key,
    },
    body: JSON.stringify({ to: input.to, subject: input.subject, text: input.text }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new BaseError('mail_provider_failed', 502, 'mail_provider_failed');
  return response.headers.get('x-message-id') ?? input.key;
}

export async function authEmail(event: DomainEventModel) {
  const account = await UserModel.findByPk(event.aggregateId);
  if (!account) throw new BaseError('auth_account_pending', 503, 'auth_account_pending');
  if (account.accountStatus !== 'active') return;
  const payload = event.payload;
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    typeof payload.encrypted !== 'string' ||
    typeof payload.expiresAt !== 'string'
  )
    throw new BaseError('invalid_auth_mail_event');
  if (Date.parse(payload.expiresAt) <= Date.now()) return;
  const value: unknown = JSON.parse(unseal(payload.encrypted));
  if (
    !value ||
    typeof value !== 'object' ||
    !('to' in value) ||
    !('url' in value) ||
    !('purpose' in value) ||
    typeof value.to !== 'string' ||
    typeof value.url !== 'string' ||
    typeof value.purpose !== 'string'
  )
    throw new BaseError('invalid_auth_mail_event');
  await sendEmail({
    to: value.to,
    subject: `P4: ${value.purpose}`,
    text: value.url,
    key: event.id,
  });
}

export async function accountEmail(event: DomainEventModel) {
  const payload = event.payload;
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    typeof payload.encrypted !== 'string' ||
    typeof payload.tokenId !== 'string'
  )
    throw new BaseError('invalid_account_mail_event');
  const record = await AccountTokenModel.findByPk(payload.tokenId);
  if (!record || record.consumedAt || record.expiresAt.getTime() <= Date.now()) return;
  const value: unknown = JSON.parse(unseal(payload.encrypted));
  if (
    !value ||
    typeof value !== 'object' ||
    !('to' in value) ||
    !('token' in value) ||
    !('purpose' in value) ||
    typeof value.to !== 'string' ||
    typeof value.token !== 'string' ||
    typeof value.purpose !== 'string'
  )
    throw new BaseError('invalid_account_mail_event');
  await sendEmail({
    to: value.to,
    subject: `P4: ${value.purpose}`,
    text: `Your ${value.purpose} token: ${value.token}\nExpires at ${record.expiresAt.toISOString()}.`,
    key: event.id,
  });
}

async function notify(
  event: DomainEventModel,
  userId: string,
  type: string,
  href: string,
  stockSubscriptionId?: string,
) {
  const user = await UserModel.findByPk(userId);
  if (user?.accountStatus !== 'active') return;
  const pref = await preferences(userId);
  const template = await NotificationTemplateModel.findOne({
    where: { type, locale: user.locale },
  });
  const title = template?.subject ?? 'P4 Store';
  const body = template?.body ?? `Update: ${type}`;
  const [inbox] = await NotificationModel.findOrCreate({
    where: { userId, eventId: event.id },
    defaults: {
      id: randomUUID(),
      userId,
      eventId: event.id,
      type,
      title,
      body,
      href,
      readAt: null,
    },
  });
  await auditedTransaction(async (transaction) =>
    publishRealtime(
      userId,
      { type: 'notification.created', notification: notificationDto(inbox) },
      `notification:${inbox.id}`,
      transaction,
    ),
  );
  const [delivery] = await NotificationDeliveryModel.findOrCreate({
    where: { eventId: event.id, userId },
    defaults: {
      id: randomUUID(),
      eventId: event.id,
      userId,
      status: 'pending',
      providerReference: null,
    },
  });
  if (delivery.status !== 'pending') return;
  const subscription = stockSubscriptionId
    ? await StockAlertSubscriptionModel.findByPk(stockSubscriptionId)
    : null;
  if (
    !user.emailVerifiedAt ||
    !(type === 'stock.available' ? pref.stockEmail : pref.transactionalEmail) ||
    (stockSubscriptionId && subscription?.status !== 'active')
  ) {
    await delivery.update({ status: 'suppressed' });
    return;
  }
  const reference = await sendEmail({
    to: user.email,
    subject: title,
    text: `${body}\n${href}`,
    key: `${event.id}:${userId}`,
  });
  await delivery.update({ status: 'delivered', providerReference: reference });
  if (subscription) await subscription.update({ status: 'notified' });
}

export async function orderNotification(event: DomainEventModel) {
  const order = await OrderModel.findByPk(event.aggregateId);
  if (!order) return;
  await notify(event, order.userId, event.type, `/shop/orders/${order.id}`);
}
export async function refundNotification(event: DomainEventModel) {
  const refund = await RefundModel.findByPk(event.aggregateId);
  if (!refund) return;
  const order = await OrderModel.findByPk(refund.orderId);
  if (order) await notify(event, order.userId, event.type, `/shop/orders/${order.id}`);
}
export async function inventoryNotification(event: DomainEventModel) {
  const payload = event.payload;
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    typeof payload.available !== 'number' ||
    typeof payload.previousAvailable !== 'number' ||
    payload.available <= 0 ||
    payload.previousAvailable > 0
  )
    return;
  const rows = await StockAlertSubscriptionModel.findAll({
    where: { variantId: event.aggregateId, status: 'active' },
  });
  for (const row of rows) await notify(event, row.userId, 'stock.available', `/shop`, row.id);
}

export async function readNotifications(userId: string, id?: string) {
  if (id) await markNotificationRead(userId, id);
  else
    await auditedTransaction(async (transaction) => {
      await NotificationModel.update(
        { readAt: new Date() },
        { where: { userId, readAt: null }, transaction },
      );
      await publishRealtime(
        userId,
        { type: 'notification.read', id: null },
        `notification-read-all:${randomUUID()}`,
        transaction,
      );
    });
  return { read: true };
}
export async function unreadCount(userId: string) {
  return { count: await NotificationModel.count({ where: { userId, readAt: { [Op.is]: null } } }) };
}

export async function supportNotification(event: DomainEventModel) {
  const ticket = await SupportTicketModel.findByPk(event.aggregateId);
  if (ticket) await notify(event, ticket.userId, 'support.message', `/shop/support/${ticket.id}`);
}
