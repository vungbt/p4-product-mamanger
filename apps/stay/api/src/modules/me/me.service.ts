import { selectFields } from '@p4/server-core';
import {
  STAY_CONTRACT_VERSION,
  type StayCapabilities,
  type StayMe,
  type StayUser,
  stayAbilityKit,
} from '@stay/shared';
import { abilityOf } from '@/middlewares/ability.middleware.js';
import {
  BuildingMemberModel,
  ContractOccupantModel,
  TenantModel,
  UserModel,
} from '@/sequelize/models/index.js';
import { contractContext, portalOpen } from '../portal/portal.access.js';

/** The request user of an active account, with its building/contract scope; else `undefined`. */
export async function loadActiveUser(id: string): Promise<StayUser | undefined> {
  const row = await UserModel.findByPk(id);

  if (row?.accountStatus !== 'active') return undefined;

  const memberships =
    row.role === 'manager'
      ? await BuildingMemberModel.findAll({ where: { userId: id }, attributes: ['buildingId'] })
      : [];

  const tenant =
    row.role === 'tenant' ? await TenantModel.findOne({ where: { userId: id } }) : null;
  const occupants = tenant
    ? await ContractOccupantModel.findAll({ where: { tenantId: tenant.id } })
    : [];

  const contractIds: string[] = [];
  const occupiedContracts: { id: string; code: string }[] = [];

  for (const contractId of new Set(occupants.map((occupant) => occupant.contractId))) {
    const context = await contractContext(contractId);

    if (tenant && context && portalOpen(context.contract, context.occupants, tenant.id)) {
      contractIds.push(contractId);
      occupiedContracts.push({ id: contractId, code: context.contract.code });
    }
  }

  return {
    mustChangePassword: row.mustChangePassword,
    ...selectFields(row, ['id', 'email', 'displayName', 'avatarUrl', 'emailVerified', 'role']),
    permissionGroups: row.permissionGroups,
    buildingIds: memberships.map((member) => member.buildingId),
    contractIds,
    occupiedContracts,
  };
}

export async function getMe(user: StayUser): Promise<StayMe> {
  return { user };
}

export async function getCapabilities(user: StayUser): Promise<StayCapabilities> {
  return {
    contractVersion: STAY_CONTRACT_VERSION,
    rules: stayAbilityKit.abilityRules(abilityOf(user)),
  };
}
