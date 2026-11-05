import { randomUUID } from 'node:crypto';
import type { ProcessIssue } from '@p4/processes/shared';
import { parseImportRow } from '@p4/processes/shared';
import type { User } from '@p4/shared';
import * as v from 'valibot';
import { permissionsFor } from '@/middlewares/permission.middleware.js';
import {
  type DomainEventModel,
  ProcessItemModel,
  ProcessModel,
  sequelize,
  UploadTicketModel,
} from '@/sequelize/models/index.js';
import { jsonValue } from '@/shared/commerce/persistence.js';
import { requestStore } from '@/shared/request-store.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { getMe } from '../auth/auth.service.js';
import { completeUpload } from '../files/uploads.service.js';
import { exportBuffer } from './exports.service.js';
import { applyImportRow, importTarget, validateImportReferences } from './imports.service.js';
import {
  assertProcessLease,
  authorizeProcess,
  processFailure,
  publishProcess,
} from './processes.service.js';
import { readSpreadsheet } from './spreadsheets.service.js';
import { removeProcessFile, storeProcessFile } from './storage.service.js';

async function refreshProgress(id: string, event: DomainEventModel, finish = false) {
  return sequelize.transaction(async (transaction) => {
    await assertProcessLease(event, transaction);
    const row = await ProcessModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!row || row.state === 'cancelled') return null;
    const items = await ProcessItemModel.findAll({
      where: { processId: id },
      attributes: ['state'],
      transaction,
    });
    const failed = items.filter(
      (item) => item.state === 'invalid' || item.state === 'failed',
    ).length;
    const succeeded = items.filter((item) =>
      row.phase === 'validate' ? item.state === 'valid' : item.state === 'applied',
    ).length;
    const processed = failed + succeeded;
    await row.update(
      {
        total: items.length,
        processed,
        succeeded,
        failed,
        version: row.version + 1,
        ...(finish
          ? {
              state:
                row.phase === 'validate'
                  ? 'awaiting_confirmation'
                  : failed
                    ? 'completed_with_errors'
                    : 'completed',
              result: {
                resourceIds: [],
                downloadUrl: null,
                total: items.length,
                succeeded,
                failed,
              },
            }
          : {}),
      },
      { transaction },
    );
    await publishProcess(row, transaction);
    return row;
  });
}
async function previewImport(row: ProcessModel, event: DomainEventModel) {
  if (row.input.kind !== 'data.import') throw new BaseError('invalid_process_kind');
  const source = await readSpreadsheet(row.input.storageKey, row.input.format, row.input.resource);
  if (!source.length) throw new BaseError('empty_import');
  const resource = row.input.resource;
  for (const entry of source) {
    if (resource === 'products' && entry.values.initialStock === '')
      delete entry.values.initialStock;
    await sequelize.transaction(async (transaction) => {
      await assertProcessLease(event, transaction);
      const process = await ProcessModel.findByPk(row.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (process?.state === 'cancelled') throw new BaseError('process_cancelled');
      if (
        await ProcessItemModel.count({
          where: { processId: row.id, index: entry.index },
          transaction,
        })
      )
        return;
      let issues = [...entry.issues];
      let target: unknown = null;
      if (!issues.length)
        try {
          const parsed = parseImportRow(resource, entry.values);
          await validateImportReferences(parsed, transaction);
          target = await importTarget(parsed, transaction);
        } catch (error) {
          issues = v.isValiError(error)
            ? error.issues.map((issue) => ({
                item: entry.index,
                field: issue.path?.map((part) => String(part.key)).join('.'),
                code: 'invalid_field',
                message: issue.message,
              }))
            : processFailure(error, entry.index);
        }
      await ProcessItemModel.create(
        {
          id: randomUUID(),
          processId: row.id,
          index: entry.index,
          state: issues.length ? 'invalid' : 'valid',
          data: jsonValue(entry.values),
          result: jsonValue(target),
          issues,
        },
        { transaction },
      );
    });
    if (entry.index % 25 === 0) await refreshProgress(row.id, event);
  }
  await refreshProgress(row.id, event, true);
}
async function applyImport(row: ProcessModel, event: DomainEventModel, user: User) {
  if (row.input.kind !== 'data.import') throw new BaseError('invalid_process_kind');
  const resource = row.input.resource;
  const items = await ProcessItemModel.findAll({
    where: { processId: row.id, state: 'valid' },
    order: [['index', 'ASC']],
  });
  for (const pointer of items) {
    try {
      await sequelize.transaction(async (transaction) => {
        await assertProcessLease(event, transaction);
        const process = await ProcessModel.findByPk(row.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (process?.state === 'cancelled') throw new BaseError('process_cancelled');
        const item = await ProcessItemModel.findByPk(pointer.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (item?.state !== 'valid') return;
        const result = await applyImportRow(
          resource,
          item.data,
          item.result,
          user,
          `process:${row.id}:${item.index}`,
          transaction,
        );
        await item.update(
          { state: 'applied', result: jsonValue({ id: result.id }) },
          { transaction },
        );
      });
    } catch (error) {
      if (
        error instanceof BaseError &&
        ['process_cancelled', 'process_lease_lost'].includes(error.code)
      )
        throw error;
      await sequelize.transaction(async (transaction) => {
        await assertProcessLease(event, transaction);
        await ProcessItemModel.update(
          { state: 'failed', issues: processFailure(error, pointer.index) },
          { where: { id: pointer.id, state: 'valid' }, transaction },
        );
      });
    }
    if (pointer.index % 25 === 0) await refreshProgress(row.id, event);
  }
  await refreshProgress(row.id, event, true);
}
async function mediaBatch(row: ProcessModel, event: DomainEventModel, user: User) {
  if (row.input.kind !== 'media.batch') throw new BaseError('invalid_process_kind');
  for (const [index, id] of row.input.ticketIds.entries()) {
    if (await ProcessItemModel.count({ where: { processId: row.id, index } })) continue;
    let issues: ProcessIssue[] = [];
    let fileId: string | null = null;
    try {
      const ticket = await UploadTicketModel.findOne({ where: { id, ownerId: user.id } });
      if (!ticket) throw new BaseError('upload_not_found');
      if (
        (ticket.purpose === 'product' && !permissionsFor(user).includes('catalog:write')) ||
        (ticket.purpose === 'blog' && !permissionsFor(user).includes('content:write'))
      )
        throw new BaseError('permission_revoked');
      const result = await completeUpload(user.id, id);
      fileId = result.fileId;
    } catch (error) {
      issues = processFailure(error, index);
    }
    await sequelize.transaction(async (transaction) => {
      await assertProcessLease(event, transaction);
      const process = await ProcessModel.findByPk(row.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (process?.state === 'cancelled') throw new BaseError('process_cancelled');
      await ProcessItemModel.findOrCreate({
        where: { processId: row.id, index },
        defaults: {
          id: randomUUID(),
          processId: row.id,
          index,
          state: issues.length ? 'failed' : 'applied',
          data: { ticketId: id },
          result: { fileId },
          issues,
        },
        transaction,
      });
    });
    await refreshProgress(row.id, event);
  }
  await refreshProgress(row.id, event, true);
}
export async function runProcess(event: DomainEventModel) {
  const row = await ProcessModel.findByPk(event.aggregateId);
  if (!row || !['queued', 'running'].includes(row.state)) return;
  try {
    const user = (await getMe(row.userId)).user;
    authorizeProcess(user, row.input);
    if (row.expiresAt.getTime() <= Date.now()) throw new BaseError('process_expired');
    await sequelize.transaction(async (transaction) => {
      await assertProcessLease(event, transaction);
      const locked = await ProcessModel.findByPk(row.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!locked || locked.state === 'cancelled') return;
      await locked.update({ state: 'running', version: locked.version + 1 }, { transaction });
      await publishProcess(locked, transaction);
    });
    await requestStore.run({ requestId: `process:${row.id}`, user }, async () => {
      if (row.input.kind === 'data.import') {
        if (row.phase === 'validate') await previewImport(row, event);
        else await applyImport(row, event, user);
      } else if (row.input.kind === 'media.batch') await mediaBatch(row, event, user);
      else {
        const result = await exportBuffer(row.input.resource, row.input.format, row.input.query);
        const key = await storeProcessFile(result.buffer, row.input.format);
        let retained = false;
        try {
          retained = await sequelize.transaction(async (transaction) => {
            await assertProcessLease(event, transaction);
            const locked = await ProcessModel.findByPk(row.id, {
              transaction,
              lock: transaction.LOCK.UPDATE,
            });
            if (!locked || locked.state === 'cancelled') return false;
            await locked.update(
              {
                state: 'completed',
                total: result.count,
                processed: result.count,
                succeeded: result.count,
                outputKey: key,
                result: {
                  resourceIds: [],
                  total: result.count,
                  succeeded: result.count,
                  failed: 0,
                  downloadUrl: `/api/processes/${row.id}/download`,
                },
                version: locked.version + 1,
              },
              { transaction },
            );
            await publishProcess(locked, transaction);
            return true;
          });
        } finally {
          if (!retained) await removeProcessFile(key);
        }
      }
    });
  } catch (error) {
    if (
      error instanceof BaseError &&
      ['process_cancelled', 'process_lease_lost'].includes(error.code)
    )
      throw error;
    await sequelize.transaction(async (transaction) => {
      await assertProcessLease(event, transaction);
      const locked = await ProcessModel.findByPk(row.id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!locked || locked.state === 'cancelled') return;
      await locked.update(
        {
          state: 'failed',
          errorCode: error instanceof BaseError ? error.code : 'process_failed',
          version: locked.version + 1,
        },
        { transaction },
      );
      await publishProcess(locked, transaction);
    });
  }
}
