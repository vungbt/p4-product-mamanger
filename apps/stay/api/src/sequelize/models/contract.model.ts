import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ContractAttributes {
  id: string;
  buildingId: string;
  roomId: string;
  code: string;
  status: 'draft' | 'active' | 'ending' | 'ended' | 'cancelled';
  startDate: string;
  endDate: string | null;
  noticeDate: string | null;
  movedOutAt: string | null;
  rent: number;
  depositAmount: number;
  depositCollected: boolean;
  depositMethod: 'cash' | 'bank_transfer' | 'other';
  depositDate: string | null;
  initialElectricPhotoFileId: string | null;
  initialWaterPhotoFileId: string | null;
  depositNote: string | null;
  initialElectric: number;
  initialWater: number;
  note: string | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContractModel extends Model<
  ContractAttributes,
  Optional<
    ContractAttributes,
    | 'initialElectricPhotoFileId'
    | 'initialWaterPhotoFileId'
    | 'depositNote'
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'endDate'
    | 'noticeDate'
    | 'movedOutAt'
    | 'depositDate'
    | 'note'
    | 'version'
  >
> {
  declare id: string;
  declare buildingId: string;
  declare roomId: string;
  declare code: string;
  declare status: 'draft' | 'active' | 'ending' | 'ended' | 'cancelled';
  declare startDate: string;
  declare endDate: string | null;
  declare noticeDate: string | null;
  declare movedOutAt: string | null;
  declare rent: number;
  declare depositAmount: number;
  declare depositCollected: boolean;
  declare depositMethod: 'cash' | 'bank_transfer' | 'other';
  declare depositDate: string | null;
  declare initialElectricPhotoFileId: string | null;
  declare initialWaterPhotoFileId: string | null;
  declare depositNote: string | null;
  declare initialElectric: number;
  declare initialWater: number;
  declare note: string | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContractModel(sequelize: Sequelize) {
  ContractModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      roomId: { type: DataTypes.UUID, allowNull: false },
      code: { type: DataTypes.STRING(64), allowNull: false },
      status: { type: DataTypes.STRING(16), allowNull: false },
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      endDate: { type: DataTypes.DATEONLY, allowNull: true },
      noticeDate: { type: DataTypes.DATEONLY, allowNull: true },
      movedOutAt: { type: DataTypes.DATEONLY, allowNull: true },
      rent: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('rent'));
        },
      },
      depositAmount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('depositAmount'));
        },
      },
      depositCollected: { type: DataTypes.BOOLEAN, allowNull: false },
      depositMethod: { type: DataTypes.STRING(16), allowNull: false },
      depositDate: { type: DataTypes.DATEONLY, allowNull: true },
      initialElectricPhotoFileId: { type: DataTypes.UUID, allowNull: true },
      initialWaterPhotoFileId: { type: DataTypes.UUID, allowNull: true },
      depositNote: { type: DataTypes.TEXT, allowNull: true },
      initialElectric: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('initialElectric'));
        },
      },
      initialWater: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('initialWater'));
        },
      },
      note: { type: DataTypes.TEXT, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'contracts', underscored: true, version: true },
  );
}
