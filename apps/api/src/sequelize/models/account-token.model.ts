import type { AccountTokenPurpose, JsonValue } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface AccountTokenAttributes {
  id: string;
  userId: string;
  purpose: AccountTokenPurpose;
  tokenHash: string;
  data: JsonValue;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
export class AccountTokenModel
  extends Model<AccountTokenAttributes>
  implements AccountTokenAttributes
{
  declare id: string;
  declare userId: string;
  declare purpose: AccountTokenPurpose;
  declare tokenHash: string;
  declare data: JsonValue;
  declare expiresAt: Date;
  declare consumedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initAccountTokenModel(sequelize: Sequelize) {
  AccountTokenModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      purpose: { type: DataTypes.STRING, allowNull: false },
      tokenHash: { type: DataTypes.STRING, allowNull: false, unique: true },
      data: { type: DataTypes.JSONB, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      consumedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: 'account_tokens', underscored: true },
  );
}
