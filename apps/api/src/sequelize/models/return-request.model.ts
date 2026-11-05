import type { OrderQuantityInput, ReturnInspection, ReturnStatus } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface ReturnRequestAttributes {
  id: string;
  orderId: string;
  userId: string;
  status: ReturnStatus;
  reason: string;
  resolution: string | null;
  items: OrderQuantityInput[];
  evidenceIds: string[];
  inspection: ReturnInspection[] | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export class ReturnRequestModel
  extends Model<ReturnRequestAttributes>
  implements ReturnRequestAttributes
{
  declare id: string;
  declare orderId: string;
  declare userId: string;
  declare status: ReturnStatus;
  declare reason: string;
  declare resolution: string | null;
  declare items: OrderQuantityInput[];
  declare evidenceIds: string[];
  declare inspection: ReturnInspection[] | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initReturnRequestModel(sequelize: Sequelize) {
  ReturnRequestModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: false },
      resolution: { type: DataTypes.TEXT, allowNull: true },
      items: { type: DataTypes.JSONB, allowNull: false },
      evidenceIds: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false },
      inspection: { type: DataTypes.JSONB, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'return_requests', underscored: true },
  );
}
