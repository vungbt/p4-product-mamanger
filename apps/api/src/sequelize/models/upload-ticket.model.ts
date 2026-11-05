import type { UploadPurpose } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface UploadTicketAttributes {
  id: string;
  ownerId: string;
  purpose: UploadPurpose;
  resourceId: string | null;
  storageId: string;
  status: 'pending' | 'completed' | 'rejected';
  private: boolean;
  maxBytes: number;
  expiresAt: Date;
  fileId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UploadTicketModel
  extends Model<UploadTicketAttributes>
  implements UploadTicketAttributes
{
  declare id: string;
  declare ownerId: string;
  declare purpose: UploadPurpose;
  declare resourceId: string | null;
  declare storageId: string;
  declare status: UploadTicketAttributes['status'];
  declare private: boolean;
  declare maxBytes: number;
  declare expiresAt: Date;
  declare fileId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initUploadTicketModel(sequelize: Sequelize) {
  UploadTicketModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      ownerId: { type: DataTypes.UUID, allowNull: false },
      purpose: { type: DataTypes.STRING, allowNull: false },
      resourceId: { type: DataTypes.STRING, allowNull: true },
      storageId: { type: DataTypes.STRING, allowNull: false, unique: true },
      status: { type: DataTypes.STRING, allowNull: false },
      private: { type: DataTypes.BOOLEAN, allowNull: false },
      maxBytes: { type: DataTypes.INTEGER, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      fileId: { type: DataTypes.UUID, allowNull: true },
    },
    { sequelize, tableName: 'upload_tickets', underscored: true },
  );
}
