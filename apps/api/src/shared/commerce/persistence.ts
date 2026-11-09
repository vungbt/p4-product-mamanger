import { createIdempotency, createOutbox } from '@p4/server-core';
import { DomainEventModel, IdempotencyRecordModel, sequelize } from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { COMMERCE_POLICY } from './contracts.js';

export type { AuditInput } from '@p4/server-core';
export { jsonValue, redact } from '@p4/server-core';
export { recordAudit } from '../audit/audited-command.js';

/** Transactional outbox on `domain_events`; the worker delivers after commit. */
export const { enqueueEvent } = createOutbox({
  insertEvent: (row, transaction) => DomainEventModel.create(row, { transaction }),
});

/** Idempotent commands on `idempotency_records`. */
export const { runIdempotent } = createIdempotency({
  sequelize,
  auditedTransaction,
  ttlHours: COMMERCE_POLICY.idempotencyTtlHours,
  records: {
    findLocked: (options) => IdempotencyRecordModel.findOne(options),
    create: (row, transaction) => IdempotencyRecordModel.create(row, { transaction }),
  },
});
