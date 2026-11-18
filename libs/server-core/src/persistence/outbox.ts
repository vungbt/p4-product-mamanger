import { randomUUID } from 'node:crypto';
import type { JsonValue } from '@p4/shared';
import type { Transaction } from 'sequelize';
import { requestStore } from '../request-store.js';

export interface OutboxEvent {
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: JsonValue;
}

/** One pending `domain_events` row as written by `enqueueEvent`. */
export interface DomainEventRow extends OutboxEvent {
  id: string;
  status: 'pending';
  attempts: number;
  availableAt: Date;
  leaseUntil: null;
  deliveredAt: null;
}

export interface OutboxOptions<Row> {
  /** Insert one event inside `transaction`, e.g. `DomainEventModel.create(row, { transaction })`. */
  insertEvent: (row: DomainEventRow, transaction: Transaction) => Promise<Row>;
}

/**
 * Transactional outbox: events are written in the business transaction and delivered by a worker
 * after commit, so provider side effects never run before the data is committed. Object payloads
 * carry `_audit` (actor, request and correlation ids) from the request context.
 */
export function createOutbox<Row>({ insertEvent }: OutboxOptions<Row>) {
  async function enqueueEvent(event: OutboxEvent, transaction: Transaction): Promise<Row> {
    const context = requestStore.getStore();
    const payload =
      event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload) && context
        ? {
            ...event.payload,
            _audit: {
              actorId: context.user?.id ?? context.actorId ?? null,
              requestId: context.requestId,
              correlationId: context.correlationId ?? context.requestId,
            },
          }
        : event.payload;
    return insertEvent(
      {
        id: randomUUID(),
        ...event,
        payload,
        status: 'pending',
        attempts: 0,
        availableAt: new Date(),
        leaseUntil: null,
        deliveredAt: null,
      },
      transaction,
    );
  }

  return { enqueueEvent };
}
