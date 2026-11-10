/**
 * What other modules know about a building. Contracts (ST-10) and invoices (ST-14) do not exist
 * yet: each such function returns the empty answer and the owning task adds its query here, so
 * the building rules (archive, code lock, price history) need no other change.
 */
import type { BuildingStats } from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import { RoomModel } from '@/sequelize/models/index.js';
import { roomOccupancies } from '../rooms/room-status.js';

export interface BlockingRoom {
  roomId: string;
  roomCode: string;
  contractId: string;
}

/** Active (non-archived) rooms per building, and those occupied (room-status derivation). */
export async function buildingStats(buildingIds: readonly string[]) {
  const stats = new Map<string, BuildingStats>(
    buildingIds.map((id) => [id, { roomCount: 0, occupiedRoomCount: 0 }]),
  );
  const rooms = buildingIds.length
    ? await RoomModel.findAll({
        attributes: ['id', 'buildingId'],
        where: { buildingId: { [Op.in]: [...buildingIds] }, archivedAt: { [Op.is]: null } },
      })
    : [];
  const occupancies = await roomOccupancies(rooms.map((room) => room.id));

  for (const room of rooms) {
    const entry = stats.get(room.buildingId);

    if (!entry) continue;
    entry.roomCount += 1;
    if (occupancies.get(room.id)?.status === 'occupied') entry.occupiedRoomCount += 1;
  }
  return stats;
}

/** Rooms with an `active`/`ending` contract; a building with any cannot be archived (ST-10). */
export async function roomsWithActiveContracts(
  _buildingId: string,
  _transaction: Transaction,
): Promise<BlockingRoom[]> {
  return [];
}

/** Invoices exist for the building, so its code (used in invoice codes) is locked (ST-14). */
export async function buildingHasInvoices(
  _buildingId: string,
  _transaction?: Transaction,
): Promise<boolean> {
  return false;
}

/**
 * An override effective on `effectiveFrom` would change a price already snapshotted by an issued
 * invoice of the building (issued on or after that date). ST-14 adds the invoice query.
 */
export async function priceHistoryInvoiced(
  _buildingId: string,
  _serviceId: string,
  _effectiveFrom: string,
  _transaction: Transaction,
): Promise<boolean> {
  return false;
}
