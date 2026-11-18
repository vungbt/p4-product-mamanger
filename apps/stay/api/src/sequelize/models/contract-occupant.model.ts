import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ContractOccupantAttributes {
  id: string;
  contractId: string;
  tenantId: string;
  isPrimary: boolean;
  fromDate: string;
  toDate: string | null;
  registeredOn: string | null;
  registrationNote: string | null;
  registeredBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContractOccupantModel extends Model<
  ContractOccupantAttributes,
  Optional<
    ContractOccupantAttributes,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'toDate'
    | 'registeredOn'
    | 'registrationNote'
    | 'registeredBy'
  >
> {
  declare id: string;
  declare contractId: string;
  declare tenantId: string;
  declare isPrimary: boolean;
  declare fromDate: string;
  declare toDate: string | null;
  declare registeredOn: string | null;
  declare registrationNote: string | null;
  declare registeredBy: string | null;
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
      registeredOn: { type: DataTypes.DATEONLY, allowNull: true },
      registrationNote: { type: DataTypes.STRING(2000), allowNull: true },
      registeredBy: { type: DataTypes.UUID, allowNull: true },
    },
    { sequelize, tableName: 'contract_occupants', underscored: true },
  );
}
