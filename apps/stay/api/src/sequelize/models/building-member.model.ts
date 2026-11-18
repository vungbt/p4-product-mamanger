import type { BuildingMemberRole } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** A manager's assignment to one building (ST-27). Owners need no row. */
export interface BuildingMemberAttributes {
  id: string;
  buildingId: string;
  userId: string;
  role: BuildingMemberRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BuildingMemberCreation = Optional<
  BuildingMemberAttributes,
  'id' | 'role' | 'createdAt' | 'updatedAt'
>;

export class BuildingMemberModel
  extends Model<BuildingMemberAttributes, BuildingMemberCreation>
  implements BuildingMemberAttributes
{
  declare id: string;
  declare buildingId: string;
  declare userId: string;
  declare role: BuildingMemberRole;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initBuildingMemberModel(sequelize: Sequelize) {
  BuildingMemberModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      role: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'manager' },
    },
    { sequelize, tableName: 'building_members', underscored: true },
  );
}
