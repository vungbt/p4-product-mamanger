import { Op, type Transaction } from 'sequelize';
import {
  ContractEventModel,
  ContractModel,
  ContractOccupantModel,
  ContractServiceModel,
  ContractVehicleModel,
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

/** ST-14 replaces this hook with a check of issued, non-void invoices. */
export async function periodIsInvoiced(_contractId: string, _period: string): Promise<boolean> {
  return false;
}

/** ST-14: bill these closed-room utility segments as separate lines in utilityPeriod. */
export async function contractRoomClosingsForPeriod(
  contractId: string,
  period: string,
  transaction?: Transaction,
) {
  const events = await ContractEventModel.findAll({
    where: { contractId, type: 'room-change' },
    order: [['createdAt', 'ASC']],
    transaction,
  });
  return events
    .filter((e) => e.payload.utilityPeriod === period)
    .map((e) => ({ eventId: e.id, ...e.payload }));
}
