import type { Role } from '@p4/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: Role;
  avatarId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreation = Optional<
  UserAttributes,
  | 'id'
  | 'passwordHash'
  | 'googleId'
  | 'displayName'
  | 'avatarUrl'
  | 'avatarId'
  | 'createdAt'
  | 'updatedAt'
>;

export class UserModel extends Model<UserAttributes, UserCreation> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare passwordHash: string | null;
  declare googleId: string | null;
  declare displayName: string | null;
  declare avatarUrl: string | null;
  declare role: Role;
  declare avatarId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initUserModel(sequelize: Sequelize) {
  UserModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'password_hash',
      },
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        field: 'google_id',
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'display_name',
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'avatar_url',
      },
      role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false,
      },
      avatarId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'avatar_id',
      },
    },
    {
      sequelize,
      tableName: 'users',
      underscored: true,
    },
  );
  return UserModel;
}
