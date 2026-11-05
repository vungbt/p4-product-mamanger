import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface NotificationPreferencesAttributes {
  userId: string;
  transactionalEmail: boolean;
  marketingEmail: boolean;
  stockEmail: boolean;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NotificationPreferencesModel
  extends Model<NotificationPreferencesAttributes>
  implements NotificationPreferencesAttributes
{
  declare userId: string;
  declare transactionalEmail: boolean;
  declare marketingEmail: boolean;
  declare stockEmail: boolean;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initNotificationPreferencesModel(sequelize: Sequelize) {
  NotificationPreferencesModel.init(
    {
      userId: { type: DataTypes.UUID, primaryKey: true },
      transactionalEmail: { type: DataTypes.BOOLEAN, allowNull: false },
      marketingEmail: { type: DataTypes.BOOLEAN, allowNull: false },
      stockEmail: { type: DataTypes.BOOLEAN, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'notification_preferences', underscored: true },
  );
}
