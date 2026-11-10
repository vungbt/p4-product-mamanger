import { selectFields } from '@p4/server-core';
import type { JsonValue } from '@p4/shared';
import {
  type GeneratedRoomCode,
  generateRoomCodes,
  type MeterKind,
  type RoomBulkPreview,
  type RoomBulkResult,
  type RoomCodeTemplateInput,
  type StayUser,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import { RoomModel } from '@/sequelize/models/index.js';
import { recordAudit } from '@/shared/audit.js';
import { runIdempotent } from '@/shared/persistence.js';
import {
  assertBuildingOpen,
  findRoomBuilding,
  insertRoom,
  type MeterInput,
  roomDtos,
} from './rooms.service.js';

/** Shared values of a bulk creation (screens.md O-10) and per-room price changes. */
export interface RoomBulkInput extends RoomCodeTemplateInput {
  listPrice: number;
  maxOccupants: number;
  areaM2: number | null;
  serviceIds: string[];
  meters: Record<MeterKind, Pick<MeterInput, 'initialReading'>>;
  /** Price per generated code, edited on the preview table; other codes use `listPrice`. */
  prices: Record<string, number>;
}

/** Codes of active rooms of the building among `codes`. */
async function existingCodes(
  buildingId: string,
  codes: readonly GeneratedRoomCode[],
  transaction?: Transaction,
): Promise<Set<string>> {
  const rows = await RoomModel.findAll({
    attributes: ['code'],
    where: {
      buildingId,
      archivedAt: { [Op.is]: null },
      code: { [Op.in]: codes.map((item) => item.code) },
    },
    transaction,
  });

  return new Set(rows.map((row) => row.code));
}

/** Codes a bulk creation would create; codes already used are marked and will be skipped. */
export async function previewBulkRooms(
  user: StayUser,
  buildingId: string,
  input: RoomCodeTemplateInput,
): Promise<RoomBulkPreview> {
  const building = await findRoomBuilding(user, buildingId, 'manage');
  const codes = generateRoomCodes(input);
  const taken = await existingCodes(building.id, codes);
  const items = codes.map((item) => ({ ...item, exists: taken.has(item.code) }));

  return {
    items,
    createCount: items.filter((item) => !item.exists).length,
    skipCount: taken.size,
  };
}

/** Stored idempotent result: ids of the created rooms and the skipped codes. */
function storedResult(value: JsonValue): { createdIds: string[]; skippedCodes: string[] } {
  const strings = (field: string) => {
    const list =
      value && typeof value === 'object' && !Array.isArray(value) ? value[field] : undefined;

    return Array.isArray(list)
      ? list.filter((item): item is string => typeof item === 'string')
      : [];
  };

  return { createdIds: strings('createdIds'), skippedCodes: strings('skippedCodes') };
}

/**
 * Creates the generated rooms in one transaction, skipping codes already used, each with its
 * default services and meters. Idempotent per `key`: a replay with the same payload returns the
 * first result without creating anything; another payload with the key is a 409.
 */
export async function bulkCreateRooms(
  user: StayUser,
  buildingId: string,
  key: string,
  input: RoomBulkInput,
): Promise<RoomBulkResult> {
  const codes = generateRoomCodes(input);
  const { result } = await runIdempotent(
    {
      scope: 'room.bulk_create',
      actorId: user.id,
      key,
      payload: { buildingId, ...input },
    },
    async (transaction): Promise<JsonValue> => {
      // Locking the building serialises room creation, so the code check holds.
      const building = await findRoomBuilding(user, buildingId, 'manage', transaction);

      assertBuildingOpen(building);

      const taken = await existingCodes(building.id, codes, transaction);
      const createdIds: string[] = [];

      for (const { code, floor } of codes.filter((item) => !taken.has(item.code))) {
        const row = await insertRoom(
          building.id,
          {
            code,
            floor,
            areaM2: input.areaM2,
            listPrice: input.prices[code] ?? input.listPrice,
            maxOccupants: input.maxOccupants,
            note: null,
            serviceIds: input.serviceIds,
            meters: {
              electricity: { ...input.meters.electricity, serial: null },
              water: { ...input.meters.water, serial: null },
            },
          },
          transaction,
        );

        createdIds.push(row.id);
      }

      const skippedCodes = codes.filter((item) => taken.has(item.code)).map((item) => item.code);

      await recordAudit(
        {
          action: 'room.bulk_create',
          resourceType: 'room',
          resourceId: building.id,
          changes: {
            buildingId: building.id,
            ...selectFields(input, ['floorFrom', 'floorTo', 'roomsPerFloor', 'template']),
            created: codes.filter((item) => !taken.has(item.code)).map((item) => item.code),
            skipped: skippedCodes,
          },
        },
        transaction,
      );
      return { createdIds, skippedCodes };
    },
  );
  const { createdIds, skippedCodes } = storedResult(result);
  const rows = createdIds.length
    ? await RoomModel.findAll({ where: { id: { [Op.in]: createdIds } } })
    : [];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const created = createdIds.flatMap((id) => byId.get(id) ?? []);
  const floors = new Map(codes.map((item) => [item.code, item.floor]));

  return {
    buildingId,
    created: await roomDtos(created),
    skipped: skippedCodes.map((code) => ({
      code,
      floor: floors.get(code) ?? 0,
      reason: 'exists' as const,
    })),
  };
}
