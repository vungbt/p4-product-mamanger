import { randomUUID } from 'node:crypto';
import { isoDateInTimeZone, type NotificationKind } from '@stay/shared';
import { QueryTypes, type Transaction } from 'sequelize';
import { sequelize } from '@/sequelize/models/index.js';
import { enqueueEvent } from '@/shared/persistence.js';

/** Postgres channel woken on commit (`pg_notify` is transactional); payload = ids only. */
export const NOTIFICATION_CHANNEL = 'stay_notifications';
/** Outbox event that fans one notification out to email/push recipients (worker). */
export const DISPATCH_EVENT = 'stay.notification.dispatch';

/**
 * Re-checked by the worker right before email/push: an automation run whose switch was turned
 * off, or an invoice paid meanwhile, suppresses the delivery (the in-app row stays).
 */
export interface DeliveryGuard {
  automationRunId?: string;
  /** Deliver only while this invoice still has something to pay. */
  unpaidInvoiceId?: string;
}

export interface NotificationInput {
  buildingId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** In-app path: staff screen (`/requests`) or tenant portal (`/p/invoices/{id}`). */
  path: string;
  /** `tenant`: the occupants of `contractId`, or only `tenantId` when set. */
  audience: 'staff' | 'tenant';
  contractId?: string;
  tenantId?: string | null;
  /** Absolute link used by the email instead of the web path (e.g. a shared invoice link). */
  emailLink?: string;
  guard?: DeliveryGuard;
}

export interface StreamSignal {
  id: string;
  audience: 'staff' | 'tenant';
  buildingId: string;
  contractId: string | null;
  tenantId: string | null;
}

/**
 * Records an in-app notification inside the business transaction and queues its delivery. Email
 * and browser push are sent by the worker after commit (outbox); connected browsers are woken by
 * `pg_notify`, which Postgres only delivers once the transaction commits.
 */
export async function publishNotification(
  input: NotificationInput,
  transaction: Transaction,
): Promise<string> {
  if (input.audience === 'tenant' && !input.contractId)
    throw new Error('Tenant notifications need a contract');
  const id = randomUUID();
  const signal: StreamSignal = {
    id,
    audience: input.audience,
    buildingId: input.buildingId,
    contractId: input.contractId ?? null,
    tenantId: input.tenantId ?? null,
  };

  await sequelize.query(
    `INSERT INTO notifications(id,building_id,kind,title,body,path,audience,contract_id,tenant_id)
    VALUES (:id,:buildingId,:kind,:title,:body,:path,:audience,:contractId,:tenantId)`,
    {
      replacements: {
        ...signal,
        kind: input.kind,
        title: input.title,
        body: input.body,
        path: input.path,
      },
      transaction,
    },
  );
  await enqueueEvent(
    {
      type: DISPATCH_EVENT,
      aggregateType: 'notification',
      aggregateId: id,
      payload: {
        notificationId: id,
        ...(input.emailLink ? { emailLink: input.emailLink } : {}),
        ...(input.guard ? { guard: { ...input.guard } } : {}),
      },
    },
    transaction,
  );
  await sequelize.query('SELECT pg_notify(:channel,:payload)', {
    replacements: { channel: NOTIFICATION_CHANNEL, payload: JSON.stringify(signal) },
    transaction,
  });
  return id;
}

/** `1.500.000 ₫` */
export function formatVnd(amount: number): string {
  return `${String(Math.trunc(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
}

/** `dd/MM/yyyy` of a business date `YYYY-MM-DD`. */
export function displayDate(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}

/** Code of the room a contract occupies (current room after a room change). */
export async function roomCodeOf(roomId: string, transaction?: Transaction): Promise<string> {
  const [row] = await sequelize.query<{ code: string }>('SELECT code FROM rooms WHERE id=:id', {
    replacements: { id: roomId },
    transaction,
    type: QueryTypes.SELECT,
  });

  return row?.code ?? '';
}

/**
 * Primary occupant of a contract on `date` (Vietnam business date); for a contract that starts
 * later, its first primary occupant.
 */
export async function primaryOccupant(
  contractId: string,
  transaction?: Transaction,
  date = isoDateInTimeZone(new Date()),
): Promise<{ id: string; email: string | null; fullName: string } | null> {
  const [row] = await sequelize.query<{ id: string; email: string | null; fullName: string }>(
    `SELECT t.id,t.email,t.full_name AS "fullName" FROM contract_occupants o JOIN tenants t ON t.id=o.tenant_id
    WHERE o.contract_id=:id AND o.is_primary AND (o.to_date IS NULL OR o.to_date>:date)
    ORDER BY o.from_date LIMIT 1`,
    { replacements: { id: contractId, date }, transaction, type: QueryTypes.SELECT },
  );

  return row ?? null;
}
