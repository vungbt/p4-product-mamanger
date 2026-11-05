import type { ExchangeLine, ExchangeStatus } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface ExchangeRequestAttributes {
  id: string;
  userId: string;
  orderId: string;
  returnId: string;
  status: ExchangeStatus;
  items: ExchangeLine[];
  reason: string;
  priceDifference: number | null;
  originalRefundAmount: number | null;
  quoteId: string | null;
  replacementOrderId: string | null;
  refundId: string | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export class ExchangeRequestModel
  extends Model<ExchangeRequestAttributes>
  implements ExchangeRequestAttributes
{
  declare id: string;
  declare userId: string;
  declare orderId: string;
  declare returnId: string;
  declare status: ExchangeStatus;
  declare items: ExchangeLine[];
  declare reason: string;
  declare priceDifference: number | null;
  declare originalRefundAmount: number | null;
  declare quoteId: string | null;
  declare replacementOrderId: string | null;
  declare refundId: string | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initExchangeRequestModel(sequelize: Sequelize) {
  ExchangeRequestModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      orderId: { type: DataTypes.UUID, allowNull: false },
      returnId: { type: DataTypes.UUID, allowNull: false, unique: true },
      status: { type: DataTypes.STRING, allowNull: false },
      items: { type: DataTypes.JSONB, allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: false },
      priceDifference: { type: DataTypes.INTEGER, allowNull: true },
      originalRefundAmount: { type: DataTypes.INTEGER, allowNull: true },
      quoteId: { type: DataTypes.UUID, allowNull: true },
      replacementOrderId: { type: DataTypes.UUID, allowNull: true, unique: true },
      refundId: { type: DataTypes.UUID, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'exchange_requests', underscored: true },
  );
}
