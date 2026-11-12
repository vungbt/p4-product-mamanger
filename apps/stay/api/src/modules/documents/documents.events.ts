import type { DocumentEventType } from '@stay/shared';
import type { Transaction } from 'sequelize';
import {
  type ContractDocumentModel,
  DocumentEventModel,
  type DocumentSignerModel,
} from '@/sequelize/models/index.js';
import { enqueueEvent } from '@/shared/persistence.js';

/** Who did it and from where (evidence page): staff user or a portal signer. */
export interface EventActor {
  userId?: string | null;
  name?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

/** Document lifecycle events other modules may react to (notifications, reminders). */
export const DOCUMENT_DOMAIN_EVENTS = {
  sent: 'contract_document.sent',
  signed: 'contract_document.signed',
  rejected: 'contract_document.rejected',
  completed: 'contract_document.completed',
} as const;
export type DocumentDomainEvent = keyof typeof DOCUMENT_DOMAIN_EVENTS;

/**
 * Publishes a document lifecycle event through the transactional outbox (`domain_events`): it
 * commits with the change and is delivered after commit, so notifications (ST-26/T-10) can
 * subscribe without any provider call inside the transaction. Payload: ids and status only.
 */
export async function publishDocumentEvent(
  type: DocumentDomainEvent,
  document: ContractDocumentModel,
  transaction: Transaction,
  signer?: DocumentSignerModel,
) {
  await enqueueEvent(
    {
      type: DOCUMENT_DOMAIN_EVENTS[type],
      aggregateType: 'contract_document',
      aggregateId: document.id,
      payload: {
        documentId: document.id,
        buildingId: document.buildingId,
        contractId: document.contractId,
        kind: document.kind,
        status: document.status,
        ...(signer
          ? { signerId: signer.id, signerRole: signer.role, tenantId: signer.tenantId }
          : {}),
      },
    },
    transaction,
  );
}

/** Appends one row to the evidence log (append-only table). */
export async function logDocumentEvent(
  document: ContractDocumentModel,
  type: DocumentEventType,
  actor: EventActor,
  transaction?: Transaction,
  signer?: DocumentSignerModel,
) {
  await DocumentEventModel.create(
    {
      documentId: document.id,
      signerId: signer?.id ?? null,
      type,
      actorUserId: actor.userId ?? null,
      actorName: actor.name?.slice(0, 120) ?? null,
      ip: actor.ip?.slice(0, 64) ?? null,
      userAgent: actor.userAgent?.slice(0, 255) ?? null,
      dataSha256: document.dataSha256,
    },
    { transaction },
  );
}
