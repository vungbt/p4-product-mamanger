import type { VehicleType } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** A tenant's vehicle; contracts bill parking per vehicle (ST-10, ST-12). */
export interface VehicleAttributes {
  id: string;
  tenantId: string;
  plate: string;
  /** `plate` without separators (unique per tenant). */
  plateKey: string;
  type: VehicleType;
  note: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type VehicleCreation = Optional<
  VehicleAttributes,
  'id' | 'note' | 'createdAt' | 'updatedAt'
>;

export class VehicleModel
  extends Model<VehicleAttributes, VehicleCreation>
  implements VehicleAttributes
{
  declare id: string;
  declare tenantId: string;
  declare plate: string;
  declare plateKey: string;
  declare type: VehicleType;
  declare note: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initVehicleModel(sequelize: Sequelize) {
  VehicleModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      tenantId: { type: DataTypes.UUID, allowNull: false },
      plate: { type: DataTypes.STRING(16), allowNull: false },
      plateKey: { type: DataTypes.STRING(16), allowNull: false },
      type: { type: DataTypes.STRING(16), allowNull: false },
      note: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'vehicles', underscored: true },
  );
}
