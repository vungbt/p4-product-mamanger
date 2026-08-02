import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type PaymentProvider = 'mock';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface PaymentAttributes {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  amount: number;
  status: PaymentStatus;
  externalId: string | null;
  paidAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentCreation = Optional<
  PaymentAttributes,
  'id' | 'provider' | 'status' | 'externalId' | 'paidAt' | 'createdAt' | 'updatedAt'
>;

export class PaymentModel
  extends Model<PaymentAttributes, PaymentCreation>
  implements PaymentAttributes
{
  declare id: string;
  declare orderId: string;
  declare provider: PaymentProvider;
  declare amount: number;
  declare status: PaymentStatus;
  declare externalId: string | null;
  declare paidAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initPaymentModel(sequelize: Sequelize) {
  PaymentModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'order_id',
      },
      provider: {
        type: DataTypes.ENUM('mock'),
        allowNull: false,
        defaultValue: 'mock',
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      externalId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'external_id',
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_at',
      },
    },
    {
      sequelize,
      tableName: 'payments',
      underscored: true,
    },
  );
  return PaymentModel;
}
