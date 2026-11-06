import { randomUUID } from 'node:crypto';
import type { Transaction } from 'sequelize';
import { AuditLogModel } from '@/sequelize/models/index.js';
import { requestStore } from '@/shared/request-store.js';
import { auditScope } from './context.js';
import { redact } from './redact.js';
import type { AuditInput } from './types.js';

export async function recordAudit(event: AuditInput, transaction: Transaction) {
  const context = requestStore.getStore();
  const facts =
    event.changes && typeof event.changes === 'object' && !Array.isArray(event.changes)
      ? event.changes
      : event.changes === undefined
        ? {}
        : { value: event.changes };
  const row = await AuditLogModel.create(
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
    { transaction },
  );
  const scope = auditScope.getStore();
  if (scope?.transaction === transaction) scope.resources.add(event.resourceType);
  return row;
}
