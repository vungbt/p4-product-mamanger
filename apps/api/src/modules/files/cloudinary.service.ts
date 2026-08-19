import { cloudinary, isCloudinaryConfigured } from '@/configs/cloudinary.js';
import { env } from '@/configs/env.js';
import { errorKeys } from '@/constants/index.js';
import { BadRequest } from '@/utils/errors/index.js';

function assertConfigured() {
  if (!isCloudinaryConfigured()) {
    throw new BadRequest(errorKeys.cloudinaryNotConfigured);
  }
}

function slugify(name?: string) {
  const base =
    (name || 'file')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'file';
  return base.slice(0, 80);
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function toQuery(params: Record<string, unknown>) {
  const entries = Object.entries(params).filter(([, value]) => value != null);
  return new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString();
}

export type SignedUpload = {
  uploadUrl: string;
  publicId: string;
};

export function signUploadUrl(name?: string): SignedUpload {
  assertConfigured();
  const publicId = `${env.cloudinary.tempFolder}/${formatDate(new Date())}-${slugify(name)}`;
  const signed = cloudinary.utils.sign_request({
    public_id: publicId,
    timestamp: Math.round(Date.now() / 1000),
  }) as Record<string, unknown>;
  const uploadUrl = `${env.cloudinary.domain}/${env.cloudinary.cloudName}/auto/upload?${toQuery(signed)}`;
  return { uploadUrl, publicId };
}

export function signUploadUrls(names: string[]): SignedUpload[] {
  return names.map((name) => signUploadUrl(name));
}

export async function moveToAssets(publicId: string) {
  assertConfigured();
  const name = publicId.split('/').pop();
  if (!name) {
    throw new BadRequest(errorKeys.uploadInvalidFolder);
  }
  return cloudinary.uploader.rename(publicId, `${env.cloudinary.assetsFolder}/${name}`, {
    invalidate: true,
    overwrite: true,
  });
}

export async function getResourceInfo(publicId: string) {
  assertConfigured();
  return cloudinary.api.resource(publicId);
}

/** Xóa asset trên Cloudinary — `not found` coi như đã sạch */
export async function destroyResource(publicId: string) {
  assertConfigured();
  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: 'image',
  });
  return result;
}
