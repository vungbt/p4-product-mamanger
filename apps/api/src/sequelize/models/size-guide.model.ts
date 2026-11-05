import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface SizeGuideAttributes {
  id: string;
  name: string;
  measurements: import('@p4/shared').JsonValue;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SizeGuideModel extends Model<SizeGuideAttributes> implements SizeGuideAttributes {
  declare id: string;
  declare name: string;
  declare measurements: import('@p4/shared').JsonValue;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initSizeGuideModel(sequelize: Sequelize) {
  SizeGuideModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      measurements: { type: DataTypes.JSONB, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'size_guides', underscored: true },
  );
}
