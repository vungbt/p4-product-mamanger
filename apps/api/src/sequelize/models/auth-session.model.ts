import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface AuthSessionAttributes {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthSessionModel
  extends Model<AuthSessionAttributes>
  implements AuthSessionAttributes
{
  declare id: string;
  declare userId: string;
  declare token: string;
  declare expiresAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initAuthSessionModel(sequelize: Sequelize) {
  AuthSessionModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      token: { type: DataTypes.TEXT, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { sequelize, tableName: 'auth_sessions', underscored: true },
  );
}
