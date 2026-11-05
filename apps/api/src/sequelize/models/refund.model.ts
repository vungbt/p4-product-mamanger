import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type RefundStatus = 'pending' | 'completed' | 'failed';

export interface RefundAttributes {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  status: RefundStatus;
  reason: string | null;
  attemptId: string | null;
  externalId: string | null;
  manualReference: string | null;
  returnId: string | null;
  processingStatus: import('@p4/shared').RefundAttemptStatus;
  version: number;
  attemptNumber: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RefundCreation = Optional<
  RefundAttributes,
  | 'attemptId'
  | 'externalId'
  | 'manualReference'
  | 'returnId'
  | 'processingStatus'
  | 'version'
  | 'attemptNumber'
  | 'id'
  | 'status'
  | 'reason'
  | 'createdAt'
  | 'updatedAt'
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
  declare attemptId: string | null;
  declare externalId: string | null;
  declare manualReference: string | null;
  declare returnId: string | null;
  declare processingStatus: import('@p4/shared').RefundAttemptStatus;
  declare version: number;
  declare attemptNumber: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initRefundModel(sequelize: Sequelize) {
  RefundModel.init(
    {
      attemptId: { type: DataTypes.UUID, allowNull: true },
      returnId: { type: DataTypes.UUID, allowNull: true, unique: true },
      externalId: { type: DataTypes.STRING, allowNull: true, unique: true },
      manualReference: { type: DataTypes.STRING, allowNull: true, unique: true },
      processingStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'requested' },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      attemptNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
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
