import type { StayUploadPurpose, StayUploadStatus } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { StorageProviderName } from './file.model.js';

/** A signed, short-lived permission to upload one private file. */
export interface UploadTicketAttributes {
  id: string;
  ownerId: string;
  buildingId: string;
  purpose: StayUploadPurpose;
  provider: StorageProviderName;
  storageId: string;
  status: StayUploadStatus;
  maxBytes: number;
  expiresAt: Date;
  fileId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UploadTicketCreation = Optional<
  UploadTicketAttributes,
  'id' | 'status' | 'fileId' | 'createdAt' | 'updatedAt'
>;

export class UploadTicketModel
  extends Model<UploadTicketAttributes, UploadTicketCreation>
  implements UploadTicketAttributes
{
  declare id: string;
  declare ownerId: string;
  declare buildingId: string;
  declare purpose: StayUploadPurpose;
  declare provider: StorageProviderName;
  declare storageId: string;
  declare status: StayUploadStatus;
  declare maxBytes: number;
  declare expiresAt: Date;
  declare fileId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initUploadTicketModel(sequelize: Sequelize) {
  UploadTicketModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      ownerId: { type: DataTypes.UUID, allowNull: false },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      purpose: { type: DataTypes.STRING(32), allowNull: false },
      provider: { type: DataTypes.STRING(16), allowNull: false },
      storageId: { type: DataTypes.STRING, allowNull: false, unique: true },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' },
      maxBytes: { type: DataTypes.INTEGER, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      fileId: { type: DataTypes.UUID, allowNull: true },
    },
    { sequelize, tableName: 'upload_tickets', underscored: true },
  );
}
