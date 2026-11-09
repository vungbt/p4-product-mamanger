import { createIdempotency, createOutbox } from '@p4/server-core';
import { DomainEventModel, IdempotencyRecordModel, sequelize } from '@/sequelize/models/index.js';
import { auditedTransaction } from './audit.js';

/** `enqueueEvent` inside the business transaction; a worker delivers after commit. */
export const { enqueueEvent } = createOutbox({
  insertEvent: (row, transaction) => DomainEventModel.create(row, { transaction }),
});

/** `runIdempotent` for bulk creates that take an `Idempotency-Key` header. */
export const { runIdempotent } = createIdempotency({
  sequelize,
  auditedTransaction,
  ttlHours: 24,
  records: {
    findLocked: (options) => IdempotencyRecordModel.findOne(options),
    create: (row, transaction) => IdempotencyRecordModel.create(row, { transaction }),
  },
});
