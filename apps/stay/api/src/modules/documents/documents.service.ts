import { createHash, randomBytes } from 'node:crypto';
import { BaseError, Forbidden, InputValidError, NotFound } from '@p4/server-core';
import {
  type ContractDocumentDetail,
  type ContractDocumentSummary,
  DOCUMENT_SCAN_MAX_BYTES,
  DOCUMENT_SIGN_TTL_DAYS,
  type DocumentEvent,
  type DocumentSigner,
  type DocumentStatus,
  documentVerifyPath,
  isIsoDate,
  missingDocumentFields,
  type StayUser,
} from '@stay/shared';
import bcrypt from 'bcryptjs';
import { Op, QueryTypes, type Transaction } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import type { DocumentFileFormat } from '@/sequelize/models/document-file.model.js';
import {
  ContractDocumentModel,
  ContractModel,
  ContractTemplateModel,
  ContractTemplateVersionModel,
  DocumentEventModel,
  DocumentFileModel,
  DocumentSignerModel,
  LandlordProfileModel,
  sequelize,
  TenantModel,
} from '@/sequelize/models/index.js';
import { setAuditChanges } from '@/shared/audit.js';
import { assertVersion, type FormBody } from '@/shared/input.js';
import { contractOccupantsAt } from '../contracts/contracts.resolvers.js';
import { webOrigin } from '../invoices/invoices.share.js';
import { portalReferenceDate } from '../portal/portal.access.js';
import { contractSnapshot, renderTemplate } from './documents.data.js';
import { type EventActor, logDocumentEvent, publishDocumentEvent } from './documents.events.js';
import { sanitizeBody } from './documents.html.js';
import { renderDocumentPdf } from './documents.pdf.js';
import { signatureDataUrl } from './landlord.service.js';
import { landlordUserFor } from './templates.service.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DAY_MS = 86_400_000;

export const sha256Hex = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');

/** `VB-` + 8 random characters (no 0/O/1/I): printed on the PDF, not guessable. */
function newDocumentCode(): string {
  const bytes = randomBytes(8);

  return `VB-${[...bytes].map((byte) => CODE_ALPHABET.charAt(byte % CODE_ALPHABET.length)).join('')}`;
}

/** Web origin for links printed on the PDF (verification page). */
export function webBaseUrl(): string {
  return webOrigin(undefined);
}

const conflict = (code: string, extensions: Record<string, unknown> = {}) =>
  new BaseError(code, 409, code, extensions);

/**
 * `expired` when every required tenant who has not signed passed the 14-day link expiry while
 * the document waits for them (sending again renews the links).
 */
export function effectiveStatus(
  document: ContractDocumentModel,
  signers: readonly DocumentSignerModel[],
  now = new Date(),
): DocumentStatus {
  if (document.status !== 'sent' && document.status !== 'viewed') return document.status;
  const waiting = signers.filter(
    (row) => row.role === 'tenant' && row.required && row.status !== 'signed',
  );

  return waiting.length > 0 && waiting.every((row) => row.expiresAt && row.expiresAt <= now)
    ? 'expired'
    : document.status;
}

/* -------------------------------------------------------------------------- */
/* Access                                                                      */
/* -------------------------------------------------------------------------- */

async function accessibleContract(user: StayUser, contractId: string, action: 'read' | 'update') {
  const contract = await ContractModel.findByPk(contractId);

  if (
    !contract ||
    !canAccessRecord(user, action, 'Contract', {
      buildingId: contract.buildingId,
      contractId: contract.id,
    })
  )
    throw new NotFound('contract_not_found');
  return contract;
}

/** A document of a contract `user` may `action` (404 otherwise); locked inside a transaction. */
export async function accessibleDocument(
  user: StayUser,
  id: string,
  action: 'read' | 'update',
  transaction?: Transaction,
) {
  const document = await ContractDocumentModel.findByPk(id, {
    transaction,
    ...(transaction ? { lock: transaction.LOCK.NO_KEY_UPDATE } : {}),
  });

  if (
    !document ||
    !canAccessRecord(user, action, 'Contract', {
      buildingId: document.buildingId,
      contractId: document.contractId,
    })
  )
    throw new NotFound('document_not_found');
  return document;
}

/* -------------------------------------------------------------------------- */
/* DTOs                                                                        */
/* -------------------------------------------------------------------------- */

function summaryDto(
  row: ContractDocumentModel,
  signers: readonly DocumentSignerModel[],
): ContractDocumentSummary {
  return {
    id: row.id,
    contractId: row.contractId,
    buildingId: row.buildingId,
    kind: row.kind,
    code: row.code,
    title: row.title,
    status: effectiveStatus(row, signers),
    signingOrder: row.signingOrder,
    editedManually: row.editedManually,
    sentAt: row.sentAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  };
}

export function signerDto(row: DocumentSignerModel): DocumentSigner {
  return {
    id: row.id,
    role: row.role,
    tenantId: row.tenantId,
    userId: row.userId,
    name: row.name,
    required: row.required,
    status: row.status,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    lockedUntil:
      row.lockedUntil && row.lockedUntil > new Date() ? row.lockedUntil.toISOString() : null,
    viewedAt: row.viewedAt?.toISOString() ?? null,
    signedAt: row.signedAt?.toISOString() ?? null,
    method: row.signatureMethod,
    rejectReason: row.rejectReason,
  };
}

const SIGNER_ATTRIBUTES = { exclude: ['signatureImage'] as ['signatureImage'] };

export function documentSigners(documentIds: string[], withImages = false) {
  return DocumentSignerModel.findAll({
    where: { documentId: documentIds },
    ...(withImages ? {} : { attributes: SIGNER_ATTRIBUTES }),
    order: [
      ['sortOrder', 'ASC'],
      ['createdAt', 'ASC'],
    ],
  });
}

/** `GET /api/contracts/:id/documents`: newest first. */
export async function listDocuments(
  user: StayUser,
  contractId: string,
): Promise<ContractDocumentSummary[]> {
  const contract = await accessibleContract(user, contractId, 'read');
  const rows = await ContractDocumentModel.findAll({
    where: { contractId: contract.id },
    attributes: { exclude: ['bodyHtml', 'dataSnapshot'] },
    order: [
      ['createdAt', 'DESC'],
      ['id', 'ASC'],
    ],
  });
  const signers = await documentSigners(rows.map((row) => row.id));

  return rows.map((row) =>
    summaryDto(
      row,
      signers.filter((signer) => signer.documentId === row.id),
    ),
  );
}

/** `GET /api/documents/:id` (O-38). */
export async function getDocument(user: StayUser, id: string): Promise<ContractDocumentDetail> {
  const document = await accessibleDocument(user, id, 'read');
  const contract = await ContractModel.findByPk(document.contractId, { rejectOnEmpty: true });
  const [signers, events, version, successor, occupants] = await Promise.all([
    documentSigners([document.id]),
    DocumentEventModel.findAll({
      where: { documentId: document.id },
      order: [
        ['createdAt', 'ASC'],
        ['id', 'ASC'],
      ],
    }),
    document.templateVersionId
      ? ContractTemplateVersionModel.findByPk(document.templateVersionId, {
          attributes: ['id', 'templateId', 'version'],
        })
      : null,
    ContractDocumentModel.findOne({
      where: { supersedesId: document.id, status: { [Op.notIn]: ['cancelled', 'rejected'] } },
      attributes: ['id'],
      order: [['createdAt', 'DESC']],
    }),
    contractOccupantsAt(contract.id, portalReferenceDate(contract)),
  ]);
  const template = version ? await ContractTemplateModel.findByPk(version.templateId) : null;
  const tenants = await TenantModel.findAll({
    where: { id: occupants.map((row) => row.tenantId) },
    attributes: ['id', 'fullName'],
  });

  return {
    ...summaryDto(document, signers),
    templateId: template?.id ?? null,
    templateName: template?.name ?? null,
    templateVersion: version?.version ?? null,
    bodyHtml: document.bodyHtml,
    missing: missingDocumentFields(document.bodyHtml),
    dataSha256: document.dataSha256,
    pdfSha256: document.pdfSha256,
    hasPdf: Boolean(document.pdfFileId),
    hasPaperScan: Boolean(document.paperScanFileId),
    cancelReason: document.cancelReason,
    supersedesId: document.supersedesId,
    supersededById: successor?.id ?? null,
    occupants: occupants.map((row) => ({
      tenantId: row.tenantId,
      name: tenants.find((tenant) => tenant.id === row.tenantId)?.fullName ?? '',
      primary: row.isPrimary,
    })),
    signers: signers.map(signerDto),
    events: events.map(
      (row): DocumentEvent => ({
        id: row.id,
        type: row.type,
        signerId: row.signerId,
        actorName: row.actorName,
        ip: row.ip,
        userAgent: row.userAgent,
        createdAt: row.createdAt.toISOString(),
      }),
    ),
    canOwnerSign: document.landlordUserId === user.id,
  };
}

/* -------------------------------------------------------------------------- */
/* Create / edit                                                               */
/* -------------------------------------------------------------------------- */

export function readCreateDocumentInput(body: FormBody) {
  const templateId = body.text('templateId', 36);

  body.check('templateId', UUID.test(templateId));
  const title = body.optionalText('title', 200) || null;

  body.assertValid();
  return { templateId, title };
}

async function filledBody(
  versionId: string,
  contractId: string,
  landlordUserId: string,
  code: string,
  transaction: Transaction,
) {
  const version = await ContractTemplateVersionModel.findByPk(versionId, { transaction });

  if (!version) throw new NotFound('template_not_found');
  const snapshot = await contractSnapshot(contractId, landlordUserId, code, transaction);

  return { snapshot, bodyHtml: renderTemplate(version.bodyHtml, snapshot) };
}

async function insertDocument(
  user: StayUser,
  contract: ContractModel,
  template: ContractTemplateModel,
  title: string | null,
  supersedesId: string | null,
  actor: EventActor,
  transaction: Transaction,
) {
  if (!template.activeVersionId) throw new NotFound('template_not_found');
  const landlordUserId = await landlordUserFor(user, transaction);
  const code = newDocumentCode();
  const { snapshot, bodyHtml } = await filledBody(
    template.activeVersionId,
    contract.id,
    landlordUserId,
    code,
    transaction,
  );
  const document = await ContractDocumentModel.create(
    {
      buildingId: contract.buildingId,
      contractId: contract.id,
      kind: template.kind,
      templateVersionId: template.activeVersionId,
      landlordUserId,
      code,
      title: title ?? `${template.name} – ${snapshot['phong.ma'] ?? contract.code}`,
      bodyHtml,
      dataSnapshot: snapshot,
      supersedesId,
      createdBy: user.id,
    },
    { transaction },
  );

  await logDocumentEvent(document, 'created', actor, transaction);
  return document;
}

/**
 * `POST /api/contracts/:id/documents` `{ templateId, title? }`: fills the active version of the
 * template with a snapshot of the contract. Missing required data is marked in the body and
 * blocks sending (`missing`); ended/cancelled contracts get no new document.
 */
export async function createDocument(
  user: StayUser,
  contractId: string,
  input: { templateId: string; title: string | null },
  actor: EventActor,
  transaction: Transaction,
): Promise<ContractDocumentDetail> {
  const contract = await accessibleContract(user, contractId, 'update');

  if (contract.status === 'ended' || contract.status === 'cancelled')
    throw conflict('contract_closed');
  const template = await ContractTemplateModel.findByPk(input.templateId, { transaction });

  if (
    !template ||
    !template.active ||
    (template.buildingId && template.buildingId !== contract.buildingId)
  )
    throw new NotFound('template_not_found');
  const document = await insertDocument(
    user,
    contract,
    template,
    input.title,
    null,
    actor,
    transaction,
  );

  setAuditChanges({
    documentId: document.id,
    contractId: contract.id,
    buildingId: contract.buildingId,
    templateVersionId: document.templateVersionId,
    missing: missingDocumentFields(document.bodyHtml).length,
  });
  return getDocument(user, document.id);
}

export function readUpdateDocumentInput(body: FormBody) {
  const regenerate = body.isEmpty('regenerate') ? false : body.boolean('regenerate');
  const bodyHtml = regenerate ? null : body.text('bodyHtml', 400_000);
  const version = body.integer('version', 1);

  body.assertValid();
  return { regenerate, bodyHtml: bodyHtml === null ? null : sanitizeBody(bodyHtml), version };
}

/**
 * `PUT /api/documents/:id` `{ version, bodyHtml }` edits a draft by hand (`editedManually`);
 * `{ version, regenerate: true }` refills it from the template with fresh contract data. Only
 * drafts: once someone signed or it was sent, the body is frozen (409 `document_locked`).
 */
export async function updateDocument(
  user: StayUser,
  id: string,
  input: { regenerate: boolean; bodyHtml: string | null; version: number },
  actor: EventActor,
  transaction: Transaction,
): Promise<ContractDocumentDetail> {
  const document = await accessibleDocument(user, id, 'update', transaction);

  assertVersion(document.version, input.version);
  if (document.status !== 'draft') throw conflict('document_locked');
  if (input.regenerate) {
    if (!document.templateVersionId) throw new NotFound('template_not_found');
    const landlordUserId = await landlordUserFor(user, transaction);
    const { snapshot, bodyHtml } = await filledBody(
      document.templateVersionId,
      document.contractId,
      landlordUserId,
      document.code,
      transaction,
    );

    await document.update(
      { bodyHtml, dataSnapshot: snapshot, landlordUserId, editedManually: false },
      { transaction },
    );
  } else if (input.bodyHtml !== null && input.bodyHtml !== document.bodyHtml) {
    await document.update({ bodyHtml: input.bodyHtml, editedManually: true }, { transaction });
  }
  await logDocumentEvent(document, 'edited', actor, transaction);
  setAuditChanges({
    documentId: document.id,
    contractId: document.contractId,
    regenerate: input.regenerate,
  });
  return getDocument(user, document.id);
}

/* -------------------------------------------------------------------------- */
/* Send / owner sign / complete                                                */
/* -------------------------------------------------------------------------- */

function assertNoMissing(document: ContractDocumentModel) {
  const missing = missingDocumentFields(document.bodyHtml);

  if (missing.length)
    throw new BaseError('document_missing_fields', 422, 'document_missing_fields', { missing });
}

export function readSendInput(body: FormBody) {
  const input = {
    coSignerTenantIds: body.isEmpty('coSignerTenantIds')
      ? []
      : body.strings('coSignerTenantIds', 20, 36),
    version: body.integer('version', 1),
  };

  body.check(
    'coSignerTenantIds',
    input.coSignerTenantIds.every((value) => UUID.test(value)),
  );
  body.assertValid();
  return input;
}

/**
 * `POST /api/documents/:id/send` `{ version, coSignerTenantIds }`: freezes the body (SHA-256),
 * adds the primary occupant (required) and chosen co-occupants (optional) as signers with a
 * 14-day expiry, and moves to `sent`. Sending again (`sent`/`viewed`/expired) renews the expiry
 * of everyone still to sign and may add co-signers. Tenants sign in their portal (T-12).
 */
export async function sendDocument(
  user: StayUser,
  id: string,
  input: { coSignerTenantIds: string[]; version: number },
  actor: EventActor,
  transaction: Transaction,
): Promise<ContractDocumentDetail> {
  const document = await accessibleDocument(user, id, 'update', transaction);

  assertVersion(document.version, input.version);
  if (!['draft', 'owner_signed', 'sent', 'viewed'].includes(document.status))
    throw conflict('document_not_sendable');
  assertNoMissing(document);
  const contract = await ContractModel.findByPk(document.contractId, {
    transaction,
    rejectOnEmpty: true,
  });

  if (contract.status === 'ended' || contract.status === 'cancelled')
    throw conflict('contract_closed');
  const occupants = await contractOccupantsAt(
    contract.id,
    portalReferenceDate(contract),
    transaction,
  );
  const primary = occupants.find((row) => row.isPrimary);

  if (!primary) throw conflict('document_no_primary_tenant');
  const chosen = new Set(input.coSignerTenantIds);

  for (const tenantId of chosen)
    if (!occupants.some((row) => row.tenantId === tenantId))
      throw new InputValidError('input_valid_error', { coSignerTenantIds: ['invalid_field'] });

  const tenants = await TenantModel.findAll({
    where: { id: [primary.tenantId, ...chosen] },
    attributes: ['id', 'fullName'],
    transaction,
  });
  const existing = await DocumentSignerModel.findAll({
    where: { documentId: document.id },
    attributes: SIGNER_ATTRIBUTES,
    transaction,
  });
  const expiresAt = new Date(Date.now() + DOCUMENT_SIGN_TTL_DAYS * DAY_MS);
  const wanted = [
    primary.tenantId,
    ...[...chosen].filter((tenantId) => tenantId !== primary.tenantId),
  ];

  for (const [index, tenantId] of wanted.entries()) {
    const signer = existing.find((row) => row.tenantId === tenantId);

    if (signer) {
      if (signer.status !== 'signed')
        await signer.update({ expiresAt, failedAttempts: 0, lockedUntil: null }, { transaction });
      continue;
    }
    await DocumentSignerModel.create(
      {
        documentId: document.id,
        role: 'tenant',
        tenantId,
        name: tenants.find((tenant) => tenant.id === tenantId)?.fullName ?? '',
        required: tenantId === primary.tenantId,
        sortOrder: index + 1,
        expiresAt,
      },
      { transaction },
    );
  }

  const first = document.status === 'draft';

  await document.update(
    {
      status: document.status === 'viewed' ? 'viewed' : 'sent',
      ...(first ? { dataSha256: sha256Hex(document.bodyHtml) } : {}),
      sentAt: new Date(),
    },
    { transaction },
  );
  await logDocumentEvent(document, 'sent', actor, transaction);
  await publishDocumentEvent('sent', document, transaction);
  setAuditChanges({
    documentId: document.id,
    contractId: document.contractId,
    signers: wanted.length,
    resend: !first && document.status !== 'owner_signed',
  });
  return getDocument(user, document.id);
}

async function assertPassword(userId: string, password: string) {
  const [account] = await sequelize.query<{ password: string | null }>(
    `SELECT password FROM auth_accounts WHERE user_id = :userId AND provider_id = 'credential'`,
    { replacements: { userId }, type: QueryTypes.SELECT },
  );

  if (!account?.password || !(await bcrypt.compare(password, account.password)))
    throw new BaseError('password_invalid', 422, 'password_invalid');
}

/**
 * Generates the final PDF (body, signatures, evidence page), stores it with its SHA-256 in the
 * same transaction and moves to `completed`; a document it replaces becomes `superseded`.
 */
async function completeDocument(
  document: ContractDocumentModel,
  actor: EventActor,
  transaction: Transaction,
) {
  const completedAt = new Date();
  const signers = await DocumentSignerModel.findAll({
    where: { documentId: document.id },
    order: [
      ['sortOrder', 'ASC'],
      ['createdAt', 'ASC'],
    ],
    transaction,
  });
  const pdf = await renderDocumentPdf({
    code: document.code,
    title: document.title,
    bodyHtml: document.bodyHtml,
    dataSha256: document.dataSha256,
    draft: false,
    verifyUrl: `${webBaseUrl()}${documentVerifyPath(document.code)}`,
    completedAt,
    signers: signers.map((row) => ({
      name: row.name,
      role: row.role,
      required: row.required,
      status: row.status,
      signedAt: row.signedAt,
      method: row.signatureMethod,
      signatureDataUrl: signatureDataUrl(row.signatureImage, row.signatureFormat),
      typedName: row.signatureMethod === 'typed' ? row.typedName : null,
      ip: row.ip,
      userAgent: row.userAgent,
      verification: row.verification,
    })),
  });
  const pdfSha256 = sha256Hex(pdf);
  const file = await DocumentFileModel.create(
    {
      buildingId: document.buildingId,
      purpose: 'final_pdf',
      format: 'pdf',
      bytes: pdf.length,
      sha256: pdfSha256,
      content: pdf,
      createdBy: actor.userId ?? null,
    },
    { transaction },
  );

  await document.update(
    { status: 'completed', pdfFileId: file.id, pdfSha256, completedAt },
    { transaction },
  );
  await logDocumentEvent(document, 'completed', actor, transaction);
  await supersedePredecessor(document, actor, transaction);
  await publishDocumentEvent('completed', document, transaction);
}

async function supersedePredecessor(
  document: ContractDocumentModel,
  actor: EventActor,
  transaction: Transaction,
) {
  if (!document.supersedesId) return;
  const previous = await ContractDocumentModel.findByPk(document.supersedesId, {
    transaction,
    lock: transaction.LOCK.NO_KEY_UPDATE,
  });

  if (previous && (previous.status === 'completed' || previous.status === 'completed_paper')) {
    await previous.update({ status: 'superseded' }, { transaction });
    await logDocumentEvent(previous, 'superseded', actor, transaction);
  }
}

/** Whether every required tenant signer signed. */
export function tenantsDone(signers: readonly DocumentSignerModel[]) {
  const tenants = signers.filter((row) => row.role === 'tenant' && row.required);

  return tenants.length > 0 && tenants.every((row) => row.status === 'signed');
}

/** Moves a document whose required tenants all signed: `completed` (owner signed) or waiting. */
export async function afterTenantSigned(
  document: ContractDocumentModel,
  actor: EventActor,
  transaction: Transaction,
) {
  const signers = await DocumentSignerModel.findAll({
    where: { documentId: document.id },
    attributes: SIGNER_ATTRIBUTES,
    transaction,
  });

  if (!tenantsDone(signers)) return;
  const owner = signers.find((row) => row.role === 'owner');

  if (owner?.status === 'signed') await completeDocument(document, actor, transaction);
  else await document.update({ status: 'signed_by_tenant' }, { transaction });
}

export function readOwnerSignInput(body: FormBody) {
  const input = {
    password: body.text('password', 200),
    version: body.integer('version', 1),
  };

  body.assertValid();
  return input;
}

/**
 * `POST /api/documents/:id/owner-sign` `{ password, version }`: the landlord applies the saved
 * signature after confirming the password. On a draft (owner signs first) the body is frozen and
 * the document waits to be sent; after the tenants signed it completes and the PDF is generated.
 */
export async function ownerSign(
  user: StayUser,
  id: string,
  input: { password: string; version: number },
  actor: EventActor,
  transaction: Transaction,
): Promise<ContractDocumentDetail> {
  const document = await accessibleDocument(user, id, 'update', transaction);

  assertVersion(document.version, input.version);
  if (document.landlordUserId !== user.id) throw new Forbidden('document_not_landlord');
  if (document.status !== 'draft' && document.status !== 'signed_by_tenant')
    throw conflict('document_not_signable');
  await assertPassword(user.id, input.password);
  const profile = await LandlordProfileModel.findOne({ where: { userId: user.id }, transaction });

  if (!profile?.signatureImage || !profile.signatureFormat)
    throw new BaseError('landlord_signature_missing', 422, 'landlord_signature_missing');
  if (document.status === 'draft') {
    assertNoMissing(document);
    await document.update(
      {
        dataSha256: sha256Hex(document.bodyHtml),
        signingOrder: 'owner_first',
        status: 'owner_signed',
      },
      { transaction },
    );
  }
  const now = new Date();
  const values = {
    status: 'signed' as const,
    signedAt: now,
    signatureMethod: 'stored' as const,
    signatureImage: profile.signatureImage,
    signatureFormat: profile.signatureFormat,
    signedDataSha256: document.dataSha256,
    verification: 'password',
    ip: actor.ip?.slice(0, 64) ?? null,
    userAgent: actor.userAgent?.slice(0, 255) ?? null,
  };
  const existing = await DocumentSignerModel.findOne({
    where: { documentId: document.id, role: 'owner' },
    transaction,
  });
  const signer = existing
    ? await existing.update(values, { transaction })
    : await DocumentSignerModel.create(
        {
          documentId: document.id,
          role: 'owner',
          userId: user.id,
          name: profile.fullName,
          required: true,
          sortOrder: 0,
          ...values,
        },
        { transaction },
      );

  await logDocumentEvent(document, 'owner_signed', actor, transaction, signer);
  if (document.status === 'signed_by_tenant') await completeDocument(document, actor, transaction);
  else await publishDocumentEvent('signed', document, transaction, signer);
  setAuditChanges({
    documentId: document.id,
    contractId: document.contractId,
    status: document.status,
  });
  return getDocument(user, document.id);
}

/* -------------------------------------------------------------------------- */
/* Cancel / paper / supersede / PDF                                            */
/* -------------------------------------------------------------------------- */

export function readReasonInput(body: FormBody) {
  const input = { reason: body.text('reason', 500), version: body.integer('version', 1) };

  body.assertValid();
  return input;
}

/** `POST /api/documents/:id/cancel`: any unfinished document; signing links stop working. */
export async function cancelDocument(
  user: StayUser,
  id: string,
  input: { reason: string; version: number },
  actor: EventActor,
  transaction: Transaction,
): Promise<ContractDocumentDetail> {
  const document = await accessibleDocument(user, id, 'update', transaction);

  assertVersion(document.version, input.version);
  if (
    ['completed', 'completed_paper', 'superseded', 'cancelled', 'rejected'].includes(
      document.status,
    )
  )
    throw conflict('document_final');
  await DocumentSignerModel.update(
    { expiresAt: new Date() },
    { where: { documentId: document.id, status: { [Op.ne]: 'signed' } }, transaction },
  );
  await document.update({ status: 'cancelled', cancelReason: input.reason }, { transaction });
  await logDocumentEvent(document, 'cancelled', actor, transaction);
  setAuditChanges({ documentId: document.id, contractId: document.contractId });
  return getDocument(user, document.id);
}

/** PDF, PNG or JPEG from its magic bytes. */
function sniffScanFormat(bytes: Buffer): DocumentFileFormat | null {
  if (bytes.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'jpg';
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'png';
  return null;
}

export function readPaperInput(body: FormBody, file: Buffer | undefined) {
  const signedOn = body.text('signedOn', 10);
  const version = Number(body.data.version);

  body.check('signedOn', isIsoDate(signedOn), 'invalid_date');
  body.check('version', Number.isSafeInteger(version) && version > 0);
  const format = file?.length ? sniffScanFormat(file) : null;

  body.check('file', Boolean(file?.length), 'upload_missing');
  if (file?.length) body.check('file', Boolean(format), 'scan_invalid');
  if (file && file.length > DOCUMENT_SCAN_MAX_BYTES) body.invalid('file', 'upload_too_large');
  body.assertValid();
  return { signedOn, version, file: file ?? Buffer.alloc(0), format: format ?? 'pdf' };
}

/**
 * `POST /api/documents/:id/paper` (multipart `file`, `signedOn`, `version`): paper fallback. The
 * scan (PDF/JPG/PNG ≤ 10 MB) is stored privately and the document becomes `completed_paper`.
 */
export async function markPaperSigned(
  user: StayUser,
  id: string,
  input: { signedOn: string; version: number; file: Buffer; format: DocumentFileFormat },
  actor: EventActor,
  transaction: Transaction,
): Promise<ContractDocumentDetail> {
  const document = await accessibleDocument(user, id, 'update', transaction);

  assertVersion(document.version, input.version);
  if (
    ['completed', 'completed_paper', 'superseded', 'cancelled', 'rejected'].includes(
      document.status,
    )
  )
    throw conflict('document_final');
  const scan = await DocumentFileModel.create(
    {
      buildingId: document.buildingId,
      purpose: 'paper_scan',
      format: input.format,
      bytes: input.file.length,
      sha256: sha256Hex(input.file),
      content: input.file,
      createdBy: user.id,
    },
    { transaction },
  );

  await DocumentSignerModel.update(
    { expiresAt: new Date() },
    { where: { documentId: document.id, status: { [Op.ne]: 'signed' } }, transaction },
  );
  await document.update(
    {
      status: 'completed_paper',
      paperScanFileId: scan.id,
      paperSignedOn: input.signedOn,
      completedAt: new Date(),
      dataSha256: document.dataSha256 ?? sha256Hex(document.bodyHtml),
    },
    { transaction },
  );
  await logDocumentEvent(document, 'paper', actor, transaction);
  await supersedePredecessor(document, actor, transaction);
  await publishDocumentEvent('completed', document, transaction);
  setAuditChanges({ documentId: document.id, contractId: document.contractId, bytes: scan.bytes });
  return getDocument(user, document.id);
}

/**
 * `POST /api/documents/:id/supersede`: a new draft from the same template (active version, fresh
 * data) replacing a completed document. The old one becomes `superseded` when the new one
 * completes (online or on paper), so cancelling the replacement keeps it valid.
 */
export async function supersedeDocument(
  user: StayUser,
  id: string,
  actor: EventActor,
  transaction: Transaction,
): Promise<ContractDocumentDetail> {
  const document = await accessibleDocument(user, id, 'update', transaction);

  if (document.status !== 'completed' && document.status !== 'completed_paper')
    throw conflict('document_not_completed');
  const pending = await ContractDocumentModel.count({
    where: { supersedesId: document.id, status: { [Op.notIn]: ['cancelled', 'rejected'] } },
    transaction,
  });

  if (pending) throw conflict('document_replacement_exists');
  const version = document.templateVersionId
    ? await ContractTemplateVersionModel.findByPk(document.templateVersionId, { transaction })
    : null;
  const template = version
    ? await ContractTemplateModel.findByPk(version.templateId, { transaction })
    : null;
  const contract = await ContractModel.findByPk(document.contractId, {
    transaction,
    rejectOnEmpty: true,
  });

  if (!template) throw new NotFound('template_not_found');
  const created = await insertDocument(
    user,
    contract,
    template,
    document.title,
    document.id,
    actor,
    transaction,
  );

  setAuditChanges({ documentId: created.id, supersedesId: document.id, contractId: contract.id });
  return getDocument(user, created.id);
}

/** Bytes of the final PDF, or a "BẢN NHÁP" render of an unfinished document. */
export async function pdfOf(document: ContractDocumentModel): Promise<Buffer> {
  if (document.pdfFileId) {
    const file = await DocumentFileModel.findByPk(document.pdfFileId, { rejectOnEmpty: true });

    return file.content;
  }
  const signers = await documentSigners([document.id], true);

  return renderDocumentPdf({
    code: document.code,
    title: document.title,
    bodyHtml: document.bodyHtml,
    dataSha256: document.dataSha256,
    draft: true,
    verifyUrl: `${webBaseUrl()}${documentVerifyPath(document.code)}`,
    completedAt: null,
    signers: signers.map((row) => ({
      name: row.name,
      role: row.role,
      required: row.required,
      status: row.status,
      signedAt: row.signedAt,
      method: row.signatureMethod,
      signatureDataUrl: signatureDataUrl(row.signatureImage, row.signatureFormat),
      typedName: row.signatureMethod === 'typed' ? row.typedName : null,
      ip: row.ip,
      userAgent: row.userAgent,
      verification: row.verification,
    })),
  });
}

/** `GET /api/documents/:id/pdf`: staff download; final downloads are logged as evidence. */
export async function staffDocumentPdf(user: StayUser, id: string, actor: EventActor) {
  const document = await accessibleDocument(user, id, 'read');
  const bytes = await pdfOf(document);

  if (document.pdfFileId) await logDocumentEvent(document, 'downloaded', actor);
  return { bytes, filename: `${document.code}.pdf` };
}

/** `GET /api/documents/:id/scan`: the paper scan. */
export async function staffDocumentScan(user: StayUser, id: string) {
  const document = await accessibleDocument(user, id, 'read');

  if (!document.paperScanFileId) throw new NotFound('document_not_found');
  const file = await DocumentFileModel.findByPk(document.paperScanFileId, { rejectOnEmpty: true });

  return {
    bytes: file.content,
    format: file.format,
    filename: `${document.code}-scan.${file.format}`,
  };
}
