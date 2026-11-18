import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ContractVehicleAttributes {
  id: string;
  contractId: string;
  vehicleId: string;
  fromDate: string;
  toDate: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContractVehicleModel extends Model<
  ContractVehicleAttributes,
  Optional<ContractVehicleAttributes, 'id' | 'createdAt' | 'updatedAt' | 'toDate'>
> {
  declare id: string;
  declare contractId: string;
  declare vehicleId: string;
  declare fromDate: string;
  declare toDate: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContractVehicleModel(sequelize: Sequelize) {
  ContractVehicleModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      contractId: { type: DataTypes.UUID, allowNull: false },
      vehicleId: { type: DataTypes.UUID, allowNull: false },
      fromDate: { type: DataTypes.DATEONLY, allowNull: false },
      toDate: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { sequelize, tableName: 'contract_vehicles', underscored: true },
  );
}
