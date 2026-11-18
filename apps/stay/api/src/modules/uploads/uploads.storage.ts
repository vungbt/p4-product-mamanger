import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { BaseError } from '@p4/server-core';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/configs/env.js';
import type { StorageProviderName, StoredImageFormat } from '@/sequelize/models/file.model.js';

/** What the provider reports about an uploaded object. */
export interface StoredObject {
  bytes: number;
  format: StoredImageFormat;
  width: number | null;
  height: number | null;
}

/**
 * Private file storage. The browser uploads directly to `signUpload().uploadUrl`; the API then
 * `inspect`s the object before trusting it and only ever hands out short-lived `viewUrl`s.
 */
export interface StorageProvider {
  readonly name: StorageProviderName;
  signUpload(ticket: { id: string; storageId: string; expiresAt: Date }): string;
  /** `null` when nothing (or not a supported image) was stored under `storageId`. */
  inspect(storageId: string): Promise<StoredObject | null>;
  viewUrl(
    file: { id: string; storageId: string; format: StoredImageFormat },
    expiresAt: Date,
  ): string;
  remove(storageId: string): Promise<void>;
}

/** Seconds a signed view URL stays valid. */
export const VIEW_URL_TTL_SECONDS = 300;

const FORMATS: Record<string, StoredImageFormat> = {
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

const MIME_TYPES: Record<StoredImageFormat, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export function mimeTypeOf(format: StoredImageFormat) {
  return MIME_TYPES[format];
}

function epochSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function toQuery(params: Record<string, unknown>) {
  return new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) =>
      value === undefined || value === null ? [] : [[key, String(value)]],
    ),
  ).toString();
}

export function isCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;

  return Boolean(cloudName && apiKey && apiSecret);
}

/** Cloudinary `authenticated` images: unreadable without a signed URL. */
function cloudinaryProvider(): StorageProvider {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });

  return {
    name: 'cloudinary',
    signUpload({ storageId }) {
      const signed: Record<string, unknown> = cloudinary.utils.sign_request({
        public_id: storageId,
        overwrite: false,
        type: 'authenticated',
        allowed_formats: 'jpg,jpeg,png,webp',
        timestamp: epochSeconds(new Date()),
      });

      return `${env.cloudinary.apiUrl}/${env.cloudinary.cloudName}/image/upload?${toQuery(signed)}`;
    },
    async inspect(storageId) {
      let resource: Record<string, unknown>;

      try {
        resource = await cloudinary.api.resource(storageId, {
          type: 'authenticated',
          resource_type: 'image',
          timeout: 15_000,
        });
      } catch (error) {
        const status = Reflect.get(Reflect.get(Object(error), 'error') ?? {}, 'http_code');

        if (status === 404) return null;
        throw new BaseError('storage_unavailable', 503, 'storage_unavailable');
      }

      const format = FORMATS[String(resource.format)];
      const { bytes, width, height } = resource;

      if (
        resource.public_id !== storageId ||
        resource.type !== 'authenticated' ||
        !format ||
        typeof bytes !== 'number' ||
        typeof width !== 'number' ||
        typeof height !== 'number'
      )
        return null;
      return { bytes, format, width, height };
    },
    viewUrl({ storageId, format }, expiresAt) {
      return cloudinary.utils.private_download_url(storageId, format, {
        type: 'authenticated',
        resource_type: 'image',
        expires_at: epochSeconds(expiresAt),
        attachment: false,
      });
    },
    async remove(storageId) {
      await cloudinary.uploader.destroy(storageId, {
        invalidate: true,
        resource_type: 'image',
        type: 'authenticated',
      });
    },
  };
}

/** HMAC of a stub URL, keyed with the auth secret (never sent to the client). */
export function stubSignature(scope: 'upload' | 'view', id: string, expires: number) {
  return createHmac('sha256', env.auth.secret)
    .update(`stay-stub:${scope}:${id}:${expires}`)
    .digest('base64url');
}

/** Whether `signature` signs `scope:id:expires` and has not expired. */
export function verifyStubSignature(
  scope: 'upload' | 'view',
  id: string,
  expires: string | undefined,
  signature: string | undefined,
) {
  const at = Number(expires);

  if (!signature || !Number.isSafeInteger(at) || at < epochSeconds(new Date())) return false;

  const expected = Buffer.from(stubSignature(scope, id, at));
  const actual = Buffer.from(signature);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** `jpg`/`png`/`webp` from the file's magic bytes, else `null`. */
export function sniffImageFormat(bytes: Buffer): StoredImageFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'jpg';
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'png';
  if (
    bytes.subarray(0, 4).toString('latin1') === 'RIFF' &&
    bytes.subarray(8, 12).toString('latin1') === 'WEBP'
  )
    return 'webp';
  return null;
}

function stubDirectory() {
  return env.uploadStubDir || path.join(os.tmpdir(), 'stay-upload-stub');
}

/** Storage id → file path inside the stub directory (ids are generated, never user input). */
function stubPath(storageId: string) {
  return path.join(stubDirectory(), storageId.replace(/[^a-zA-Z0-9-]/g, '_'));
}

/**
 * Local stand-in for Cloudinary (development, tests, CI). Uploads go to
 * `POST /api/uploads/:id/stub` and images are read from `GET /api/files/:id/stub` with an HMAC
 * signature that expires like Cloudinary's signed URLs; there is no public path to a file.
 */
function stubProvider(): StorageProvider {
  return {
    name: 'stub',
    signUpload({ id, expiresAt }) {
      const expires = epochSeconds(expiresAt);

      return `/api/uploads/${id}/stub?${toQuery({ expires, signature: stubSignature('upload', id, expires) })}`;
    },
    async inspect(storageId) {
      const file = stubPath(storageId);
      const info = await stat(file).catch(() => null);

      if (!info?.isFile()) return null;

      const format = sniffImageFormat(await readFile(file));

      return format ? { bytes: info.size, format, width: null, height: null } : null;
    },
    viewUrl({ id }, expiresAt) {
      const expires = epochSeconds(expiresAt);

      return `/api/files/${id}/stub?${toQuery({ expires, signature: stubSignature('view', id, expires) })}`;
    },
    async remove(storageId) {
      await rm(stubPath(storageId), { force: true });
    },
  };
}

export async function writeStubObject(storageId: string, bytes: Buffer) {
  await mkdir(stubDirectory(), { recursive: true });
  await writeFile(stubPath(storageId), bytes);
}

export function readStubObject(storageId: string) {
  return readFile(stubPath(storageId));
}

let provider: StorageProvider | null | undefined;

/**
 * The configured provider: Cloudinary when `STAY_CLOUDINARY_*` is set, else the stub outside
 * production. `null` in production without Cloudinary (uploads answer 503).
 */
export function storageProvider(): StorageProvider | null {
  if (provider === undefined)
    provider = isCloudinaryConfigured() ? cloudinaryProvider() : env.isProd ? null : stubProvider();
  return provider;
}

export function requireStorage(): StorageProvider {
  const current = storageProvider();

  if (!current) throw new BaseError('uploads_not_configured', 503, 'uploads_not_configured');
  return current;
}
