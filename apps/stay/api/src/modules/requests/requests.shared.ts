import { BaseError, InputValidError } from '@p4/server-core';
import type {
  InboxStatus,
  MaintenanceStatus,
  PaymentClaimStatus,
  RequestPhoto,
  TenantRequestStatus,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import { FileModel } from '@/sequelize/models/index.js';
import { signedFileUrl } from '../uploads/uploads.service.js';

export function conflict(code: string, extensions?: Record<string, unknown>): never {
  throw new BaseError(code, 409, code, extensions);
}

export function invalid(field: string, message: string): never {
  throw new InputValidError('input_valid_error', { [field]: [message] });
}

/** Maintenance reports the tenant can still follow (not closed). */
export const OPEN_MAINTENANCE_STATUSES: MaintenanceStatus[] = ['new', 'open', 'in_progress'];

/** One status vocabulary for the inbox chips (`InboxStatus`). */
export function maintenanceInboxStatus(status: MaintenanceStatus): InboxStatus {
  if (status === 'new') return 'pending';
  if (status === 'open' || status === 'in_progress') return 'in_progress';
  return status;
}

export function requestInboxStatus(status: TenantRequestStatus): InboxStatus {
  if (status === 'new') return 'pending';
  if (status === 'accepted') return 'done';
  return status;
}

export function claimInboxStatus(status: PaymentClaimStatus): InboxStatus {
  return status === 'confirmed' ? 'done' : status;
}

/** Signed URLs of private files by id (missing files are skipped). */
export async function photoMap(
  fileIds: readonly string[],
  transaction?: Transaction,
): Promise<Map<string, RequestPhoto>> {
  const unique = [...new Set(fileIds)];
  const files = unique.length
    ? await FileModel.findAll({ where: { id: { [Op.in]: unique } }, transaction })
    : [];

  return new Map(
    files.map((file) => [file.id, { fileId: file.id, url: signedFileUrl(file)?.url ?? null }]),
  );
}

export function photosOf(ids: readonly string[], photos: Map<string, RequestPhoto>) {
  return ids.flatMap((id) => {
    const photo = photos.get(id);

    return photo ? [photo] : [];
  });
}
