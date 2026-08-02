import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type FileProvider = 'cloudinary' | 'system';

export interface FileAttributes {
  id: string;
  url: string | null;
  storageId: string;
  provider: FileProvider;
  metadata: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FileCreation = Optional<
  FileAttributes,
  'id' | 'url' | 'provider' | 'metadata' | 'createdAt' | 'updatedAt'
>;

export class FileModel extends Model<FileAttributes, FileCreation> implements FileAttributes {
  declare id: string;
  declare url: string | null;
  declare storageId: string;
  declare provider: FileProvider;
  declare metadata: Record<string, unknown> | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initFileModel(sequelize: Sequelize) {
  FileModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      storageId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'storage_id',
      },
      provider: {
        type: DataTypes.ENUM('cloudinary', 'system'),
        allowNull: false,
        defaultValue: 'cloudinary',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'files',
      underscored: true,
    },
  );
  return FileModel;
}
