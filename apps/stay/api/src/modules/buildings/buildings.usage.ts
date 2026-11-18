/** Building usage from rooms, contracts and invoices. */
import type { BuildingStats } from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import {
  ContractModel,
  InvoiceLineModel,
  InvoiceModel,
  RoomModel,
} from '@/sequelize/models/index.js';
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

/** An invoice of the building was issued, so its code (used in invoice codes) is locked. */
export async function buildingHasInvoices(
  buildingId: string,
  transaction?: Transaction,
): Promise<boolean> {
  const count = await InvoiceModel.count({
    where: { buildingId, code: { [Op.ne]: null } },
    transaction,
  });

  return count > 0;
}

/**
 * A price override dated `effectiveFrom` was snapshotted by an issued (non-void) invoice of the
 * building issued on or after that date, so it cannot be replaced.
 */
export async function priceHistoryInvoiced(
  buildingId: string,
  serviceId: string,
  effectiveFrom: string,
  transaction: Transaction,
): Promise<boolean> {
  const invoices = await InvoiceModel.findAll({
    where: {
      buildingId,
      issuedOn: { [Op.gte]: effectiveFrom },
      status: { [Op.in]: ['issued', 'partially_paid', 'paid'] },
    },
    attributes: ['id'],
    transaction,
  });

  if (!invoices.length) return false;
  const count = await InvoiceLineModel.count({
    where: { invoiceId: { [Op.in]: invoices.map((row) => row.id) }, serviceId },
    transaction,
  });

  return count > 0;
}
