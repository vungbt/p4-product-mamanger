import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type RefundStatus = 'pending' | 'completed' | 'failed';

export interface RefundAttributes {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  status: RefundStatus;
  reason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RefundCreation = Optional<
  RefundAttributes,
  'id' | 'status' | 'reason' | 'createdAt' | 'updatedAt'
>;

export class RefundModel
  extends Model<RefundAttributes, RefundCreation>
  implements RefundAttributes
{
  declare id: string;
  declare paymentId: string;
  declare orderId: string;
  declare amount: number;
  declare status: RefundStatus;
  declare reason: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initRefundModel(sequelize: Sequelize) {
  RefundModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      paymentId: { type: DataTypes.UUID, allowNull: false, field: 'payment_id' },
      orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
      amount: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reason: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'refunds', underscored: true },
  );
  return RefundModel;
}
