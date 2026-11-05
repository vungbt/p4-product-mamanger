import type { JsonValue } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface OrderEventAttributes {
  id: string;
  orderId: string;
  actorId: string | null;
  type: string;
  detail: JsonValue;
  public: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export class OrderEventModel extends Model<OrderEventAttributes> implements OrderEventAttributes {
  declare id: string;
  declare orderId: string;
  declare actorId: string | null;
  declare type: string;
  declare detail: JsonValue;
  declare public: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initOrderEventModel(sequelize: Sequelize) {
  OrderEventModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false },
      actorId: { type: DataTypes.UUID, allowNull: true },
      type: { type: DataTypes.STRING, allowNull: false },
      detail: { type: DataTypes.JSONB, allowNull: false },
      public: { type: DataTypes.BOOLEAN, allowNull: false },
    },
    { sequelize, tableName: 'order_events', underscored: true },
  );
}
