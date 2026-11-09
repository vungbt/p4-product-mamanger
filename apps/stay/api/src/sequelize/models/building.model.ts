import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface BuildingAttributes {
  id: string;
  code: string;
  name: string;
  archivedAt: Date | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BuildingCreation = Optional<
  BuildingAttributes,
  'id' | 'archivedAt' | 'version' | 'createdAt' | 'updatedAt'
>;

export class BuildingModel
  extends Model<BuildingAttributes, BuildingCreation>
  implements BuildingAttributes
{
  declare id: string;
  declare code: string;
  declare name: string;
  declare archivedAt: Date | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initBuildingModel(sequelize: Sequelize) {
  BuildingModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      code: { type: DataTypes.STRING(16), allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      archivedAt: { type: DataTypes.DATE, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'buildings', underscored: true, version: true },
  );
}
