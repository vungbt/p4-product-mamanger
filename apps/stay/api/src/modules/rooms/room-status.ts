/** Room state is derived from a holding contract on the Vietnam business date. */
import { isoDateInTimeZone, type RoomContractSummary, type RoomStatus } from '@stay/shared';
import { literal, Op, type Transaction, type WhereOptions } from 'sequelize';
import {
  ContractModel,
  ContractOccupantModel,
  DepositEntryModel,
  sequelize,
  TenantModel,
} from '@/sequelize/models/index.js';
import type { RoomAttributes } from '@/sequelize/models/room.model.js';
import { contractFactsAt } from '../contracts/contracts.resolvers.js';

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
  const today = isoDateInTimeZone(new Date());
  const rows = await ContractModel.findAll({
    where: {
      [Op.and]: literal(
        `stay_contract_room_at("ContractModel".id, '${today}') IN (${roomIds.map((id) => `'${id}'::uuid`).join(',')})`,
      ),
      status: { [Op.in]: ['active', 'ending'] },
    },
    transaction,
  });
  const ids = rows.map((row) => row.id);
  const [occupants, deposits] = await Promise.all([
    ContractOccupantModel.findAll({ where: { contractId: { [Op.in]: ids } }, transaction }),
    DepositEntryModel.findAll({ where: { contractId: { [Op.in]: ids } }, transaction }),
  ]);
  const primaryTenants = await TenantModel.findAll({
    where: {
      id: {
        [Op.in]: occupants.filter((o) => o.isPrimary).map((o) => o.tenantId),
      },
    },
    transaction,
  });

  for (const row of rows) {
    const links = occupants.filter((o) => o.contractId === row.id);
    const membershipDate = today < row.startDate ? row.startDate : today;
    const primary = links.find(
      (o) =>
        o.isPrimary && o.fromDate <= membershipDate && (!o.toDate || o.toDate > membershipDate),
    );
    const depositHeld = deposits
      .filter((d) => d.contractId === row.id)
      .reduce((sum, d) => sum + (d.type === 'received' ? d.amount : -d.amount), 0);

    const facts = await contractFactsAt(row.id, today, transaction);
    result.set(facts.roomId, {
      status: row.startDate > today ? 'reserved' : 'occupied',
      contract: {
        id: row.id,
        code: row.code,
        status: row.status,
        startDate: row.startDate,
        endDate: row.endDate,
        rent: facts.rent,
        depositHeld,
        primaryTenantName: primaryTenants.find((t) => t.id === primary?.tenantId)?.fullName ?? null,
      },
      occupantCount: links.filter((o) => o.fromDate <= today && (!o.toDate || o.toDate > today))
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
  const today = isoDateInTimeZone(new Date());
  const holding = `SELECT 1 FROM contracts c WHERE stay_contract_room_at(c.id, '${today}') = "RoomModel".id AND c.status IN ('active','ending')`;

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
  const current = (await roomOccupancies([roomId], transaction)).get(roomId)?.contract;
  if (current) return current;
  // A scheduled destination must stay available until the move takes effect.
  const future = await ContractModel.findOne({
    where: {
      [Op.or]: [
        { roomId },
        literal(
          `EXISTS (SELECT 1 FROM contract_events e WHERE e.contract_id="ContractModel".id AND e.type='room-change' AND e.payload->>'roomId'=${sequelize.escape(roomId)} AND e.payload->>'effectiveDate'>=${sequelize.escape(isoDateInTimeZone(new Date()))})`,
        ),
      ],
      status: { [Op.in]: ['active', 'ending'] },
    },
    transaction,
  });
  return future
    ? {
        id: future.id,
        code: future.code,
        status: future.status,
        startDate: future.startDate,
        endDate: future.endDate,
        rent: future.rent,
        depositHeld: 0,
        primaryTenantName: null,
      }
    : null;
}
