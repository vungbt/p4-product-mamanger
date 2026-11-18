import { randomUUID } from 'node:crypto';
import { BaseError, requestStore } from '@p4/server-core';
import { Op, type Transaction } from 'sequelize';
import {
  DomainEventModel,
  InventoryReservationModel,
  OrderModel,
  PaymentAttemptModel,
  PaymentModel,
  sequelize,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit/audited-command.js';
import { enqueueEvent } from '@/shared/commerce/persistence.js';
import { selectFields } from '@/utils/select-fields.js';
import { moveInventory } from '../inventory/inventory.service.js';
import { settleCoupon } from '../promotions/promotions.service.js';

export type EventHandler = (event: DomainEventModel) => Promise<void>;
export type EventHandlers = ReadonlyMap<string, EventHandler>;
const MAX_ATTEMPTS = 5;

export function jobDto(row: DomainEventModel) {
  return {
    ...selectFields(row, [
      'id',
      'type',
      'aggregateType',
      'aggregateId',
      'status',
      'attempts',
      'lastErrorCode',
    ]),
    availableAt: row.availableAt.toISOString(),
    leaseUntil: row.leaseUntil?.toISOString() ?? null,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function claimEvent(now = new Date(), types?: readonly string[]) {
  return auditedTransaction(async (transaction) => {
    const row = await DomainEventModel.findOne({
      where: {
        ...(types ? { type: { [Op.in]: types } } : {}),
        [Op.or]: [
          { status: 'pending', availableAt: { [Op.lte]: now } },
          { status: 'processing', leaseUntil: { [Op.lte]: now } },
        ],
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
      skipLocked: true,
      order: [
        ['availableAt', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    if (!row) return null;
    if (row.attempts >= MAX_ATTEMPTS) {
      await row.update(
        {
          status: 'dead_letter',
          leaseToken: null,
          leaseUntil: null,
          lastErrorCode: 'lease_attempts_exhausted',
        },
        { transaction },
      );
      return null;
    }
    await row.update(
      {
        status: 'processing',
        attempts: row.attempts + 1,
        leaseToken: randomUUID(),
        leaseUntil: new Date(now.getTime() + 90_000),
      },
      { transaction },
    );
    return row;
  });
}

export async function finishEvent(event: DomainEventModel, errorCode: string | null) {
  return auditedTransaction(async (transaction) => {
    const row = await DomainEventModel.findOne({
      where: { id: event.id, status: 'processing', leaseToken: event.leaseToken },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) return false;
    const status = errorCode
      ? row.attempts >= MAX_ATTEMPTS
        ? 'dead_letter'
        : 'pending'
      : 'delivered';
    await row.update(
      {
        status,
        lastErrorCode: errorCode,
        leaseToken: null,
        leaseUntil: null,
        deliveredAt: errorCode ? null : new Date(),
        availableAt: errorCode
          ? new Date(Date.now() + Math.min(3600, 2 ** row.attempts * 10) * 1000)
          : row.availableAt,
      },
      { transaction },
    );
    await sequelize.query(
      'INSERT INTO job_attempts (id,event_id,attempt,status,error_code,created_at,updated_at) VALUES (:id,:eventId,:attempt,:status,:code,NOW(),NOW())',
      {
        replacements: {
          id: randomUUID(),
          eventId: row.id,
          attempt: row.attempts,
          status,
          code: errorCode,
        },
        transaction,
      },
    );
    return true;
  });
}

export async function runNextEvent(handlers: EventHandlers) {
  const event = await claimEvent();
  if (!event) return false;
  try {
    const handler = handlers.get(event.type);
    if (!handler) throw new BaseError('unsupported_event', 400, 'unsupported_event');
    const payload = event.payload;
    const metadata =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? payload._audit
        : undefined;
    const audit =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : undefined;
    const actorId =
      typeof audit?.actorId === 'string'
        ? audit.actorId
        : payload &&
            typeof payload === 'object' &&
            !Array.isArray(payload) &&
            typeof payload.actorId === 'string'
          ? payload.actorId
          : undefined;
    const correlationId =
      typeof audit?.correlationId === 'string' ? audit.correlationId : undefined;
    const actor = actorId
      ? await import('../auth/auth.service.js').then(({ getMe }) =>
          getMe(actorId)
            .then(({ user }) => user)
            .catch(() => undefined),
        )
      : undefined;
    await requestStore.run(
      {
        requestId: `job:${event.id}`,
        source: 'worker',
        actorId,
        correlationId,
        ...(actor ? { user: actor } : {}),
      },
      () => handler(event),
    );
    await finishEvent(event, null);
  } catch (error) {
    await finishEvent(
      event,
      error instanceof BaseError && /^[a-z_]{1,80}$/.test(error.code)
        ? error.code
        : 'handler_failed',
    );
  }
  return true;
}

export async function expireOrder(orderId: string, now: Date, transaction: Transaction) {
  const order = await OrderModel.findByPk(orderId, { transaction, lock: transaction.LOCK.UPDATE });
  if (order?.status !== 'pending') return false;
  const reservations = await InventoryReservationModel.findAll({
    where: { orderId, status: 'reserved' },
    transaction,
    order: [
      ['productId', 'ASC'],
      ['variantId', 'ASC'],
    ],
  });
  if (
    !reservations.length ||
    !reservations.some((row) => row.expiresAt && row.expiresAt.getTime() <= now.getTime())
  )
    return false;
  for (const row of reservations) {
    if (!row.variantId) throw new BaseError('reservation_variant_missing');
    await moveInventory(
      {
        variantId: row.variantId,
        kind: 'release',
        quantity: row.quantity,
        actorId: null,
        reason: 'Reservation expired',
        reference: `expiry:${order.id}`,
      },
      transaction,
    );
    await row.update({ status: 'released' }, { transaction });
  }
  await order.update(
    { status: 'cancelled', lifecycleStatus: 'cancelled', version: order.version + 1 },
    { transaction },
  );
  await settleCoupon(order.id, 'released', transaction);
  await PaymentAttemptModel.update(
    { status: 'expired' },
    { where: { orderId, status: { [Op.in]: ['pending', 'processing'] } }, transaction },
  );
  await PaymentModel.update(
    { status: 'failed' },
    { where: { orderId, status: 'pending' }, transaction },
  );
  await recordAudit(
    { action: 'order.expired', resourceType: 'order', resourceId: order.id },
    transaction,
  );
  await enqueueEvent(
    {
      type: 'order.expired',
      aggregateType: 'order',
      aggregateId: order.id,
      payload: { orderId, userId: order.userId },
    },
    transaction,
  );
  return true;
}

export async function sweepExpiredReservations(now = new Date()) {
  const rows = await InventoryReservationModel.findAll({
    where: { status: 'reserved', expiresAt: { [Op.lte]: now } },
    attributes: ['orderId'],
    limit: 100,
    order: [['expiresAt', 'ASC']],
  });
  let expired = 0;
  for (const orderId of new Set(rows.map((row) => row.orderId))) {
    if (await auditedTransaction(async (transaction) => expireOrder(orderId, now, transaction)))
      expired++;
  }
  return expired;
}

export async function retryEvent(actorId: string, id: string, handlers: EventHandlers) {
  return auditedTransaction(async (transaction) => {
    const row = await DomainEventModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row) throw new BaseError('job_not_found', 404, 'job_not_found');
    if (!handlers.has(row.type) || row.status !== 'dead_letter')
      throw new BaseError('job_not_retryable', 409, 'job_not_retryable');
    await row.update(
      { status: 'pending', attempts: 0, availableAt: new Date(), lastErrorCode: null },
      { transaction },
    );
    await recordAudit(
      { actorId, action: 'job.retry_requested', resourceType: 'job', resourceId: id },
      transaction,
    );
    return jobDto(row);
  });
}
