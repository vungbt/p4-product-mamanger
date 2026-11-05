import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface SupportMessageAttributes {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  internal: boolean;
  attachmentIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class SupportMessageModel
  extends Model<SupportMessageAttributes>
  implements SupportMessageAttributes
{
  declare id: string;
  declare ticketId: string;
  declare authorId: string;
  declare body: string;
  declare internal: boolean;
  declare attachmentIds: string[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initSupportMessageModel(sequelize: Sequelize) {
  SupportMessageModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      ticketId: { type: DataTypes.UUID, allowNull: false },
      authorId: { type: DataTypes.UUID, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      internal: { type: DataTypes.BOOLEAN, allowNull: false },
      attachmentIds: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false },
    },
    { sequelize, tableName: 'support_messages', underscored: true },
  );
}
