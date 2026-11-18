import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ContractEventAttributes {
  id: string;
  contractId: string;
  type: string;
  payload: Record<string, string | number | boolean | null>;
  actorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContractEventModel extends Model<
  ContractEventAttributes,
  Optional<ContractEventAttributes, 'id' | 'createdAt' | 'updatedAt' | 'payload'>
> {
  declare id: string;
  declare contractId: string;
  declare type: string;
  declare payload: Record<string, string | number | boolean | null>;
  declare actorId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContractEventModel(sequelize: Sequelize) {
  ContractEventModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      contractId: { type: DataTypes.UUID, allowNull: false },
      type: { type: DataTypes.STRING(64), allowNull: false },
      payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      actorId: { type: DataTypes.UUID, allowNull: false },
    },
    { sequelize, tableName: 'contract_events', underscored: true },
  );
}
