import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface PaymentAttemptAttributes {
  id: string;
  paymentId: string;
  orderId: string;
  provider: import('@p4/shared').PaymentProvider;
  status: import('@p4/shared').PaymentAttemptStatus;
  amount: number;
  version: number;
  currency: string;
  externalId: string | null;
  providerTransactionId: string | null;
  checkoutUrl: string | null;
  reconciliation: 'unreconciled' | 'matched' | 'late_paid' | 'duplicate_charge' | 'mismatch';
  paidAt: Date | null;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaymentAttemptModel
  extends Model<PaymentAttemptAttributes>
  implements PaymentAttemptAttributes
{
  declare id: string;
  declare paymentId: string;
  declare orderId: string;
  declare provider: import('@p4/shared').PaymentProvider;
  declare status: import('@p4/shared').PaymentAttemptStatus;
  declare amount: number;
  declare version: number;
  declare currency: string;
  declare externalId: string | null;
  declare providerTransactionId: string | null;
  declare checkoutUrl: string | null;
  declare reconciliation:
    | 'unreconciled'
    | 'matched'
    | 'late_paid'
    | 'duplicate_charge'
    | 'mismatch';
  declare paidAt: Date | null;
  declare expiresAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initPaymentAttemptModel(sequelize: Sequelize) {
  PaymentAttemptModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      paymentId: { type: DataTypes.UUID, allowNull: false },
      orderId: { type: DataTypes.UUID, allowNull: false },
      provider: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.INTEGER, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
      currency: { type: DataTypes.STRING, allowNull: false },
      externalId: { type: DataTypes.STRING, allowNull: true },
      providerTransactionId: { type: DataTypes.STRING, allowNull: true },
      checkoutUrl: { type: DataTypes.STRING, allowNull: true },
      reconciliation: { type: DataTypes.STRING, allowNull: false },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    { sequelize, tableName: 'payment_attempts', underscored: true },
  );
}
