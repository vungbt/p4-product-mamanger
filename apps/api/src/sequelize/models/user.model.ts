import type { Role } from '@p4/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  avatarId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserCreation = Optional<UserAttributes, 'id' | 'avatarId' | 'createdAt' | 'updatedAt'>;

export class UserModel extends Model<UserAttributes, UserCreation> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
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
        allowNull: false,
        field: 'password_hash',
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
