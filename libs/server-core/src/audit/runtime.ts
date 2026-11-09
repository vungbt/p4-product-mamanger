import { randomUUID } from 'node:crypto';
import type { JsonValue } from '@p4/shared';
import type { Sequelize, Transaction, TransactionOptions } from 'sequelize';
import { requestStore } from '../request-store.js';
import { redact } from '../shared/redact.js';
import { type AuditScope, auditScope } from './context.js';
import { AUDIT_ACTIONS, type AuditInput, type RouteAuditPolicy } from './types.js';

/** One `audit_logs` row as written by `recordAudit`. */
export interface AuditLogRow {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'success' | 'failure';
  changes: JsonValue;
  requestId: string | null;
  reason: string | null;
}

export interface AuditRuntimeOptions {
  /** The app's Sequelize instance; audited transactions are opened on it. */
  sequelize: Sequelize;
  /** Insert one audit row inside `transaction`, e.g. `AuditLogModel.create(row, { transaction })`. */
  writeAuditLog: (row: AuditLogRow, transaction: Transaction) => Promise<unknown>;
}

/** Runs `work` in the current audited transaction or a new one. */
export type AuditedTransaction = <T>(work: (transaction: Transaction) => Promise<T>) => Promise<T>;

function resultId(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const id: unknown = Reflect.get(value, 'id') ?? Reflect.get(value, 'batchId');
  return typeof id === 'string' ? id : undefined;
}

/** Record the business facts of the running audited command instead of the default summary. */
export function setAuditChanges(facts: JsonValue) {
  const scope = auditScope.getStore();
  if (!scope) throw new Error('Audit changes require an audited command.');
  scope.facts = facts;
}

/**
 * Bind the audit helpers to an app's database. Every business write runs in an audited
 * transaction: when the route policy changes data and no explicit audit row was written for its
 * resource type, a summary row is added before commit.
 */
export function createAuditRuntime({ sequelize, writeAuditLog }: AuditRuntimeOptions) {
  async function recordAudit(event: AuditInput, transaction: Transaction): Promise<void> {
    const context = requestStore.getStore();
    const facts =
      event.changes && typeof event.changes === 'object' && !Array.isArray(event.changes)
        ? event.changes
        : event.changes === undefined
          ? {}
          : { value: event.changes };
    await writeAuditLog(
      {
        id: randomUUID(),
        actorId:
          event.actorId !== undefined
            ? event.actorId
            : (requestStore.getStore()?.user?.id ?? requestStore.getStore()?.actorId ?? null),
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        outcome: event.outcome ?? 'success',
        changes: redact({
          ...facts,
          source: event.source ?? context?.source ?? 'system',
          correlationId: context?.correlationId ?? context?.requestId ?? null,
        }),
        requestId: event.requestId ?? requestStore.getStore()?.requestId ?? null,
        reason: event.reason ?? null,
      },
      transaction,
    );
    const scope = auditScope.getStore();
    if (scope?.transaction === transaction) scope.resources.add(event.resourceType);
  }

  async function execute<T>(
    transaction: Transaction,
    work: (transaction: Transaction) => Promise<T>,
    isolationLevel?: TransactionOptions['isolationLevel'],
  ): Promise<T> {
    const parent = auditScope.getStore();
    const scope: AuditScope = {
      transaction,
      resources: new Set(),
      replayed: false,
      isolationLevel: isolationLevel ?? parent?.isolationLevel,
    };
    return auditScope.run(scope, async () => {
      const result = await work(transaction);
      const context = requestStore.getStore();
      const policy = context?.audit;
      if (
        policy &&
        AUDIT_ACTIONS[policy.action].changesData &&
        !scope.resources.has(policy.resourceType) &&
        !scope.replayed
      ) {
        await recordAudit(
          {
            action: `${policy.resourceType}.${policy.action}`,
            resourceType: policy.resourceType,
            resourceId:
              (['create', 'import', 'export'].includes(policy.action)
                ? (resultId(result) ?? policy.resourceId)
                : (policy.resourceId ?? resultId(result))) ??
              context.user?.id ??
              context.requestId,
            changes: scope.facts ?? { action: policy.action, source: context.source ?? 'http' },
          },
          transaction,
        );
      }
      if (parent) {
        for (const resource of scope.resources) parent.resources.add(resource);
        parent.replayed ||= scope.replayed;
      }
      return result;
    });
  }

  function auditedTransaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T>;
  function auditedTransaction<T>(
    options: TransactionOptions,
    work: (transaction: Transaction) => Promise<T>,
  ): Promise<T>;
  async function auditedTransaction<T>(
    optionsOrWork: TransactionOptions | ((transaction: Transaction) => Promise<T>),
    callback?: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    const work = typeof optionsOrWork === 'function' ? optionsOrWork : callback;
    if (!work) throw new Error('Managed transaction callback is required.');
    const current = auditScope.getStore();
    if (current) {
      if (
        typeof optionsOrWork !== 'function' &&
        optionsOrWork.isolationLevel &&
        optionsOrWork.isolationLevel !== (current.isolationLevel ?? 'READ COMMITTED')
      )
        throw new Error('Nested audit command requires a different transaction isolation level.');
      return work(current.transaction);
    }
    const options = typeof optionsOrWork === 'function' ? {} : optionsOrWork;
    return sequelize.transaction(options, (transaction) =>
      execute(transaction, work, options.isolationLevel),
    );
  }

  /** Run `work` as an audited business command outside an HTTP route policy (jobs, auth hooks). */
  function auditedCommand<T>(
    policy: RouteAuditPolicy & { resourceId?: string },
    work: () => Promise<T>,
  ): Promise<T> {
    const context = requestStore.getStore();
    return requestStore.run(
      { requestId: context?.requestId ?? randomUUID(), ...context, audit: policy },
      () => {
        const current = auditScope.getStore();
        return current
          ? execute(current.transaction, () => work())
          : auditedTransaction(() => work());
      },
    );
  }

  /** Reuse a caller's transaction, or open an audited one. */
  function inTransaction<T>(
    transaction: Transaction | undefined,
    work: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    return transaction ? work(transaction) : auditedTransaction(work);
  }

  return { auditedTransaction, auditedCommand, inTransaction, recordAudit };
}
