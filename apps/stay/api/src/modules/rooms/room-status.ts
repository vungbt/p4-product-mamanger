/** Room state is derived from a holding contract on the Vietnam business date. */
import { isoDateInTimeZone, type RoomContractSummary, type RoomStatus } from '@stay/shared';
import { literal, Op, type Transaction, type WhereOptions } from 'sequelize';
import {
  ContractModel,
  ContractOccupantModel,
  DepositEntryModel,
  TenantModel,
} from '@/sequelize/models/index.js';
import type { RoomAttributes } from '@/sequelize/models/room.model.js';

/** The contract holding a room (`active`/`ending` → occupied, a reserving one → reserved). */
export interface RoomOccupancy {
  status: Extract<RoomStatus, 'reserved' | 'occupied'>;
  contract: RoomContractSummary;
  /** People living in the room today. */
  occupantCount: number;
}

/** Holding contract per room; linked people and deposits are loaded once for the whole page. */
export async function roomOccupancies(
  roomIds: readonly string[],
  transaction?: Transaction,
): Promise<Map<string, RoomOccupancy>> {
  const result = new Map<string, RoomOccupancy>();
  if (!roomIds.length) return result;
  const rows = await ContractModel.findAll({
    where: { roomId: { [Op.in]: [...roomIds] }, status: { [Op.in]: ['active', 'ending'] } },
    transaction,
  });
  const today = isoDateInTimeZone(new Date());

  const ids = rows.map((row) => row.id);
  const [occupants, deposits] = await Promise.all([
    ContractOccupantModel.findAll({ where: { contractId: { [Op.in]: ids } }, transaction }),
    DepositEntryModel.findAll({ where: { contractId: { [Op.in]: ids } }, transaction }),
  ]);
  const primaryTenants = await TenantModel.findAll({
    where: {
      id: { [Op.in]: occupants.filter((o) => o.isPrimary && !o.toDate).map((o) => o.tenantId) },
    },
    transaction,
  });

  for (const row of rows) {
    const links = occupants.filter((o) => o.contractId === row.id);
    const primary = links.find((o) => o.isPrimary && !o.toDate);
    const depositHeld = deposits
      .filter((d) => d.contractId === row.id)
      .reduce((sum, d) => sum + (d.type === 'received' ? d.amount : -d.amount), 0);

    result.set(row.roomId, {
      status: row.startDate > today ? 'reserved' : 'occupied',
      contract: {
        id: row.id,
        code: row.code,
        status: row.status,
        startDate: row.startDate,
        endDate: row.endDate,
        rent: row.rent,
        depositHeld,
        primaryTenantName: primaryTenants.find((t) => t.id === primary?.tenantId)?.fullName ?? null,
      },
      occupantCount: links.filter((o) => o.fromDate <= today && (!o.toDate || o.toDate >= today))
        .length,
    });
  }
  return result;
}

/** Status of a room from its maintenance switch and holding contract (if any). */
export function deriveRoomStatus(
  room: Pick<RoomAttributes, 'maintenance'>,
  occupancy: RoomOccupancy | undefined,
): RoomStatus {
  if (occupancy) return occupancy.status;
  return room.maintenance ? 'maintenance' : 'vacant';
}

/** SQL filter matching the same contract/date derivation as the map and counters. */
export function roomStatusWhere(status: RoomStatus): WhereOptions<RoomAttributes> {
  const holding = `SELECT 1 FROM contracts c WHERE c.room_id = "RoomModel".id AND c.status IN ('active','ending')`;
  const today = isoDateInTimeZone(new Date());

  switch (status) {
    case 'maintenance':
      return { maintenance: true, [Op.and]: literal(`NOT EXISTS (${holding})`) };
    case 'vacant':
      return { maintenance: false, [Op.and]: literal(`NOT EXISTS (${holding})`) };
    case 'reserved':
      return literal(`EXISTS (${holding} AND c.start_date > '${today}')`);
    case 'occupied':
      return literal(`EXISTS (${holding} AND c.start_date <= '${today}')`);
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
