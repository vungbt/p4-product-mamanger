import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/**
 * A room of a building. Only the maintenance switch is stored: vacant/reserved/occupied derive
 * from contracts (`modules/rooms/room-status.ts`). `code` is unique among the building's active
 * (non-archived) rooms.
 */
export interface RoomAttributes {
  id: string;
  buildingId: string;
  code: string;
  floor: number;
  areaM2: number | null;
  listPrice: number;
  maxOccupants: number;
  maintenance: boolean;
  maintenanceReason: string | null;
  /** `YYYY-MM-DD` (`DATE`). */
  maintenanceUntil: string | null;
  note: string | null;
  archivedAt: Date | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RoomCreation = Optional<
  RoomAttributes,
  | 'id'
  | 'areaM2'
  | 'maintenance'
  | 'maintenanceReason'
  | 'maintenanceUntil'
  | 'note'
  | 'archivedAt'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
>;

export class RoomModel extends Model<RoomAttributes, RoomCreation> implements RoomAttributes {
  declare id: string;
  declare buildingId: string;
  declare code: string;
  declare floor: number;
  declare areaM2: number | null;
  declare listPrice: number;
  declare maxOccupants: number;
  declare maintenance: boolean;
  declare maintenanceReason: string | null;
  declare maintenanceUntil: string | null;
  declare note: string | null;
  declare archivedAt: Date | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initRoomModel(sequelize: Sequelize) {
  RoomModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      code: { type: DataTypes.STRING(12), allowNull: false },
      floor: { type: DataTypes.SMALLINT, allowNull: false },
      areaM2: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
        // pg returns NUMERIC as a string.
        get() {
          const value = this.getDataValue('areaM2');

          return value === null ? null : Number(value);
        },
      },
      listPrice: {
        type: DataTypes.BIGINT,
        allowNull: false,
        // pg returns BIGINT as a string; amounts stay within the safe integer range.
        get() {
          return Number(this.getDataValue('listPrice'));
        },
      },
      maxOccupants: { type: DataTypes.SMALLINT, allowNull: false },
      maintenance: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      maintenanceReason: { type: DataTypes.STRING(255), allowNull: true },
      maintenanceUntil: { type: DataTypes.DATEONLY, allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: true },
      archivedAt: { type: DataTypes.DATE, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'rooms', underscored: true, version: true },
  );
}
