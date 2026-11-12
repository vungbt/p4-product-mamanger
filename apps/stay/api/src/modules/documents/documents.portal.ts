import { BaseError, NotFound } from '@p4/server-core';
import {
  DOCUMENT_SIGN_LOCK_MINUTES,
  DOCUMENT_SIGN_MAX_FAILED_ATTEMPTS,
  normalizePersonName,
  type PortalDocument,
  type PortalDocumentSummary,
} from '@stay/shared';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import {
  ContractDocumentModel,
  DocumentFileModel,
  type DocumentSignerModel,
  sequelize,
  TenantModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit, setAuditChanges } from '@/shared/audit.js';
import type { FormBody } from '@/shared/input.js';
import type { PortalPrincipal } from '@/types/express.js';
import { phoneLast4, sameSecret } from '../portal/portal.access.js';
import { type EventActor, logDocumentEvent, publishDocumentEvent } from './documents.events.js';
import { afterTenantSigned, documentSigners, effectiveStatus } from './documents.service.js';
import { parseSignatureImage, type SignatureImage } from './landlord.service.js';

/** Documents the portal shows: sent at least once and not cancelled. */
const PORTAL_STATUSES = [
  'sent',
  'viewed',
  'signed_by_tenant',
  'completed',
  'rejected',
  'completed_paper',
  'superseded',
] as const;

function summaryOf(
  row: ContractDocumentModel,
  signers: readonly DocumentSignerModel[],
  portal: PortalPrincipal,
): PortalDocumentSummary {
  const mine = signers.find((signer) => signer.tenantId === portal.tenantId);
  const status = effectiveStatus(row, signers);

  return {
    id: row.id,
    kind: row.kind,
    code: row.code,
    title: row.title,
    status,
    myStatus: mine?.status ?? null,
    awaitingMe:
      (status === 'sent' || status === 'viewed') &&
      Boolean(mine && mine.status !== 'signed' && mine.status !== 'rejected'),
    sentAt: row.sentAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

/** `GET /api/portal/documents` (T-13): waiting for me first, then newest. */
export async function portalDocuments(portal: PortalPrincipal): Promise<PortalDocumentSummary[]> {
  const rows = await ContractDocumentModel.findAll({
    where: { contractId: portal.contractId, status: { [Op.in]: [...PORTAL_STATUSES] } },
    attributes: { exclude: ['bodyHtml', 'dataSnapshot'] },
    order: [['createdAt', 'DESC']],
  });
  const signers = await documentSigners(rows.map((row) => row.id));
  const items = rows.map((row) =>
    summaryOf(
      row,
      signers.filter((signer) => signer.documentId === row.id),
      portal,
    ),
  );

  return [...items.filter((item) => item.awaitingMe), ...items.filter((item) => !item.awaitingMe)];
}

/** A visible document of the portal's contract, never another contract's (404). */
async function portalDocumentRow(portal: PortalPrincipal, id: string, transaction?: Transaction) {
  const row = await ContractDocumentModel.findOne({
    where: { id, contractId: portal.contractId, status: { [Op.in]: [...PORTAL_STATUSES] } },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.NO_KEY_UPDATE } : {}),
  });

  if (!row) throw new NotFound('document_not_found');
  return row;
}

async function portalDocumentDto(portal: PortalPrincipal, row: ContractDocumentModel) {
  const signers = await documentSigners([row.id]);
  const mine = signers.find((signer) => signer.tenantId === portal.tenantId);

  return {
    ...summaryOf(row, signers, portal),
    // CCCD of the parties is in the body: only signers read it (st-30.md "Bảo mật").
    bodyHtml: mine ? row.bodyHtml : null,
    myName: mine?.name ?? null,
    expiresAt: mine?.expiresAt?.toISOString() ?? null,
    lockedUntil:
      mine?.lockedUntil && mine.lockedUntil > new Date() ? mine.lockedUntil.toISOString() : null,
    hasPdf: Boolean(row.pdfFileId) && Boolean(mine),
    signers: signers.map((signer) => ({
      name: signer.name,
      role: signer.role,
      status: signer.status,
      signedAt: signer.signedAt?.toISOString() ?? null,
    })),
  } satisfies PortalDocument;
}

/**
 * `GET /api/portal/documents/:id` (T-12). The first open by a signer while signing is open
 * records `viewed` (evidence log), outside the request: reads never write audit rows.
 */
export async function portalDocument(
  portal: PortalPrincipal,
  id: string,
  actor: EventActor,
): Promise<PortalDocument> {
  const row = await portalDocumentRow(portal, id);
  const signers = await documentSigners([row.id]);
  const mine = signers.find((signer) => signer.tenantId === portal.tenantId);
  const open = effectiveStatus(row, signers);

  if (mine && mine.status === 'pending' && (open === 'sent' || open === 'viewed')) {
    await sequelize.transaction(async (transaction) => {
      const [updated] = await sequelize.query(
        `UPDATE document_signers SET status = 'viewed', viewed_at = now(), updated_at = now()
          WHERE id = :id AND status = 'pending' RETURNING id`,
        { replacements: { id: mine.id }, type: QueryTypes.SELECT, transaction },
      );

      if (!updated) return;
      await sequelize.query(
        `UPDATE contract_documents SET status = 'viewed', updated_at = now(), version = version + 1
          WHERE id = :id AND status = 'sent'`,
        { replacements: { id: row.id }, transaction },
      );
      await logDocumentEvent(row, 'viewed', { ...actor, name: mine.name }, transaction, mine);
    });
    await row.reload();
  }
  return portalDocumentDto(portal, row);
}

function signingLocked(until: Date): never {
  const seconds = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 1000));

  throw new BaseError('document_sign_locked', 429, 'document_sign_locked', {
    retryAfterSeconds: seconds,
  });
}

/** Counts a wrong phone/name attempt in its own transaction (it survives the failed request). */
async function recordFailedAttempt(
  signer: DocumentSignerModel,
  row: ContractDocumentModel,
  actor: EventActor,
) {
  return sequelize.transaction(async (transaction) => {
    const [result] = await sequelize.query<{ lockedUntil: Date | null }>(
      `UPDATE document_signers SET
         failed_attempts = CASE WHEN failed_attempts + 1 >= :max THEN 0 ELSE failed_attempts + 1 END,
         locked_until = CASE WHEN failed_attempts + 1 >= :max
           THEN now() + (:minutes * INTERVAL '1 minute') ELSE locked_until END,
         updated_at = now()
       WHERE id = :id
       RETURNING locked_until AS "lockedUntil"`,
      {
        replacements: {
          id: signer.id,
          max: DOCUMENT_SIGN_MAX_FAILED_ATTEMPTS,
          minutes: DOCUMENT_SIGN_LOCK_MINUTES,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    );

    await logDocumentEvent(
      row,
      'verification_failed',
      { ...actor, name: signer.name },
      transaction,
      signer,
    );
    await recordAudit(
      {
        actorId: null,
        action: 'contract_document.verification_failed',
        resourceType: 'contract_document',
        resourceId: row.id,
        outcome: 'failure',
        changes: { buildingId: row.buildingId, contractId: row.contractId, signerId: signer.id },
      },
      transaction,
    );
    return result?.lockedUntil && result.lockedUntil > new Date() ? result.lockedUntil : null;
  });
}

export interface PortalSignInput {
  fullName: string;
  phoneLast4: string;
  agree: boolean;
  method: 'drawn' | 'typed';
  signature: SignatureImage | null;
}

export function readPortalSignInput(body: FormBody): PortalSignInput {
  const fullName = body.text('fullName', 120);
  const digits = body.text('phoneLast4', 4);
  const agree = body.boolean('agree');
  const method = body.enum('method', ['drawn', 'typed'] as const);
  const raw = body.data.signatureImage;
  const signature = method === 'drawn' && typeof raw === 'string' ? parseSignatureImage(raw) : null;

  body.check('phoneLast4', /^[0-9]{4}$/.test(digits), 'portal_phone_last4');
  body.check('agree', agree, 'document_agree_required');
  if (method === 'drawn') body.check('signatureImage', Boolean(signature), 'signature_invalid');
  body.assertValid();
  return { fullName, phoneLast4: digits, agree, method, signature };
}

/**
 * `POST /api/portal/documents/:id/sign` (T-12): the portal occupant signs after agreeing, typing
 * the full name as in the profile and the last 4 phone digits again (5 wrong → 15-minute lock),
 * with a drawn signature or the typed name. Records time, IP, device and the body hash; when every
 * required tenant signed the document waits for the owner, or completes (PDF) if the owner
 * already signed.
 */
export async function signPortalDocument(
  portal: PortalPrincipal,
  id: string,
  input: PortalSignInput,
  actor: EventActor,
): Promise<PortalDocument> {
  const failure = await auditedTransaction(async (transaction) => {
    const row = await portalDocumentRow(portal, id, transaction);
    const signers = await documentSigners([row.id]);
    const signer = signers.find((item) => item.tenantId === portal.tenantId);
    const status = effectiveStatus(row, signers);

    if (!signer) throw new NotFound('document_not_found');
    if (signer.status === 'signed')
      throw new BaseError('document_already_signed', 409, 'document_already_signed');
    if (status === 'expired')
      throw new BaseError('document_sign_expired', 410, 'document_sign_expired');
    if (status !== 'sent' && status !== 'viewed' && status !== 'signed_by_tenant')
      throw new BaseError('document_not_signable', 409, 'document_not_signable');
    if (signer.status === 'rejected' || (signer.expiresAt && signer.expiresAt <= new Date()))
      throw new BaseError('document_sign_expired', 410, 'document_sign_expired');
    if (signer.lockedUntil && signer.lockedUntil > new Date()) signingLocked(signer.lockedUntil);

    const tenant = await TenantModel.findByPk(portal.tenantId, {
      attributes: ['id', 'fullName', 'phone'],
      transaction,
    });
    const nameOk =
      Boolean(tenant) &&
      normalizePersonName(tenant?.fullName ?? '') === normalizePersonName(input.fullName);
    const phoneOk =
      Boolean(tenant) && sameSecret(phoneLast4(tenant?.phone ?? ''), input.phoneLast4);

    // Counted outside this transaction (it rolls back with the error).
    if (!nameOk || !phoneOk) return { signer, row, nameOk };

    const typedName = tenant?.fullName ?? input.fullName;

    await signer.update(
      {
        status: 'signed',
        signedAt: new Date(),
        signatureMethod: input.method,
        signatureImage: input.signature?.bytes ?? null,
        signatureFormat: input.signature?.format ?? null,
        typedName,
        signedDataSha256: row.dataSha256,
        verification: 'portal_phone_last4',
        failedAttempts: 0,
        lockedUntil: null,
        ip: actor.ip?.slice(0, 64) ?? null,
        userAgent: actor.userAgent?.slice(0, 255) ?? null,
      },
      { transaction },
    );
    await logDocumentEvent(row, 'signed', { ...actor, name: signer.name }, transaction, signer);
    await publishDocumentEvent('signed', row, transaction, signer);
    await afterTenantSigned(row, { ...actor, name: signer.name }, transaction);
    setAuditChanges({
      buildingId: row.buildingId,
      contractId: row.contractId,
      documentId: row.id,
      signerId: signer.id,
      linkId: portal.linkId,
      method: input.method,
    });
    return null;
  });

  if (failure) {
    const lockedUntil = await recordFailedAttempt(failure.signer, failure.row, actor);

    if (lockedUntil) signingLocked(lockedUntil);
    throw new BaseError(
      failure.nameOk ? 'document_sign_phone_mismatch' : 'document_sign_name_mismatch',
      422,
      failure.nameOk ? 'document_sign_phone_mismatch' : 'document_sign_name_mismatch',
    );
  }
  return portalDocumentDto(portal, await portalDocumentRow(portal, id));
}

export function readRejectInput(body: FormBody) {
  const reason = body.text('reason', 500);

  body.assertValid();
  return reason;
}

/** `POST /api/portal/documents/:id/reject` `{ reason }`: the whole document becomes `rejected`. */
export async function rejectPortalDocument(
  portal: PortalPrincipal,
  id: string,
  reason: string,
  actor: EventActor,
): Promise<PortalDocument> {
  await auditedTransaction(async (transaction) => {
    const row = await portalDocumentRow(portal, id, transaction);
    const signers = await documentSigners([row.id]);
    const signer = signers.find((item) => item.tenantId === portal.tenantId);
    const status = effectiveStatus(row, signers);

    if (!signer || signer.status === 'signed' || signer.status === 'rejected')
      throw new BaseError('document_not_signable', 409, 'document_not_signable');
    if (status !== 'sent' && status !== 'viewed' && status !== 'signed_by_tenant')
      throw new BaseError('document_not_signable', 409, 'document_not_signable');
    await signer.update({ status: 'rejected', rejectReason: reason }, { transaction });
    await row.update({ status: 'rejected' }, { transaction });
    await logDocumentEvent(row, 'rejected', { ...actor, name: signer.name }, transaction, signer);
    await publishDocumentEvent('rejected', row, transaction, signer);
    setAuditChanges({
      buildingId: row.buildingId,
      contractId: row.contractId,
      documentId: row.id,
      signerId: signer.id,
      linkId: portal.linkId,
    });
  });
  return portalDocumentDto(portal, await portalDocumentRow(portal, id));
}

/** `GET /api/portal/documents/:id/pdf`: the final PDF, for the document's signers. */
export async function portalDocumentPdf(portal: PortalPrincipal, id: string, actor: EventActor) {
  const row = await portalDocumentRow(portal, id);
  const signers = await documentSigners([row.id]);
  const mine = signers.find((signer) => signer.tenantId === portal.tenantId);

  if (!mine || !row.pdfFileId) throw new NotFound('document_not_found');
  const file = await DocumentFileModel.findByPk(row.pdfFileId, { rejectOnEmpty: true });

  await logDocumentEvent(row, 'downloaded', { ...actor, name: mine.name }, undefined, mine);
  return { bytes: file.content, filename: `${row.code}.pdf` };
}
