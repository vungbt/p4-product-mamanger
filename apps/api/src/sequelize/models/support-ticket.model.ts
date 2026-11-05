import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface SupportTicketAttributes {
  id: string;
  userId: string;
  orderId: string | null;
  assigneeId: string | null;
  subject: string;
  category: string;
  status: import('@p4/shared').SupportTicketStatus;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SupportTicketModel
  extends Model<SupportTicketAttributes>
  implements SupportTicketAttributes
{
  declare id: string;
  declare userId: string;
  declare orderId: string | null;
  declare assigneeId: string | null;
  declare subject: string;
  declare category: string;
  declare status: import('@p4/shared').SupportTicketStatus;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initSupportTicketModel(sequelize: Sequelize) {
  SupportTicketModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      orderId: { type: DataTypes.UUID, allowNull: true },
      assigneeId: { type: DataTypes.UUID, allowNull: true },
      subject: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'support_tickets', underscored: true },
  );
}
