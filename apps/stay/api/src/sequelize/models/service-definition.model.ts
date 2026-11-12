import type { ServiceKind } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** System service catalogue. `kind` and `code` never change; services are deactivated, not deleted. */
export interface ServiceDefinitionAttributes {
  id: string;
  code: string;
  name: string;
  /** Optional note shown under the name, at most 500 characters. */
  description: string | null;
  kind: ServiceKind;
  unit: string;
  defaultPrice: number;
  active: boolean;
  sortOrder: number;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ServiceDefinitionCreation = Optional<
  ServiceDefinitionAttributes,
  'id' | 'description' | 'active' | 'sortOrder' | 'version' | 'createdAt' | 'updatedAt'
>;

export class ServiceDefinitionModel
  extends Model<ServiceDefinitionAttributes, ServiceDefinitionCreation>
  implements ServiceDefinitionAttributes
{
  declare id: string;
  declare code: string;
  declare name: string;
  declare description: string | null;
  declare kind: ServiceKind;
  declare unit: string;
  declare defaultPrice: number;
  declare active: boolean;
  declare sortOrder: number;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initServiceDefinitionModel(sequelize: Sequelize) {
  ServiceDefinitionModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      kind: { type: DataTypes.STRING(16), allowNull: false },
      unit: { type: DataTypes.STRING(20), allowNull: false },
      defaultPrice: {
        type: DataTypes.BIGINT,
        allowNull: false,
        // pg returns BIGINT as a string; amounts stay within the safe integer range.
        get() {
          return Number(this.getDataValue('defaultPrice'));
        },
      },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'service_definitions', underscored: true, version: true },
  );
}
