import { selectFields } from '@p4/server-core';
import {
  STAY_CONTRACT_VERSION,
  type StayCapabilities,
  type StayMe,
  type StayUser,
  stayAbilityKit,
} from '@stay/shared';
import { abilityOf } from '@/middlewares/ability.middleware.js';
import { BuildingMemberModel, UserModel } from '@/sequelize/models/index.js';

/** The request user of an active account, with its building/contract scope; else `undefined`. */
export async function loadActiveUser(id: string): Promise<StayUser | undefined> {
  const row = await UserModel.findByPk(id);

  if (row?.accountStatus !== 'active') return undefined;

  const memberships =
    row.role === 'manager'
      ? await BuildingMemberModel.findAll({ where: { userId: id }, attributes: ['buildingId'] })
      : [];

  return {
    ...selectFields(row, ['id', 'email', 'displayName', 'avatarUrl', 'emailVerified', 'role']),
    permissionGroups: row.permissionGroups,
    buildingIds: memberships.map((member) => member.buildingId),
    // Tenant contracts arrive with the tenant portal (ST-25).
    contractIds: [],
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
