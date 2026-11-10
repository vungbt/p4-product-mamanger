import type { StayUploadPurpose } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type StorageProviderName = 'cloudinary' | 'stub';
export type StoredImageFormat = 'jpg' | 'png' | 'webp';

/** A verified upload. `storageId` is internal: never return or audit it. */
export interface FileAttributes {
  id: string;
  provider: StorageProviderName;
  storageId: string;
  private: boolean;
  format: StoredImageFormat;
  bytes: number;
  width: number | null;
  height: number | null;
  purpose: StayUploadPurpose;
  ownerId: string | null;
  buildingId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FileCreation = Optional<
  FileAttributes,
  'id' | 'private' | 'width' | 'height' | 'createdAt' | 'updatedAt'
>;

export class FileModel extends Model<FileAttributes, FileCreation> implements FileAttributes {
  declare id: string;
  declare provider: StorageProviderName;
  declare storageId: string;
  declare private: boolean;
  declare format: StoredImageFormat;
  declare bytes: number;
  declare width: number | null;
  declare height: number | null;
  declare purpose: StayUploadPurpose;
  declare ownerId: string | null;
  declare buildingId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initFileModel(sequelize: Sequelize) {
  FileModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      provider: { type: DataTypes.STRING(16), allowNull: false },
      storageId: { type: DataTypes.STRING, allowNull: false, unique: true },
      private: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      format: { type: DataTypes.STRING(8), allowNull: false },
      bytes: { type: DataTypes.INTEGER, allowNull: false },
      width: { type: DataTypes.INTEGER, allowNull: true },
      height: { type: DataTypes.INTEGER, allowNull: true },
      purpose: { type: DataTypes.STRING(32), allowNull: false },
      ownerId: { type: DataTypes.UUID, allowNull: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
    },
    { sequelize, tableName: 'files', underscored: true },
  );
}
