import { Op, type Transaction } from 'sequelize';
import {
  ContractEventModel,
  ContractModel,
  ContractOccupantModel,
  ContractServiceModel,
  ContractVehicleModel,
  InvoiceModel,
} from '@/sequelize/models/index.js';

export function activeAt(date: string) {
  return {
    fromDate: { [Op.lte]: date },
    [Op.or]: [{ toDate: null }, { toDate: { [Op.gt]: date } }],
  };
}

export const contractOccupantsAt = (contractId: string, date: string, transaction?: Transaction) =>
  ContractOccupantModel.findAll({ where: { contractId, ...activeAt(date) }, transaction });
export const contractVehiclesAt = (contractId: string, date: string, transaction?: Transaction) =>
  ContractVehicleModel.findAll({ where: { contractId, ...activeAt(date) }, transaction });
export const contractServicesAt = (contractId: string, date: string, transaction?: Transaction) =>
  ContractServiceModel.findAll({ where: { contractId, ...activeAt(date) }, transaction });

/** Replay effective dates, with creation order breaking ties. Initial activation is the baseline. */
export async function contractFactsAt(contractId: string, date: string, transaction?: Transaction) {
  const row = await ContractModel.findByPk(contractId, { transaction, rejectOnEmpty: true });
  const events = await ContractEventModel.findAll({
    where: { contractId },
    order: [
      ['createdAt', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
  });
  const baseline = events.find((e) => e.type === 'activated')?.payload;
  const firstRent = events.find((e) => typeof e.payload.oldRent === 'number')?.payload;
  let rent =
    typeof baseline?.rent === 'number' ? baseline.rent : Number(firstRent?.oldRent ?? row.rent);
  const firstMove = events.find((e) => e.type === 'room-change')?.payload;
  let initialElectric = Number(
    baseline?.initialElectric ?? firstMove?.oldInitialElectric ?? row.initialElectric,
  );
  let initialWater = Number(
    baseline?.initialWater ?? firstMove?.oldInitialWater ?? row.initialWater,
  );
  let roomId =
    typeof baseline?.roomId === 'string'
      ? baseline.roomId
      : String(firstMove?.oldRoomId ?? row.roomId);
  const changes = events
    .filter((e) => typeof e.payload.effectiveDate === 'string' && e.payload.effectiveDate <= date)
    .sort(
      (a, b) =>
        String(a.payload.effectiveDate).localeCompare(String(b.payload.effectiveDate)) ||
        Number(a.payload.version ?? 0) - Number(b.payload.version ?? 0) ||
        a.createdAt.getTime() - b.createdAt.getTime() ||
        a.id.localeCompare(b.id),
    );
  for (const event of changes) {
    if (typeof event.payload.rent === 'number') rent = event.payload.rent;
    if (event.type === 'room-change' && typeof event.payload.roomId === 'string') {
      roomId = event.payload.roomId;
      initialElectric = Number(event.payload.initialElectric);
      initialWater = Number(event.payload.initialWater);
    }
  }
  return { rent, roomId, initialElectric, initialWater };
}

export async function contractRentAt(contractId: string, date: string, transaction?: Transaction) {
  return (await contractFactsAt(contractId, date, transaction)).rent;
}

/**
 * The period of `contractId` already has an issued (non-void, non-draft) monthly or move-in
 * invoice, so a change effective in it is corrected by void/re-issue or a next-period adjustment.
 */
export async function periodIsInvoiced(contractId: string, period: string): Promise<boolean> {
  const count = await InvoiceModel.count({
    where: {
      contractId,
      period,
      kind: { [Op.in]: ['monthly', 'move_in'] },
      status: { [Op.in]: ['issued', 'partially_paid', 'paid'] },
    },
  });

  return count > 0;
}

async function roomChanges(contractId: string, transaction?: Transaction) {
  const events = await ContractEventModel.findAll({
    where: { contractId, type: 'room-change' },
    order: [
      ['createdAt', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
  });

  return events
    .filter((e) => typeof e.payload.effectiveDate === 'string')
    .sort((a, b) => String(a.payload.effectiveDate).localeCompare(String(b.payload.effectiveDate)));
}

/** First day the contract occupies its room at `date`: the start date or the last move ≤ date. */
export async function contractRoomEntryDate(
  contractId: string,
  date: string,
  transaction?: Transaction,
): Promise<string> {
  const contract = await ContractModel.findByPk(contractId, { transaction, rejectOnEmpty: true });
  const moves = (await roomChanges(contractId, transaction)).filter(
    (e) => String(e.payload.effectiveDate) <= date,
  );

  return String(moves.at(-1)?.payload.effectiveDate ?? contract.startDate);
}

/**
 * ST-14: old-room utility segments to bill as separate lines in `period` (the month after the
 * move). `oldEntryDate` is when the contract entered the old room; readings of the old room
 * before it belong to someone else.
 */
export async function contractRoomClosingsForPeriod(
  contractId: string,
  period: string,
  transaction?: Transaction,
) {
  const contract = await ContractModel.findByPk(contractId, { transaction, rejectOnEmpty: true });
  const moves = await roomChanges(contractId, transaction);

  return moves.flatMap((e, index) =>
    e.payload.utilityPeriod === period
      ? [
          {
            eventId: e.id,
            oldRoomId: String(e.payload.oldRoomId),
            newRoomId: String(e.payload.roomId),
            effectiveDate: String(e.payload.effectiveDate),
            oldEntryDate: String(moves[index - 1]?.payload.effectiveDate ?? contract.startDate),
            oldInitialElectric: Number(e.payload.oldInitialElectric),
            oldInitialWater: Number(e.payload.oldInitialWater),
            closingElectric: Number(e.payload.closingElectric),
            closingWater: Number(e.payload.closingWater),
            initialElectric: Number(e.payload.initialElectric),
            initialWater: Number(e.payload.initialWater),
          },
        ]
      : [],
  );
}
