import type { UploadPurpose } from '@p4/shared';
import { Op, QueryTypes } from 'sequelize';
import { errorKeys } from '@/constants/index.js';
import { sequelize } from '@/sequelize/index.js';
import type { DomainEventModel } from '@/sequelize/models/domain-event.model.js';
import {
  FileModel,
  ProductImageModel,
  ProductModel,
  ProductVariantModel,
  ReturnRequestModel,
  UploadTicketModel,
  UserModel,
} from '@/sequelize/models/index.js';
import { auditedTransaction } from '@/shared/audit/audited-command.js';
import { enqueueEvent } from '@/shared/commerce/persistence.js';
import { requestStore } from '@/shared/request-store.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { BadRequest, Forbidden, NotFound, Unauthorized } from '@/utils/errors/index.js';
import * as cloudinaryService from './cloudinary.service.js';
import { completeUpload, createUpload } from './uploads.service.js';

/** Only a completed ticket owned by the current actor can be attached. */
export async function createFromStorageId(storageId: string, purpose: UploadPurpose = 'product') {
  const user = requestStore.getStore()?.user;
  if (!user) throw new Unauthorized();
  const ticket = await UploadTicketModel.findOne({
    where: { storageId, ownerId: user.id, purpose },
  });
  if (!ticket) throw new Forbidden();
  const completed = await completeUpload(user.id, ticket.id);
  if (!completed.fileId) throw new BadRequest(errorKeys.uploadFileRequired);
  const file = await FileModel.findByPk(completed.fileId);
  if (!file) throw new NotFound(errorKeys.fileNotFound);
  return file;
}

export async function countFileReferences(fileId: string) {
  const [asCover, asGallery, asAvatar, asVariant, asReturn] = await Promise.all([
    ProductModel.count({ where: { imageId: fileId } }),
    ProductImageModel.count({ where: { fileId } }),
    UserModel.count({ where: { avatarId: fileId } }),
    ProductVariantModel.count({ where: { imageIds: { [Op.contains]: [fileId] } } }),
    ReturnRequestModel.count({ where: { evidenceIds: { [Op.contains]: [fileId] } } }),
  ]);
  const other = await sequelize.query<{ count: number }>(
    `SELECT (
    (SELECT COUNT(*) FROM reviews WHERE media_ids @> ARRAY[:id]::uuid[]) +
    (SELECT COUNT(*) FROM support_messages WHERE attachment_ids @> ARRAY[:id]::uuid[]) +
    (SELECT COUNT(*) FROM content_entries WHERE cover_file_id = :id OR body @> :body::jsonb OR published_snapshot @> :cover::jsonb OR published_snapshot @> :publishedBody::jsonb) +
    (SELECT COUNT(*) FROM content_revisions WHERE snapshot @> :cover::jsonb OR snapshot @> :publishedBody::jsonb) +
    (SELECT COUNT(*) FROM merchandising_entries WHERE payload @> :banner::jsonb)
  )::int AS count`,
    {
      replacements: {
        id: fileId,
        body: JSON.stringify([{ type: 'image', fileId }]),
        cover: JSON.stringify({ coverFileId: fileId }),
        publishedBody: JSON.stringify({ body: [{ type: 'image', fileId }] }),
        banner: JSON.stringify({ kind: 'banner', imageFileId: fileId }),
      },
      type: QueryTypes.SELECT,
    },
  );
  return asCover + asGallery + asAvatar + asVariant + asReturn + (other[0]?.count ?? 0);
}

/**
 * Xóa file khỏi DB + Cloudinary khi không còn reference.
 * `system` provider chỉ xóa DB.
 */
export async function deleteFile(fileId: string) {
  return auditedTransaction(async (transaction) => {
    const file = await FileModel.findByPk(fileId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!file) throw new NotFound(errorKeys.fileNotFound);
    if ((await countFileReferences(fileId)) > 0) throw new BadRequest(errorKeys.fileStillInUse);
    if (file.provider === 'cloudinary' && file.storageId) {
      await enqueueEvent(
        {
          type: 'file.delete_requested',
          aggregateType: 'file',
          aggregateId: file.id,
          payload: { storageId: file.storageId, private: file.metadata?.private === true },
        },
        transaction,
      );
    }
    await UploadTicketModel.update(
      { fileId: null, status: 'rejected' },
      { where: { fileId }, transaction },
    );
    await file.destroy({ transaction });
    return { ok: true as const, id: fileId };
  });
}

export async function deleteStoredFile(event: DomainEventModel) {
  const data = event.payload;
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    typeof data.storageId !== 'string' ||
    typeof data.private !== 'boolean'
  )
    throw new BaseError('invalid_file_delete_event');
  const result: unknown = await cloudinaryService.destroyResource(data.storageId, data.private);
  if (
    !result ||
    typeof result !== 'object' ||
    !('result' in result) ||
    !['ok', 'not found'].includes(String(result.result))
  )
    throw new BaseError('storage_delete_failed');
}

/** Detach xong gọi hàm này — chỉ xóa khi orphan */
export async function deleteFileIfUnreferenced(fileId: string | null | undefined) {
  if (!fileId) return { deleted: false as const };
  const refs = await countFileReferences(fileId);
  if (refs > 0) return { deleted: false as const };
  try {
    await deleteFile(fileId);
    return { deleted: true as const };
  } catch (error) {
    if (error instanceof NotFound) return { deleted: false as const };
    throw error;
  }
}

export async function signUploadUrl(_name?: string) {
  const user = requestStore.getStore()?.user;
  if (!user) throw new Unauthorized();
  return createUpload(user, 'product', null);
}

export async function signUploadUrls(names: string[]) {
  if (names.length > 20) throw new BadRequest('upload_batch_limit');
  return Promise.all(names.map((name) => signUploadUrl(name)));
}
