import type { TenantContractRef, TenantRoomRef, TenantStatus } from '@stay/shared';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import type { TenantAttributes } from '@/sequelize/models/tenant.model.js';

/**
 * Tenant occupancy derived from contracts. ST-09 has no contracts yet, so every tenant is
 * `no_contract`; ST-10 replaces these functions with queries on `contract_occupants`
 * (active contract → `living` + its room, only ended ones → `left`). Keep every caller going
 * through this file so the status is derived in one place.
 */

export interface TenantOccupancy {
  status: TenantStatus;
  currentRoom: TenantRoomRef | null;
}

const NO_CONTRACT: TenantOccupancy = { status: 'no_contract', currentRoom: null };

/** Status and current room of each tenant id. */
export async function tenantOccupancy(
  tenantIds: readonly string[],
  _transaction?: Transaction,
): Promise<Map<string, TenantOccupancy>> {
  return new Map(tenantIds.map((id) => [id, NO_CONTRACT]));
}

/** `WHERE` restricting tenants to one derived status (`GET /api/tenants?status=`). */
export function tenantStatusWhere(status: TenantStatus): WhereOptions<TenantAttributes> {
  // Without contracts nobody is living or has left.
  return status === 'no_contract' ? {} : { id: { [Op.in]: [] } };
}

/** Contracts the tenant occupies or occupied, newest first (O-12). */
export async function tenantContracts(_tenantId: string): Promise<TenantContractRef[]> {
  return [];
}

/** Whether the tenant is an occupant of an active contract (blocks archiving). */
export async function tenantHasActiveContract(
  _tenantId: string,
  _transaction?: Transaction,
): Promise<boolean> {
  return false;
}
