import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ContractServiceAttributes {
  id: string;
  contractId: string;
  serviceId: string;
  fromDate: string;
  toDate: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContractServiceModel extends Model<
  ContractServiceAttributes,
  Optional<ContractServiceAttributes, 'id' | 'createdAt' | 'updatedAt' | 'toDate'>
> {
  declare id: string;
  declare contractId: string;
  declare serviceId: string;
  declare fromDate: string;
  declare toDate: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContractServiceModel(sequelize: Sequelize) {
  ContractServiceModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      contractId: { type: DataTypes.UUID, allowNull: false },
      serviceId: { type: DataTypes.UUID, allowNull: false },
      fromDate: { type: DataTypes.DATEONLY, allowNull: false },
      toDate: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { sequelize, tableName: 'contract_services', underscored: true },
  );
}
