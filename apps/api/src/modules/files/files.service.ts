import type { UploadPurpose } from '@p4/shared';
import { Op, QueryTypes } from 'sequelize';
import { isCloudinaryConfigured } from '@/configs/cloudinary.js';
import { errorKeys } from '@/constants/index.js';
import { sequelize } from '@/sequelize/index.js';
import {
  FileModel,
  ProductImageModel,
  ProductModel,
  ProductVariantModel,
  ReturnRequestModel,
  UploadTicketModel,
  UserModel,
} from '@/sequelize/models/index.js';
import { requestStore } from '@/shared/request-store.js';
import { BadRequest, Forbidden, NotFound, Unauthorized } from '@/utils/errors/index.js';
import { logger } from '@/utils/logger.js';
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
  const file = await FileModel.findByPk(fileId);
  if (!file) {
    throw new NotFound(errorKeys.fileNotFound);
  }

  const refs = await countFileReferences(fileId);
  if (refs > 0) {
    throw new BadRequest(errorKeys.fileStillInUse);
  }

  if (file.provider === 'cloudinary' && file.storageId) {
    if (isCloudinaryConfigured()) {
      try {
        const result = await cloudinaryService.destroyResource(
          file.storageId,
          file.metadata?.private === true,
        );
        const status = (result as { result?: string }).result;
        if (status && status !== 'ok' && status !== 'not found') {
          logger.warn('[files] Cloudinary destroy unexpected:', status, file.storageId);
        }
      } catch (error) {
        logger.error('[files] Cloudinary destroy failed:', error);
        throw new BadRequest(errorKeys.fileDeleteFailed);
      }
    } else {
      logger.warn('[files] Skip Cloudinary destroy — not configured:', file.storageId);
    }
  }

  await UploadTicketModel.update({ fileId: null, status: 'rejected' }, { where: { fileId } });
  await file.destroy();
  return { ok: true as const, id: fileId };
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
