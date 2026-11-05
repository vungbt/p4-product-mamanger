import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface NotificationTemplateAttributes {
  id: string;
  type: string;
  locale: string;
  subject: string;
  body: string;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NotificationTemplateModel
  extends Model<NotificationTemplateAttributes>
  implements NotificationTemplateAttributes
{
  declare id: string;
  declare type: string;
  declare locale: string;
  declare subject: string;
  declare body: string;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initNotificationTemplateModel(sequelize: Sequelize) {
  NotificationTemplateModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      type: { type: DataTypes.STRING, allowNull: false },
      locale: { type: DataTypes.STRING, allowNull: false },
      subject: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.STRING, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'notification_templates', underscored: true },
  );
}
