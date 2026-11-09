/**
 * What other modules know about a building. Rooms (ST-08), contracts (ST-10) and invoices (ST-14)
 * do not exist yet: each function returns the empty answer and the owning task adds its query
 * here, so the building rules (archive, code lock, price history) need no other change.
 */
import type { BuildingStats } from '@stay/shared';
import type { Transaction } from 'sequelize';

export interface BlockingRoom {
  roomId: string;
  roomCode: string;
  contractId: string;
}

/** Room counters per building (ST-08 counts rooms, ST-10 occupied ones). */
export async function buildingStats(buildingIds: readonly string[]) {
  return new Map<string, BuildingStats>(
    buildingIds.map((id) => [id, { roomCount: 0, occupiedRoomCount: 0 }]),
  );
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
