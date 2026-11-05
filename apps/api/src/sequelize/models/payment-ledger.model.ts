import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface PaymentLedgerAttributes {
  id: string;
  attemptId: string;
  orderId: string;
  kind: 'capture' | 'refund';
  amount: number;
  currency: string;
  provider: string;
  reference: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentLedgerModel
  extends Model<PaymentLedgerAttributes>
  implements PaymentLedgerAttributes
{
  declare id: string;
  declare attemptId: string;
  declare orderId: string;
  declare kind: 'capture' | 'refund';
  declare amount: number;
  declare currency: string;
  declare provider: string;
  declare reference: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initPaymentLedgerModel(sequelize: Sequelize) {
  PaymentLedgerModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      attemptId: { type: DataTypes.UUID, allowNull: false },
      orderId: { type: DataTypes.UUID, allowNull: false },
      kind: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.INTEGER, allowNull: false },
      currency: { type: DataTypes.STRING, allowNull: false },
      provider: { type: DataTypes.STRING, allowNull: false },
      reference: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, tableName: 'payment_ledger', underscored: true },
  );
}
