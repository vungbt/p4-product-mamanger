import { isCloudinaryConfigured } from '@/configs/cloudinary.js';
import { errorKeys } from '@/constants/index.js';
import { FileModel, ProductImageModel, ProductModel, UserModel } from '@/sequelize/models/index.js';
import * as cloudinaryService from '@/services/files/cloudinary.service.js';
import { BadRequest, NotFound } from '@/utils/errors/index.js';
import { logger } from '@/utils/logger.js';

function pickMetadata(resource: Record<string, unknown>) {
  const keys = ['format', 'resource_type', 'bytes', 'height', 'width'] as const;
  const metadata: Record<string, unknown> = {};
  for (const key of keys) {
    if (resource[key] != null) metadata[key] = resource[key];
  }
  return Object.keys(metadata).length ? metadata : null;
}

/** Rename temp → assets (nếu cần) rồi persist bảng files */
export async function createFromStorageId(storageId: string) {
  if (!storageId?.trim()) {
    throw new BadRequest(errorKeys.uploadFileRequired);
  }

  let resource: Record<string, unknown>;
  try {
    const moved = await cloudinaryService.moveToAssets(storageId.trim());
    resource = moved as unknown as Record<string, unknown>;
  } catch {
    resource = (await cloudinaryService.getResourceInfo(storageId.trim())) as unknown as Record<
      string,
      unknown
    >;
  }

  const url = String(resource.secure_url || resource.url || '');
  const publicId = String(resource.public_id || storageId);
  if (!url) {
    throw new BadRequest(errorKeys.cloudinaryNotConfigured);
  }

  return FileModel.create({
    url,
    storageId: publicId,
    provider: 'cloudinary',
    metadata: pickMetadata(resource),
  });
}

export async function countFileReferences(fileId: string) {
  const [asCover, asGallery, asAvatar] = await Promise.all([
    ProductModel.count({ where: { imageId: fileId } }),
    ProductImageModel.count({ where: { fileId } }),
    UserModel.count({ where: { avatarId: fileId } }),
  ]);
  return asCover + asGallery + asAvatar;
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
        const result = await cloudinaryService.destroyResource(file.storageId);
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

export function signUploadUrl(name?: string) {
  return cloudinaryService.signUploadUrl(name);
}

export function signUploadUrls(names: string[]) {
  return cloudinaryService.signUploadUrls(names);
}
