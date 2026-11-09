import { createHash, randomUUID } from 'node:crypto';
import type { JsonValue } from '@p4/shared';
import type { Sequelize, Transaction } from 'sequelize';
import { auditScope } from '../audit/context.js';
import type { AuditedTransaction } from '../audit/runtime.js';
import { BaseError, InputValidError } from '../shared/errors.js';
import { jsonValue } from '../shared/json.js';

// A type alias (not an interface) so it is assignable to Sequelize `WhereOptions`.
export type IdempotencyKey = {
  scope: string;
  actorId: string;
  key: string;
};

/** One `idempotency_records` row as written by `runIdempotent`. */
export interface IdempotencyRecordRow extends IdempotencyKey {
  id: string;
  requestHash: string;
  result: JsonValue;
  expiresAt: Date;
}

export interface StoredIdempotencyRecord {
  requestHash: string;
  result: JsonValue;
  expiresAt: Date;
}

export interface IdempotencyOptions<Stored extends StoredIdempotencyRecord> {
  sequelize: Sequelize;
  /** `auditedTransaction` from `createAuditRuntime`. */
  auditedTransaction: AuditedTransaction;
  /** How long a stored result can be replayed. */
  ttlHours: number;
  records: {
    /**
     * Find the record for `options.where` with the given row lock, e.g.
     * `IdempotencyRecordModel.findOne(options)`.
     */
    findLocked: (options: {
      where: IdempotencyKey;
      transaction: Transaction;
      lock: Transaction['LOCK']['UPDATE'];
    }) => Promise<Stored | null>;
    /** Insert a record, e.g. `IdempotencyRecordModel.create(row, { transaction })`. */
    create: (row: IdempotencyRecordRow, transaction: Transaction) => Promise<unknown>;
  };
}

/**
 * Idempotent commands keyed by `(scope, actorId, key)`. Concurrent calls are serialised with a
 * transaction advisory lock; a replay returns the stored result, a different payload for the same
 * key is a 409 `idempotency_conflict`.
 */
export function createIdempotency<Stored extends StoredIdempotencyRecord>({
  sequelize,
  auditedTransaction,
  ttlHours,
  records,
}: IdempotencyOptions<Stored>) {
  async function runIdempotent(
    input: IdempotencyKey & { payload: JsonValue },
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
      const existing = await records.findLocked({
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
      await records.create(
        {
          id: randomUUID(),
          ...where,
          requestHash,
          result,
          expiresAt: new Date(Date.now() + ttlHours * 3_600_000),
        },
        transaction,
      );
      return { result, replayed: false };
    });
  }

  return { runIdempotent };
}
