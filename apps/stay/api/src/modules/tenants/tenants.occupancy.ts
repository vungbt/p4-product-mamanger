import {
  isoDateInTimeZone,
  type TenantContractRef,
  type TenantRoomRef,
  type TenantStatus,
} from '@stay/shared';
import { literal, Op, type Transaction, type WhereOptions } from 'sequelize';
import { ContractModel, ContractOccupantModel, RoomModel } from '@/sequelize/models/index.js';
import type { TenantAttributes } from '@/sequelize/models/tenant.model.js';

import { contractFactsAt } from '../contracts/contracts.resolvers.js';

export interface TenantOccupancy {
  status: TenantStatus;
  currentRoom: TenantRoomRef | null;
}

/** Status is derived on the business date; a future reservation is not yet living. */
export async function tenantOccupancy(
  tenantIds: readonly string[],
  transaction?: Transaction,
): Promise<Map<string, TenantOccupancy>> {
  const result = new Map<string, TenantOccupancy>(
    tenantIds.map((id) => [id, { status: 'no_contract', currentRoom: null }]),
  );
  if (!tenantIds.length) return result;
  const today = isoDateInTimeZone(new Date());
  const links = await ContractOccupantModel.findAll({
    where: { tenantId: { [Op.in]: [...tenantIds] } },
    transaction,
  });
  const contracts = await ContractModel.findAll({
    where: { id: { [Op.in]: links.map((l) => l.contractId) } },
    transaction,
  });
  const facts = new Map(
    await Promise.all(
      contracts.map(async (c) => [c.id, await contractFactsAt(c.id, today, transaction)] as const),
    ),
  );
  const rooms = await RoomModel.findAll({
    where: { id: { [Op.in]: [...facts.values()].map((c) => c.roomId) } },
    transaction,
  });

  for (const link of links) {
    const c = contracts.find((c) => c.id === link.contractId);
    if (!c || c.status === 'draft' || c.status === 'cancelled') continue;
    const active =
      ['active', 'ending'].includes(c.status) &&
      link.fromDate <= today &&
      (!link.toDate || link.toDate > today);
    const room = rooms.find((r) => r.id === facts.get(c.id)?.roomId);

    if (active && room)
      result.set(link.tenantId, {
        status: 'living',
        currentRoom: { id: room.id, code: room.code },
      });
    else if (
      (c.status === 'ended' || (link.toDate && link.toDate <= today)) &&
      result.get(link.tenantId)?.status !== 'living'
    )
      result.set(link.tenantId, { status: 'left', currentRoom: null });
  }
  return result;
}

export function tenantStatusWhere(status: TenantStatus): WhereOptions<TenantAttributes> {
  const today = isoDateInTimeZone(new Date());
  const join = `SELECT 1 FROM contract_occupants co JOIN contracts c ON c.id = co.contract_id WHERE co.tenant_id = "TenantModel".id`;
  const living = `EXISTS (${join} AND c.status IN ('active','ending') AND co.from_date <= '${today}' AND (co.to_date IS NULL OR co.to_date > '${today}'))`;
  const left = `EXISTS (${join} AND (c.status = 'ended' OR (c.status IN ('active','ending') AND co.to_date <= '${today}')))`;

  return literal(
    status === 'living'
      ? living
      : status === 'left'
        ? `NOT ${living} AND ${left}`
        : `NOT ${living} AND NOT ${left}`,
  );
}

export async function tenantContracts(tenantId: string): Promise<TenantContractRef[]> {
  const links = await ContractOccupantModel.findAll({
    where: { tenantId },
    order: [
      ['fromDate', 'DESC'],
      ['id', 'ASC'],
    ],
  });
  const contracts = await ContractModel.findAll({
    where: { id: { [Op.in]: links.map((l) => l.contractId) } },
  });
  const facts = new Map(
    await Promise.all(
      contracts.map(
        async (c) => [c.id, await contractFactsAt(c.id, isoDateInTimeZone(new Date()))] as const,
      ),
    ),
  );
  const rooms = await RoomModel.findAll({
    where: { id: { [Op.in]: [...facts.values()].map((c) => c.roomId) } },
  });
  const result: TenantContractRef[] = [];

  for (const l of links) {
    const c = contracts.find((c) => c.id === l.contractId);
    const r = rooms.find((r) => r.id === (c ? facts.get(c.id)?.roomId : undefined));

    if (c && r)
      result.push({
        id: c.id,
        code: c.code,
        room: { id: r.id, code: r.code },
        status: c.status,
        fromDate: l.fromDate,
        toDate: l.toDate,
      });
  }
  return result;
}

export async function tenantHasActiveContract(
  tenantId: string,
  transaction?: Transaction,
): Promise<boolean> {
  const links = await ContractOccupantModel.findAll({
    where: { tenantId, toDate: { [Op.is]: null } },
    transaction,
  });

  return (
    (await ContractModel.count({
      where: {
        id: { [Op.in]: links.map((l) => l.contractId) },
        status: { [Op.in]: ['active', 'ending'] },
      },
      transaction,
    })) > 0
  );
}
