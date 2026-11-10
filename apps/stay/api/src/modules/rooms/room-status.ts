/**
 * Room status, derived in one place (rules.md "Phòng"): a room held by a contract is `reserved`
 * or `occupied`; otherwise `maintenance` when switched on, else `vacant`. Contracts arrive with
 * ST-10, which replaces `roomOccupancies` and the contract branch of `roomStatusWhere`; the room
 * map, filters, counters, the maintenance switch and archiving then follow without other changes.
 */
import type { RoomContractSummary, RoomStatus } from '@stay/shared';
import { literal, type Transaction, type WhereOptions } from 'sequelize';
import type { RoomAttributes } from '@/sequelize/models/room.model.js';

/** The contract holding a room (`active`/`ending` → occupied, a reserving one → reserved). */
export interface RoomOccupancy {
  status: Extract<RoomStatus, 'reserved' | 'occupied'>;
  contract: RoomContractSummary;
  /** People living in the room today. */
  occupantCount: number;
}

/** Holding contract per room id; rooms without one are absent. ST-10 adds the contract query. */
export async function roomOccupancies(
  _roomIds: readonly string[],
  _transaction?: Transaction,
): Promise<Map<string, RoomOccupancy>> {
  return new Map();
}

/** Status of a room from its maintenance switch and holding contract (if any). */
export function deriveRoomStatus(
  room: Pick<RoomAttributes, 'maintenance'>,
  occupancy: RoomOccupancy | undefined,
): RoomStatus {
  if (occupancy) return occupancy.status;
  return room.maintenance ? 'maintenance' : 'vacant';
}

/**
 * SQL filter matching `deriveRoomStatus`. Without contracts no room is reserved or occupied;
 * ST-10 adds `EXISTS`/`NOT EXISTS` on the holding contract to every branch.
 */
export function roomStatusWhere(status: RoomStatus): WhereOptions<RoomAttributes> {
  switch (status) {
    case 'maintenance':
      return { maintenance: true };
    case 'vacant':
      return { maintenance: false };
    case 'reserved':
    case 'occupied':
      return literal('FALSE');
  }
}

/**
 * The contract that blocks maintenance and archiving of a room, if any. Uses the same
 * derivation as the room map so the 409 and the map always agree.
 */
export async function holdingContract(
  roomId: string,
  transaction: Transaction,
): Promise<RoomContractSummary | null> {
  return (await roomOccupancies([roomId], transaction)).get(roomId)?.contract ?? null;
}
