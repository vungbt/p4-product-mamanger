import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface NotificationDeliveryAttributes {
  id: string;
  eventId: string;
  userId: string;
  status: 'pending' | 'delivered' | 'suppressed';
  providerReference: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NotificationDeliveryModel
  extends Model<NotificationDeliveryAttributes>
  implements NotificationDeliveryAttributes
{
  declare id: string;
  declare eventId: string;
  declare userId: string;
  declare status: 'pending' | 'delivered' | 'suppressed';
  declare providerReference: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initNotificationDeliveryModel(sequelize: Sequelize) {
  NotificationDeliveryModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      eventId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      providerReference: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'notification_deliveries', underscored: true },
  );
}
