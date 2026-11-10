import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface DepositEntryAttributes {
  id: string;
  contractId: string;
  type: 'received' | 'applied' | 'refunded' | 'forfeited';
  amount: number;
  method: 'cash' | 'bank_transfer' | 'other';
  occurredOn: string;
  note: string | null;
  invoiceId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DepositEntryModel extends Model<
  DepositEntryAttributes,
  Optional<DepositEntryAttributes, 'id' | 'createdAt' | 'updatedAt' | 'note' | 'invoiceId'>
> {
  declare id: string;
  declare contractId: string;
  declare type: 'received' | 'applied' | 'refunded' | 'forfeited';
  declare amount: number;
  declare method: 'cash' | 'bank_transfer' | 'other';
  declare occurredOn: string;
  declare note: string | null;
  declare invoiceId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initDepositEntryModel(sequelize: Sequelize) {
  DepositEntryModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      contractId: { type: DataTypes.UUID, allowNull: false },
      type: { type: DataTypes.STRING(16), allowNull: false },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('amount'));
        },
      },
      method: { type: DataTypes.STRING(16), allowNull: false },
      occurredOn: { type: DataTypes.DATEONLY, allowNull: false },
      note: { type: DataTypes.TEXT, allowNull: true },
      invoiceId: { type: DataTypes.UUID, allowNull: true },
    },
    { sequelize, tableName: 'deposit_entries', underscored: true },
  );
}
