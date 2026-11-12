import {
  MANAGER_PERMISSION_GROUPS,
  type ManagerPermissionGroup,
  type StayAccountStatus,
  type StayRole,
} from '@stay/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';

/** Better Auth owns writes to `users`; the API reads it to build the request user. */
export interface UserAttributes {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  avatarUrl: string | null;
  role: StayRole;
  accountStatus: StayAccountStatus;
  permissionGroups?: ManagerPermissionGroup[];
  version?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserModel extends Model<UserAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare displayName: string;
  declare emailVerified: boolean;
  declare avatarUrl: string | null;
  declare role: StayRole;
  declare accountStatus: StayAccountStatus;
  declare permissionGroups: ManagerPermissionGroup[];
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initUserModel(sequelize: Sequelize) {
  UserModel.init(
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      permissionGroups: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: [...MANAGER_PERMISSION_GROUPS],
      },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      email: { type: DataTypes.TEXT, allowNull: false },
      displayName: { type: DataTypes.TEXT, allowNull: false },
      emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      avatarUrl: { type: DataTypes.TEXT, allowNull: true },
      role: { type: DataTypes.TEXT, allowNull: false },
      accountStatus: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'active' },
    },
    { sequelize, tableName: 'users', underscored: true },
  );
}
