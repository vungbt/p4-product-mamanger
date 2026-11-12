import {
  MAINTENANCE_MAX_PHOTOS,
  MAINTENANCE_STATUSES,
  type MaintenanceInput,
  type MaintenanceUpdateInput,
} from '@stay/shared';
import type { FormBody } from '@/shared/input.js';
import { readMaintenanceInput, UUID_PATTERN } from '../requests/requests.input.js';

export function readJobInput(body: FormBody): MaintenanceInput {
  const roomId = body.text('roomId', 36);

  body.check('roomId', UUID_PATTERN.test(roomId));
  // Staff need only a room, title and description; category remains available for portal reports.
  if (body.isEmpty('category')) body.data.category = 'other';
  return { roomId, ...readMaintenanceInput(body) };
}

export function readJobUpdate(body: FormBody): MaintenanceUpdateInput {
  const input: MaintenanceUpdateInput = { version: body.integer('version', 1) };

  if (!body.isEmpty('title')) input.title = body.text('title', 200);
  if (!body.isEmpty('description')) input.description = body.optionalText('description', 2000);
  if (!body.isEmpty('reply')) input.reply = body.optionalText('reply', 2000);
  if (!body.isEmpty('status')) input.status = body.enum('status', MAINTENANCE_STATUSES);
  if (!body.isEmpty('photoFileIds')) {
    input.photoFileIds = body.strings('photoFileIds', MAINTENANCE_MAX_PHOTOS, 36);
    body.check(
      'photoFileIds',
      input.photoFileIds.every((id) => UUID_PATTERN.test(id)) &&
        new Set(input.photoFileIds).size === input.photoFileIds.length,
    );
  }
  body.assertValid();
  return input;
}
