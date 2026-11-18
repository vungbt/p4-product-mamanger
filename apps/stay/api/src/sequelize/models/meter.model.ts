import type { MeterKind } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/**
 * An electricity or water meter of a room. Replacing a meter (ST-13) sets `removedOn` and
 * `finalReading` on the old row and opens a new one; one meter of each kind is in service.
 */
export interface MeterAttributes {
  id: string;
  roomId: string;
  kind: MeterKind;
  serial: string | null;
  /** `YYYY-MM-DD` (`DATE`). */
  installedOn: string;
  initialReading: number;
  removedOn: string | null;
  finalReading: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MeterCreation = Optional<
  MeterAttributes,
  'id' | 'serial' | 'removedOn' | 'finalReading' | 'createdAt' | 'updatedAt'
>;

export class MeterModel extends Model<MeterAttributes, MeterCreation> implements MeterAttributes {
  declare id: string;
  declare roomId: string;
  declare kind: MeterKind;
  declare serial: string | null;
  declare installedOn: string;
  declare initialReading: number;
  declare removedOn: string | null;
  declare finalReading: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initMeterModel(sequelize: Sequelize) {
  MeterModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      roomId: { type: DataTypes.UUID, allowNull: false },
      kind: { type: DataTypes.STRING(16), allowNull: false },
      serial: { type: DataTypes.STRING(40), allowNull: true },
      installedOn: { type: DataTypes.DATEONLY, allowNull: false },
      // pg returns BIGINT as a string; readings stay within the safe integer range.
      initialReading: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('initialReading'));
        },
      },
      removedOn: { type: DataTypes.DATEONLY, allowNull: true },
      finalReading: {
        type: DataTypes.BIGINT,
        allowNull: true,
        get() {
          const value = this.getDataValue('finalReading');

          return value === null ? null : Number(value);
        },
      },
    },
    { sequelize, tableName: 'meters', underscored: true },
  );
}
