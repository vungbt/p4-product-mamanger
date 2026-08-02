import { errorKeys } from '@/constants/index.js';
import { FileModel } from '@/sequelize/models/index.js';
import * as cloudinaryService from '@/services/files/cloudinary.service.js';
import { BadRequest } from '@/utils/errors/index.js';

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
    // Đã ở assets hoặc rename fail → lấy info hiện tại
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

export function signUploadUrl(name?: string) {
  return cloudinaryService.signUploadUrl(name);
}

export function signUploadUrls(names: string[]) {
  return cloudinaryService.signUploadUrls(names);
}
