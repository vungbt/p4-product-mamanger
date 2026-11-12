import { randomUUID } from 'node:crypto';
import { BaseError, Forbidden, InputValidError, NotFound, selectFields } from '@p4/server-core';
import {
  type PortalUploadPurpose,
  STAY_UPLOAD_MAX_BYTES,
  STAY_UPLOAD_MIME_TYPES,
  type StaffUploadPurpose,
  type StayUpload,
  type StayUploadPurpose,
  type StayUploadTicket,
  type StayUser,
} from '@stay/shared';
import type { Transaction } from 'sequelize';
import { env } from '@/configs/env.js';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import { BuildingModel, FileModel, UploadTicketModel } from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import type { PortalPrincipal } from '@/types/express.js';
import {
  readStubObject,
  requireStorage,
  sniffImageFormat,
  storageProvider,
  VIEW_URL_TTL_SECONDS,
  verifyStubSignature,
  writeStubObject,
} from './uploads.storage.js';

/** A ticket can be used for 10 minutes. */
const TICKET_TTL_MS = 600_000;

function uploadDto(row: UploadTicketModel): StayUpload {
  return {
    ...selectFields(row, ['id', 'purpose', 'buildingId', 'status', 'fileId', 'maxBytes']),
    expiresAt: row.expiresAt.toISOString(),
  };
}

/** Who holds a ticket/file: a staff user, or a tenant portal link (ST-25). */
type UploadOwner =
  | { ownerId: string; portalLinkId: null }
  | { ownerId: null; portalLinkId: string };

const staffOwner = (user: StayUser): UploadOwner => ({ ownerId: user.id, portalLinkId: null });
const portalOwner = (portal: PortalPrincipal): UploadOwner => ({
  ownerId: null,
  portalLinkId: portal.linkId,
});

/** Whether `user` may upload files for `purpose` in `buildingId`. */
function canUpload(user: StayUser, purpose: StaffUploadPurpose, buildingId: string) {
  switch (purpose) {
    case 'maintenance_photo':
      return (
        canAccessRecord(user, 'create', 'Maintenance', { buildingId }) ||
        canAccessRecord(user, 'update', 'Maintenance', { buildingId })
      );
    case 'expense_receipt':
      return canAccessRecord(user, 'manage', 'Expense', { buildingId });
    case 'contract_meter':
      return (
        canAccessRecord(user, 'create', 'Contract', { buildingId }) ||
        canAccessRecord(user, 'update', 'Contract', { buildingId })
      );
    case 'tenant_document':
      return (
        canAccessRecord(user, 'create', 'Tenant', { buildingId }) ||
        canAccessRecord(user, 'update', 'Tenant', { buildingId })
      );
  }
}

/** `POST /api/uploads`: a signed ticket to upload one private image. */
export async function createUpload(
  user: StayUser,
  purpose: StaffUploadPurpose,
  buildingId: string,
): Promise<StayUploadTicket> {
  if (!canUpload(user, purpose, buildingId)) {
    if (purpose === 'expense_receipt') throw new Forbidden();
    throw new NotFound('building_not_found');
  }

  return issueTicket(staffOwner(user), purpose, buildingId);
}

/**
 * `POST /api/portal/uploads` (ST-25): a ticket for a receipt or maintenance photo in the
 * building of the portal session's contract, owned by the portal link (no staff user).
 */
export async function createPortalUpload(
  portal: PortalPrincipal,
  purpose: PortalUploadPurpose,
): Promise<StayUploadTicket> {
  return issueTicket(portalOwner(portal), purpose, portal.buildingId);
}

async function issueTicket(
  owner: UploadOwner,
  purpose: StayUploadPurpose,
  buildingId: string,
): Promise<StayUploadTicket> {
  const building = await BuildingModel.findByPk(buildingId);

  if (!building) throw new NotFound('building_not_found');
  if (building.archivedAt) throw new BaseError('building_archived', 409, 'building_archived');

  const storage = requireStorage();
  const id = randomUUID();
  const row = await UploadTicketModel.create({
    id,
    ...owner,
    buildingId,
    purpose,
    provider: storage.name,
    storageId: `${env.cloudinary.folder}/private/${buildingId}/${id}`,
    maxBytes: STAY_UPLOAD_MAX_BYTES,
    expiresAt: new Date(Date.now() + TICKET_TTL_MS),
  });

  return {
    ...uploadDto(row),
    uploadUrl: storage.signUpload(row),
    allowedMimeTypes: [...STAY_UPLOAD_MIME_TYPES],
  };
}

async function ownTicket(owner: UploadOwner, id: string, transaction?: Transaction) {
  const row = await UploadTicketModel.findOne({
    where: owner.ownerId
      ? { id, ownerId: owner.ownerId }
      : { id, portalLinkId: owner.portalLinkId },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (!row) throw new NotFound();
  return row;
}

export async function getUpload(user: StayUser, id: string): Promise<StayUpload> {
  return uploadDto(await ownTicket(staffOwner(user), id));
}

/**
 * `POST /api/uploads/:id/complete`: checks with the provider that a supported image within the
 * size limit was stored, then records the private file. Repeating it returns the same file.
 */
export async function completeUpload(user: StayUser, id: string): Promise<StayUpload> {
  return completeTicket(staffOwner(user), id);
}

/** `POST /api/portal/uploads/:id/complete`: the same check for a ticket of the portal link. */
export async function completePortalUpload(
  portal: PortalPrincipal,
  id: string,
): Promise<StayUpload> {
  return completeTicket(portalOwner(portal), id);
}

async function completeTicket(owner: UploadOwner, id: string): Promise<StayUpload> {
  return auditedTransaction(async (transaction) => {
    const row = await ownTicket(owner, id, transaction);

    if (row.status === 'completed') return uploadDto(row);
    if (row.expiresAt.getTime() <= Date.now())
      throw new BaseError('upload_ticket_expired', 409, 'upload_ticket_expired');

    const storage = requireStorage();

    if (storage.name !== row.provider)
      throw new BaseError('upload_ticket_expired', 409, 'upload_ticket_expired');

    const stored = await storage.inspect(row.storageId);

    if (!stored) throw new InputValidError('upload_missing');
    if (stored.bytes > row.maxBytes) throw new InputValidError('upload_too_large');

    const file = await FileModel.create(
      {
        provider: row.provider,
        storageId: row.storageId,
        format: stored.format,
        bytes: stored.bytes,
        width: stored.width,
        height: stored.height,
        purpose: row.purpose,
        ownerId: owner.ownerId,
        portalLinkId: owner.portalLinkId,
        buildingId: row.buildingId,
      },
      { transaction },
    );

    await row.update({ status: 'completed', fileId: file.id }, { transaction });
    // Facts only: never the storage id or a URL.
    await recordAudit(
      {
        action: 'upload.complete',
        resourceType: 'upload',
        resourceId: row.id,
        changes: {
          fileId: file.id,
          purpose: row.purpose,
          bytes: stored.bytes,
          ...(owner.portalLinkId ? { portalLinkId: owner.portalLinkId } : {}),
        },
      },
      transaction,
    );
    return uploadDto(row);
  });
}

/**
 * A completed private file `user` uploaded for `purpose` in `buildingId`, ready to attach;
 * `null` for anything else (someone else's upload, another building or purpose).
 */
export async function attachableFile(
  user: StayUser,
  fileId: string,
  purpose: StayUploadPurpose,
  buildingId: string,
  transaction: Transaction,
): Promise<FileModel | null> {
  const file = await FileModel.findByPk(fileId, { transaction });

  return file &&
    file.ownerId === user.id &&
    file.purpose === purpose &&
    file.buildingId === buildingId &&
    file.private
    ? file
    : null;
}

/**
 * A completed private file the portal link uploaded for `purpose`, ready to attach to a claim
 * or a maintenance report; `null` otherwise.
 */
export async function attachablePortalFile(
  portal: PortalPrincipal,
  fileId: string,
  purpose: PortalUploadPurpose,
  transaction: Transaction,
): Promise<FileModel | null> {
  const file = await FileModel.findByPk(fileId, { transaction });

  return file &&
    file.portalLinkId === portal.linkId &&
    file.purpose === purpose &&
    file.buildingId === portal.buildingId &&
    file.private
    ? file
    : null;
}

/** A signed, short-lived URL of a private file; `null` when its storage is not configured here. */
export function signedFileUrl(file: FileModel): { url: string; expiresAt: string } | null {
  const storage = storageProvider();

  if (!storage || storage.name !== file.provider) return null;

  const expiresAt = new Date(Date.now() + VIEW_URL_TTL_SECONDS * 1000);

  return { url: storage.viewUrl(file, expiresAt), expiresAt: expiresAt.toISOString() };
}

/** `POST /api/uploads/:id/stub` (stub storage only): the browser's direct upload. */
export async function storeStubUpload(
  id: string,
  query: { expires?: string; signature?: string },
  bytes: Buffer | undefined,
): Promise<{ id: string; bytes: number }> {
  if (storageProvider()?.name !== 'stub') throw new NotFound();
  if (!verifyStubSignature('upload', id, query.expires, query.signature)) throw new Forbidden();

  const row = await UploadTicketModel.findByPk(id);

  if (row?.status !== 'pending' || row.expiresAt.getTime() <= Date.now()) throw new Forbidden();
  if (!bytes?.length) throw new InputValidError('upload_missing');
  if (bytes.length > row.maxBytes) throw new InputValidError('upload_too_large');
  if (!sniffImageFormat(bytes)) throw new InputValidError('upload_invalid_image');

  await writeStubObject(row.storageId, bytes);
  return { id, bytes: bytes.length };
}

/** `GET /api/files/:id/stub` (stub storage only): a private image behind its signed URL. */
export async function readStubFile(
  id: string,
  query: { expires?: string; signature?: string },
): Promise<{ bytes: Buffer; format: FileModel['format'] }> {
  if (storageProvider()?.name !== 'stub') throw new NotFound();
  if (!verifyStubSignature('view', id, query.expires, query.signature)) throw new Forbidden();

  const file = await FileModel.findByPk(id);

  if (file?.provider !== 'stub') throw new NotFound();
  return { bytes: await readStubObject(file.storageId), format: file.format };
}
