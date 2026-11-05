import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface StockAlertSubscriptionAttributes {
  id: string;
  userId: string;
  variantId: string;
  status: 'active' | 'notified' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}
export class StockAlertSubscriptionModel
  extends Model<StockAlertSubscriptionAttributes>
  implements StockAlertSubscriptionAttributes
{
  declare id: string;
  declare userId: string;
  declare variantId: string;
  declare status: StockAlertSubscriptionAttributes['status'];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initStockAlertSubscriptionModel(sequelize: Sequelize) {
  StockAlertSubscriptionModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      variantId: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, tableName: 'stock_alert_subscriptions', underscored: true },
  );
}
