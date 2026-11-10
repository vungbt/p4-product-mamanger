/** Room occupants and cross-module usage; invoices remain ST-14/ST-18 extension points. */
import { isoDateInTimeZone, type RoomInvoiceSummary, type RoomOccupant } from '@stay/shared';
import { literal, Op, QueryTypes, type Transaction } from 'sequelize';
import {
  ContractModel,
  ContractOccupantModel,
  sequelize,
  TenantModel,
} from '@/sequelize/models/index.js';

/** Latest recorded reading per meter id (ST-13). */
export interface LatestReading {
  reading: number;
  period: string;
}

/** Unpaid total of issued invoices per room id (ST-14/ST-18); rooms without debt are absent. */
export async function roomDebts(_roomIds: readonly string[]): Promise<Map<string, number>> {
  return new Map();
}

/** People living in the room under its holding contract, primary tenant first (ST-10). */
export async function roomOccupants(roomId: string): Promise<RoomOccupant[]> {
  const today = isoDateInTimeZone(new Date());
  const contract = await ContractModel.findOne({
    where: {
      [Op.and]: literal(
        `stay_contract_room_at("ContractModel".id, '${today}') = '${roomId}'::uuid`,
      ),
      status: { [Op.in]: ['active', 'ending'] },
    },
  });
  if (!contract) return [];
  const links = await ContractOccupantModel.findAll({
    where: {
      contractId: contract.id,
      fromDate: { [Op.lte]: today },
      [Op.or]: [{ toDate: null }, { toDate: { [Op.gt]: today } }],
    },
    order: [
      ['isPrimary', 'DESC'],
      ['id', 'ASC'],
    ],
  });
  const tenants = await TenantModel.findAll({
    where: { id: { [Op.in]: links.map((o) => o.tenantId) } },
  });

  return links.map((o) => ({
    tenantId: o.tenantId,
    fullName: tenants.find((t) => t.id === o.tenantId)?.fullName ?? '',
    phone: tenants.find((t) => t.id === o.tenantId)?.phone ?? null,
    isPrimary: o.isPrimary,
    fromDate: o.fromDate,
  }));
}

/** The room's latest invoices, newest first (ST-14). */
export async function roomRecentInvoices(
  _roomId: string,
  _limit: number,
): Promise<RoomInvoiceSummary[]> {
  return [];
}

/** Latest reading per meter id (ST-13); meters without readings are absent. */
export async function latestMeterReadings(
  meterIds: readonly string[],
  transaction?: Transaction,
): Promise<Map<string, LatestReading>> {
  if (!meterIds.length) return new Map();
  const rows = await sequelize.query<{ meterId: string; reading: string; period: string }>(
    `SELECT DISTINCT ON (meter_id) meter_id AS "meterId", reading, period
     FROM meter_readings WHERE meter_id IN (:meterIds)
     ORDER BY meter_id, period DESC, id DESC`,
    { replacements: { meterIds: [...meterIds] }, type: QueryTypes.SELECT, transaction },
  );

  return new Map(
    rows.map((row) => [row.meterId, { reading: Number(row.reading), period: row.period }]),
  );
}
