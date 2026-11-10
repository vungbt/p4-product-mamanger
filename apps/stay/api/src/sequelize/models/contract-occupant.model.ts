import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ContractOccupantAttributes {
  id: string;
  contractId: string;
  tenantId: string;
  isPrimary: boolean;
  fromDate: string;
  toDate: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContractOccupantModel extends Model<
  ContractOccupantAttributes,
  Optional<ContractOccupantAttributes, 'id' | 'createdAt' | 'updatedAt' | 'toDate'>
> {
  declare id: string;
  declare contractId: string;
  declare tenantId: string;
  declare isPrimary: boolean;
  declare fromDate: string;
  declare toDate: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContractOccupantModel(sequelize: Sequelize) {
  ContractOccupantModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      contractId: { type: DataTypes.UUID, allowNull: false },
      tenantId: { type: DataTypes.UUID, allowNull: false },
      isPrimary: { type: DataTypes.BOOLEAN, allowNull: false },
      fromDate: { type: DataTypes.DATEONLY, allowNull: false },
      toDate: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { sequelize, tableName: 'contract_occupants', underscored: true },
  );
}
