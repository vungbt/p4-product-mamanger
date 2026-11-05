import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BaseError } from '@/utils/errors/base-error.js';

export const processStorageRoot =
  process.env.PROCESS_STORAGE_DIR ??
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../.p4-storage');
export function processStoragePath(key: string) {
  if (!/^[a-f0-9-]{36}\.(csv|xlsx)$/i.test(key)) throw new BaseError('invalid_storage_key');
  return path.join(processStorageRoot, key);
}
export async function ensureProcessStorage() {
  await mkdir(processStorageRoot, { recursive: true, mode: 0o700 });
}
export async function storeProcessFile(content: Buffer, format: 'csv' | 'xlsx') {
  await ensureProcessStorage();
  const key = `${randomUUID()}.${format}`;
  await writeFile(processStoragePath(key), content, { mode: 0o600, flag: 'wx' });
  return key;
}
export async function readProcessFile(key: string) {
  return readFile(processStoragePath(key));
}
export async function removeProcessFile(key: string) {
  try {
    await unlink(processStoragePath(key));
  } catch (error) {
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT')
      throw error;
  }
}
