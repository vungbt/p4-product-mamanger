import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type DocumentFilePurpose = 'final_pdf' | 'paper_scan';
export type DocumentFileFormat = 'pdf' | 'png' | 'jpg';

/** Final PDF or paper scan of a document; append-only, served only by authorised routes. */
export interface DocumentFileAttributes {
  id: string;
  buildingId: string;
  purpose: DocumentFilePurpose;
  format: DocumentFileFormat;
  bytes: number;
  sha256: string;
  content: Buffer;
  createdBy: string | null;
  createdAt?: Date;
}

export type DocumentFileCreation = Optional<
  DocumentFileAttributes,
  'id' | 'createdBy' | 'createdAt'
>;

export class DocumentFileModel
  extends Model<DocumentFileAttributes, DocumentFileCreation>
  implements DocumentFileAttributes
{
  declare id: string;
  declare buildingId: string;
  declare purpose: DocumentFilePurpose;
  declare format: DocumentFileFormat;
  declare bytes: number;
  declare sha256: string;
  declare content: Buffer;
  declare createdBy: string | null;
  declare readonly createdAt: Date;
}

export function initDocumentFileModel(sequelize: Sequelize) {
  DocumentFileModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      purpose: { type: DataTypes.STRING(16), allowNull: false },
      format: { type: DataTypes.STRING(8), allowNull: false },
      bytes: { type: DataTypes.INTEGER, allowNull: false },
      sha256: { type: DataTypes.CHAR(64), allowNull: false },
      content: { type: DataTypes.BLOB, allowNull: false },
      createdBy: { type: DataTypes.UUID, allowNull: true },
    },
    { sequelize, tableName: 'document_files', underscored: true, updatedAt: false },
  );
}
