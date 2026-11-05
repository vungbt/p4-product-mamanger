import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface WebhookReceiptAttributes {
  id: string;
  provider: string;
  eventType: string;
  payloadHash: string;
  status: string;
  errorCode: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WebhookReceiptModel
  extends Model<WebhookReceiptAttributes>
  implements WebhookReceiptAttributes
{
  declare id: string;
  declare provider: string;
  declare eventType: string;
  declare payloadHash: string;
  declare status: string;
  declare errorCode: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initWebhookReceiptModel(sequelize: Sequelize) {
  WebhookReceiptModel.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      provider: { type: DataTypes.STRING, allowNull: false },
      eventType: { type: DataTypes.STRING, allowNull: false },
      payloadHash: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      errorCode: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, tableName: 'webhook_receipts', underscored: true },
  );
}
