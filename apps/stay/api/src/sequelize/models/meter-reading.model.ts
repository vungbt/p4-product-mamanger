import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface MeterReadingAttributes {
  id: string;
  meterId: string;
  period: string;
  reading: number;
  readOn: string;
  photoFileId: string | null;
  status: 'draft' | 'locked';
  version: number;
}

export class MeterReadingModel extends Model<
  MeterReadingAttributes,
  Optional<MeterReadingAttributes, 'id' | 'photoFileId' | 'status' | 'version'>
> {
  declare id: string;
  declare meterId: string;
  declare period: string;
  declare reading: number;
  declare readOn: string;
  declare photoFileId: string | null;
  declare status: 'draft' | 'locked';
  declare version: number;
}

export function initMeterReadingModel(sequelize: Sequelize) {
  MeterReadingModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      meterId: { type: DataTypes.UUID, allowNull: false },
      period: { type: DataTypes.CHAR(7), allowNull: false },
      reading: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('reading'));
        },
      },
      readOn: { type: DataTypes.DATEONLY, allowNull: false },
      photoFileId: { type: DataTypes.UUID, allowNull: true },
      status: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'draft' },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'meter_readings', underscored: true, version: true },
  );
}
