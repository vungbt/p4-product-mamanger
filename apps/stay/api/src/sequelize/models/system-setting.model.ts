import type { JsonValue } from '@p4/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** One JSON document per `key` (`billing`); parse `value` before use. */
export interface SystemSettingAttributes {
  id: string;
  key: string;
  value: JsonValue;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SystemSettingCreation = Optional<
  SystemSettingAttributes,
  'id' | 'version' | 'createdAt' | 'updatedAt'
>;

export class SystemSettingModel
  extends Model<SystemSettingAttributes, SystemSettingCreation>
  implements SystemSettingAttributes
{
  declare id: string;
  declare key: string;
  declare value: JsonValue;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initSystemSettingModel(sequelize: Sequelize) {
  SystemSettingModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      key: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      value: { type: DataTypes.JSONB, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'system_settings', underscored: true, version: true },
  );
}
