/** Building usage from rooms and contracts. Invoice-dependent guards are filled by ST-14. */
import type { BuildingStats } from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import { ContractModel, InvoiceModel, InvoiceLineModel, RoomModel } from '@/sequelize/models/index.js';
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
  buildingId: string,
  transaction: Transaction,
): Promise<BlockingRoom[]> {
  const contracts = await ContractModel.findAll({
    where: { buildingId, status: { [Op.in]: ['active', 'ending'] } },
    transaction,
  });
  const rooms = await RoomModel.findAll({
    where: { id: { [Op.in]: contracts.map((c) => c.roomId) } },
    transaction,
  });

  return contracts.map((c) => ({
    roomId: c.roomId,
    roomCode: rooms.find((r) => r.id === c.roomId)?.code ?? '',
    contractId: c.id,
  }));
}

/** Invoices exist for the building, so its code (used in invoice codes) is locked (ST-14). */
export async function buildingHasInvoices(
  buildingId: string,
  transaction?: Transaction,
): Promise<boolean> {
  return (await InvoiceModel.count({ where: { buildingId }, transaction })) > 0;
}

/**
 * An override effective on `effectiveFrom` would change a price already snapshotted by an issued
 * invoice of the building (issued on or after that date). ST-14 adds the invoice query.
 */
export async function priceHistoryInvoiced(
  buildingId: string,
  serviceId: string,
  effectiveFrom: string,
  transaction: Transaction,
): Promise<boolean> {
  const rows = await InvoiceModel.findAll({ where: { buildingId, issuedOn: { [Op.gte]: effectiveFrom }, status: { [Op.in]: ['issued', 'partially_paid', 'paid'] } }, attributes: ['id'], transaction });
  return (await InvoiceLineModel.count({ where: { invoiceId: { [Op.in]: rows.map(r => r.id) }, serviceId }, transaction })) > 0;
}
