import { createHash, randomUUID } from 'node:crypto';
import type { ProcessInput, ProcessIssue, ProcessSnapshot } from '@p4/processes/shared';
import { processProgress } from '@p4/processes/shared';
import type { Permission, User } from '@p4/shared';
import type { Transaction } from 'sequelize';
import { Op, UniqueConstraintError } from 'sequelize';
import { permissionsFor } from '@/middlewares/permission.middleware.js';
import {
  DomainEventModel,
  ProcessItemModel,
  ProcessModel,
  sequelize,
} from '@/sequelize/models/index.js';
import {
  enqueueEvent,
  jsonValue,
  recordAudit,
  runIdempotent,
} from '@/shared/commerce/persistence.js';
import { assertVersion } from '@/shared/commerce/transitions.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { Forbidden, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';
import { publishRealtime } from '../realtime/realtime.service.js';
import { readProcessFile } from './storage.service.js';

export function processPermission(input: ProcessInput): Permission | null {
  if (input.kind === 'media.batch') return null;
  if (input.kind === 'data.import')
    return input.resource === 'inventory' ? 'inventory:write' : 'catalog:write';
  switch (input.resource) {
    case 'inventory':
      return 'inventory:read';
    case 'orders':
      return 'order:read';
    case 'sales-report':
      return 'report:export';
    default:
      return 'catalog:read';
  }
}
export function authorizeProcess(user: User, input: ProcessInput) {
  const permission = processPermission(input);
  if (permission && !permissionsFor(user).includes(permission)) throw new Forbidden();
}
export function processDto(row: ProcessModel): ProcessSnapshot {
  return {
    ...selectFields(row, [
      'id',
      'kind',
      'state',
      'phase',
      'version',
      'processed',
      'total',
      'succeeded',
      'failed',
      'errorCode',
      'result',
    ]),
    result:
      row.result && row.expiresAt.getTime() <= Date.now()
        ? { ...row.result, downloadUrl: null }
        : row.result,
    progress: processProgress(row.processed, row.total),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}
export async function publishProcess(row: ProcessModel, transaction: Transaction) {
  await publishRealtime(
    row.userId,
    { type: 'process.updated', process: processDto(row) },
    `process:${row.id}:${row.version}`,
    transaction,
  );
}
export async function ownedProcess(
  userId: string,
  id: string,
  transaction?: Transaction,
  lock = false,
) {
  const row = await ProcessModel.findOne({
    where: { id, userId },
    transaction,
    ...(transaction && lock ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!row) throw new NotFound();
  return row;
}
export async function createProcess(user: User, input: ProcessInput, key: string) {
  authorizeProcess(user, input);
  const payload =
    input.kind === 'data.import'
      ? {
          ...input,
          storageKey: createHash('sha256')
            .update(await readProcessFile(input.storageKey))
            .digest('hex'),
        }
      : input;
  const result = await runIdempotent(
    { scope: 'process.create', actorId: user.id, key, payload: jsonValue(payload) },
    async (transaction) => {
      const row = await ProcessModel.create(
        {
          id: randomUUID(),
          userId: user.id,
          kind: input.kind,
          input,
          state: 'queued',
          phase:
            input.kind === 'data.import'
              ? 'validate'
              : input.kind === 'data.export'
                ? 'generate'
                : 'verify',
          version: 1,
          total: 0,
          processed: 0,
          succeeded: 0,
          failed: 0,
          errorCode: null,
          result: null,
          outputKey: null,
          expiresAt: new Date(Date.now() + 86400000),
        },
        { transaction },
      );
      await enqueueEvent(
        {
          type: 'process.requested',
          aggregateType: 'process',
          aggregateId: row.id,
          payload: { processId: row.id },
        },
        transaction,
      );
      await publishProcess(row, transaction);
      await recordAudit(
        {
          actorId: user.id,
          action: 'process.created',
          resourceType: 'process',
          resourceId: row.id,
          changes: { kind: input.kind },
        },
        transaction,
      );
      return { processId: row.id };
    },
  );
  const value = result.result;
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof value.processId !== 'string'
  )
    throw new Error('Invalid process result');
  return processDto(await ownedProcess(user.id, value.processId));
}
export async function confirmProcess(user: User, id: string, expectedVersion: number) {
  return sequelize.transaction(async (transaction) => {
    const row = await ownedProcess(user.id, id, transaction, true);
    authorizeProcess(user, row.input);
    assertVersion(row.version, expectedVersion);
    if (row.state !== 'awaiting_confirmation' || row.input.kind !== 'data.import')
      throw new BaseError('process_not_confirmable', 409, 'process_not_confirmable');
    if (row.expiresAt.getTime() <= Date.now())
      throw new BaseError('process_expired', 409, 'process_expired');
    const valid = await ProcessItemModel.count({
      where: { processId: id, state: 'valid' },
      transaction,
    });
    if (!valid) throw new BaseError('import_has_no_valid_rows', 409, 'import_has_no_valid_rows');
    await row.update(
      {
        state: 'queued',
        phase: 'apply',
        processed: row.failed,
        succeeded: 0,
        version: row.version + 1,
      },
      { transaction },
    );
    await enqueueEvent(
      {
        type: 'process.requested',
        aggregateType: 'process',
        aggregateId: id,
        payload: { processId: id },
      },
      transaction,
    );
    await publishProcess(row, transaction);
    await recordAudit(
      { actorId: user.id, action: 'process.confirmed', resourceType: 'process', resourceId: id },
      transaction,
    );
    return processDto(row);
  });
}
export async function cancelProcess(user: User, id: string, expectedVersion: number) {
  return sequelize.transaction(async (transaction) => {
    const row = await ownedProcess(user.id, id, transaction, true);
    assertVersion(row.version, expectedVersion);
    if (!['queued', 'running', 'awaiting_confirmation'].includes(row.state))
      throw new BaseError('process_not_cancellable', 409, 'process_not_cancellable');
    await row.update({ state: 'cancelled', version: row.version + 1 }, { transaction });
    await publishProcess(row, transaction);
    await recordAudit(
      { actorId: user.id, action: 'process.cancelled', resourceType: 'process', resourceId: id },
      transaction,
    );
    return processDto(row);
  });
}
export async function assertProcessLease(event: DomainEventModel, transaction: Transaction) {
  const lease = await DomainEventModel.findOne({
    where: {
      id: event.id,
      status: 'processing',
      leaseToken: event.leaseToken,
      leaseUntil: { [Op.gt]: new Date() },
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!lease) throw new BaseError('process_lease_lost', 409, 'process_lease_lost');
  await lease.update({ leaseUntil: new Date(Date.now() + 90000) }, { transaction });
}
export function processFailure(error: unknown, item: number): ProcessIssue[] {
  if (error instanceof UniqueConstraintError)
    return error.errors.map((issue) => ({
      item,
      field: issue.path ?? undefined,
      code: 'unique_value',
      message: 'This value already exists.',
    }));
  if (error instanceof BaseError) return [{ item, code: error.code, message: error.message }];
  return [{ item, code: 'invalid_row', message: 'The row could not be processed.' }];
}
