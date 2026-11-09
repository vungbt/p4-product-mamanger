import type { StayAccountStatus, StayRole } from '@stay/shared';
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
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initUserModel(sequelize: Sequelize) {
  UserModel.init(
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
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
