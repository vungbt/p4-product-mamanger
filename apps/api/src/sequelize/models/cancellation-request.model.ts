import type { OrderQuantityInput } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface CancellationRequestAttributes {
  id: string;
  orderId: string;
  userId: string;
  status: 'requested' | 'approved' | 'rejected';
  reason: string;
  resolution: string | null;
  items: OrderQuantityInput[];
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export class CancellationRequestModel
  extends Model<CancellationRequestAttributes>
  implements CancellationRequestAttributes
{
  declare id: string;
  declare orderId: string;
  declare userId: string;
  declare status: CancellationRequestAttributes['status'];
  declare reason: string;
  declare resolution: string | null;
  declare items: OrderQuantityInput[];
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initCancellationRequestModel(sequelize: Sequelize) {
  CancellationRequestModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: false },
      resolution: { type: DataTypes.TEXT, allowNull: true },
      items: { type: DataTypes.JSONB, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'cancellation_requests', underscored: true },
  );
}
