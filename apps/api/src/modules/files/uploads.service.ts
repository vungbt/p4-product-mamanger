import { randomUUID } from 'node:crypto';
import { BaseError, Forbidden, InputValidError, NotFound } from '@p4/server-core';
import type { UploadPurpose, UploadTicket, User } from '@p4/shared';
import { env } from '@/configs/env.js';
import { hasAccess } from '@/middlewares/ability.middleware.js';
import { FileModel, UploadTicketModel } from '@/sequelize/models/index.js';
import { auditedTransaction, recordAudit } from '@/shared/audit/audited-command.js';
import { selectFields } from '@/utils/select-fields.js';
import * as provider from './cloudinary.service.js';

export function uploadDto(row: UploadTicketModel): UploadTicket {
  return {
    ...selectFields(row, [
      'id',
      'purpose',
      'resourceId',
      'status',
      'private',
      'fileId',
      'maxBytes',
    ]),
    expiresAt: row.expiresAt.toISOString(),
  };
}

export async function createUpload(user: User, purpose: UploadPurpose, resourceId: string | null) {
  return auditedTransaction(async () => {
    if (purpose === 'product' && !hasAccess(user, 'write', 'Catalog')) throw new Forbidden();
    if (purpose === 'blog' && !hasAccess(user, 'write', 'Content')) throw new Forbidden();
    const id = randomUUID();
    const storageId = `${env.cloudinary.tempFolder}/${user.id}/${id}`;
    const privateAsset = purpose === 'return' || purpose === 'support';
    const signed = provider.signUploadUrl(undefined, {
      publicId: storageId,
      private: privateAsset,
    });
    const row = await UploadTicketModel.create({
      id,
      ownerId: user.id,
      purpose,
      resourceId,
      storageId,
      status: 'pending',
      private: privateAsset,
      maxBytes: purpose === 'avatar' ? 2_097_152 : 10_485_760,
      expiresAt: new Date(Date.now() + 600_000),
      fileId: null,
    });
    return {
      ...uploadDto(row),
      ...signed,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    };
  });
}

export function verifyUploadedImage(
  resource: Record<string, unknown>,
  ticket: { storageId: string; private: boolean; maxBytes: number },
) {
  if (
    resource.public_id !== ticket.storageId ||
    resource.resource_type !== 'image' ||
    resource.type !== (ticket.private ? 'authenticated' : 'upload')
  )
    throw new InputValidError('upload_resource_mismatch');
  const bytes = resource.bytes;
  const width = resource.width;
  const height = resource.height;
  const format = resource.format;
  const url = resource.secure_url;
  if (
    typeof bytes !== 'number' ||
    bytes <= 0 ||
    bytes > ticket.maxBytes ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    width < 1 ||
    height < 1 ||
    width * height > 40_000_000 ||
    typeof format !== 'string' ||
    !['jpg', 'jpeg', 'png', 'webp'].includes(format) ||
    typeof url !== 'string' ||
    !url.startsWith('https://')
  )
    throw new InputValidError('upload_invalid_image');
  return { bytes, width, height, format, url };
}

export async function completeUpload(userId: string, ticketId: string) {
  return auditedTransaction(async (transaction) => {
    const row = await UploadTicketModel.findOne({
      where: { id: ticketId, ownerId: userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new NotFound();
    if (row.status === 'completed' && row.fileId) return uploadDto(row);
    if (row.status !== 'pending' || row.expiresAt.getTime() <= Date.now())
      throw new BaseError('upload_ticket_expired', 409, 'upload_ticket_expired');
    const resource: Record<string, unknown> = await provider.getResourceInfo(
      row.storageId,
      row.private,
    );
    const metadata = verifyUploadedImage(resource, row);
    const file = await FileModel.create(
      {
        storageId: row.storageId,
        provider: 'cloudinary',
        url: row.private ? null : metadata.url,
        metadata: {
          ...metadata,
          url: undefined,
          ownerId: userId,
          purpose: row.purpose,
          private: row.private,
          resourceId: row.resourceId,
        },
      },
      { transaction },
    );
    await row.update({ status: 'completed', fileId: file.id }, { transaction });
    await recordAudit(
      {
        actorId: userId,
        action: 'media.completed',
        resourceType: 'file',
        resourceId: file.id,
        changes: { purpose: row.purpose, bytes: metadata.bytes },
      },
      transaction,
    );
    return uploadDto(row);
  });
}

export async function ownedFile(user: User, id: string) {
  const file = await FileModel.findByPk(id);
  if (!file) throw new NotFound();
  const ticket = await UploadTicketModel.findOne({ where: { fileId: id } });
  const metadata = file.metadata;
  const permitted =
    ticket?.purpose === 'blog'
      ? hasAccess(user, 'write', 'Content')
      : ticket?.private
        ? hasAccess(user, 'manage', 'Support')
        : hasAccess(user, 'write', 'Catalog');
  if (metadata?.ownerId !== user.id && !permitted) throw new Forbidden();
  return file;
}
