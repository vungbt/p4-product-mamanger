import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface NotificationAttributes {
  id: string;
  userId: string;
  eventId: string;
  type: string;
  title: string;
  body: string;
  href: string;
  readAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NotificationModel
  extends Model<NotificationAttributes>
  implements NotificationAttributes
{
  declare id: string;
  declare userId: string;
  declare eventId: string;
  declare type: string;
  declare title: string;
  declare body: string;
  declare href: string;
  declare readAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initNotificationModel(sequelize: Sequelize) {
  NotificationModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      eventId: { type: DataTypes.UUID, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.STRING, allowNull: false },
      href: { type: DataTypes.STRING, allowNull: false },
      readAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: 'notifications', underscored: true },
  );
}
