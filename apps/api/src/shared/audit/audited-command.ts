import { randomUUID } from 'node:crypto';
import type { JsonValue } from '@p4/shared';
import type { Transaction, TransactionOptions } from 'sequelize';
import { sequelize } from '@/sequelize/index.js';
import { requestStore } from '@/shared/request-store.js';
import { type AuditScope, auditScope } from './context.js';
import { recordAudit } from './record.js';
import { AUDIT_ACTIONS, type RouteAuditPolicy } from './types.js';

function resultId(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const id: unknown = Reflect.get(value, 'id') ?? Reflect.get(value, 'batchId');
  return typeof id === 'string' ? id : undefined;
}

export function auditedTransaction<T>(work: (transaction: Transaction) => Promise<T>): Promise<T>;
export function auditedTransaction<T>(
  options: TransactionOptions,
  work: (transaction: Transaction) => Promise<T>,
): Promise<T>;
export async function auditedTransaction<T>(
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

export function setAuditChanges(facts: JsonValue) {
  const scope = auditScope.getStore();
  if (!scope) throw new Error('Audit changes require an audited command.');
  scope.facts = facts;
}

export function auditedCommand<T>(
  policy: RouteAuditPolicy & { resourceId?: string },
  work: () => Promise<T>,
) {
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
