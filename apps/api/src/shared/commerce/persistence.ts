import { createHash, randomUUID } from 'node:crypto';
import type { JsonValue } from '@p4/shared';
import type { Transaction } from 'sequelize';
import { DomainEventModel, IdempotencyRecordModel, sequelize } from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { auditScope } from '@/shared/audit/context.js';
import { requestStore } from '@/shared/request-store.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { InputValidError } from '@/utils/errors/index.js';
import { COMMERCE_POLICY } from './contracts.js';

export function jsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value))
    return value.map((item: unknown) => (item === undefined ? null : jsonValue(item)));
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .flatMap((key) => {
          const item: unknown = Reflect.get(value, key);
          return item === undefined ? [] : [[key, jsonValue(item)]];
        }),
    );
  }
  throw new InputValidError('invalid_json_value');
}

export { recordAudit } from '../audit/record.js';
export { redact } from '../audit/redact.js';
export type { AuditInput } from '../audit/types.js';

export async function enqueueEvent(
  event: { type: string; aggregateType: string; aggregateId: string; payload: JsonValue },
  transaction: Transaction,
) {
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
  return DomainEventModel.create(
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
    { transaction },
  );
}

export async function runIdempotent(
  input: { scope: string; actorId: string; key: string; payload: JsonValue },
  work: (transaction: Transaction) => Promise<JsonValue>,
) {
  if (!/^[\x21-\x7e]{8,128}$/.test(input.key))
    throw new InputValidError('input_valid_error', {
      idempotencyKey: ['Expected 8–128 printable characters.'],
    });
  const requestHash = createHash('sha256')
    .update(JSON.stringify(jsonValue(input.payload)))
    .digest('hex');
  return auditedTransaction(async (transaction) => {
    const lockKey = JSON.stringify([input.scope, input.actorId, input.key]);
    await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:key))', {
      replacements: { key: lockKey },
      transaction,
    });
    const where = { scope: input.scope, actorId: input.actorId, key: input.key };
    const existing = await IdempotencyRecordModel.findOne({
      where,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existing) {
      if (existing.requestHash !== requestHash)
        throw new BaseError('idempotency_conflict', 409, 'idempotency_conflict');
      if (existing.expiresAt.getTime() <= Date.now())
        throw new BaseError('idempotency_key_expired', 409, 'idempotency_key_expired');
      const scope = auditScope.getStore();
      if (scope) scope.replayed = true;
      return { result: existing.result, replayed: true };
    }
    const result = await work(transaction);
    await IdempotencyRecordModel.create(
      {
        id: randomUUID(),
        ...where,
        requestHash,
        result,
        expiresAt: new Date(Date.now() + COMMERCE_POLICY.idempotencyTtlHours * 3_600_000),
      },
      { transaction },
    );
    return { result, replayed: false };
  });
}
