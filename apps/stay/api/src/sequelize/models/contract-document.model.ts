import type { DocumentKind, DocumentStatus, SigningOrder } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** Values the template was filled with (snapshot at creation; never the contract's later data). */
export type DocumentSnapshot = Record<string, string>;

/** A filled document of a contract (ST-30). The body is frozen once it leaves `draft`. */
export interface ContractDocumentAttributes {
  id: string;
  buildingId: string;
  contractId: string;
  kind: DocumentKind;
  templateVersionId: string | null;
  landlordUserId: string;
  code: string;
  title: string;
  bodyHtml: string;
  dataSnapshot: DocumentSnapshot;
  dataSha256: string | null;
  editedManually: boolean;
  status: DocumentStatus;
  signingOrder: SigningOrder;
  pdfFileId: string | null;
  pdfSha256: string | null;
  paperScanFileId: string | null;
  paperSignedOn: string | null;
  supersedesId: string | null;
  cancelReason: string | null;
  sentAt: Date | null;
  completedAt: Date | null;
  createdBy: string | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ContractDocumentCreation = Optional<
  ContractDocumentAttributes,
  | 'id'
  | 'templateVersionId'
  | 'dataSha256'
  | 'editedManually'
  | 'status'
  | 'signingOrder'
  | 'pdfFileId'
  | 'pdfSha256'
  | 'paperScanFileId'
  | 'paperSignedOn'
  | 'supersedesId'
  | 'cancelReason'
  | 'sentAt'
  | 'completedAt'
  | 'createdBy'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
>;

export class ContractDocumentModel
  extends Model<ContractDocumentAttributes, ContractDocumentCreation>
  implements ContractDocumentAttributes
{
  declare id: string;
  declare buildingId: string;
  declare contractId: string;
  declare kind: DocumentKind;
  declare templateVersionId: string | null;
  declare landlordUserId: string;
  declare code: string;
  declare title: string;
  declare bodyHtml: string;
  declare dataSnapshot: DocumentSnapshot;
  declare dataSha256: string | null;
  declare editedManually: boolean;
  declare status: DocumentStatus;
  declare signingOrder: SigningOrder;
  declare pdfFileId: string | null;
  declare pdfSha256: string | null;
  declare paperScanFileId: string | null;
  declare paperSignedOn: string | null;
  declare supersedesId: string | null;
  declare cancelReason: string | null;
  declare sentAt: Date | null;
  declare completedAt: Date | null;
  declare createdBy: string | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContractDocumentModel(sequelize: Sequelize) {
  ContractDocumentModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      contractId: { type: DataTypes.UUID, allowNull: false },
      kind: { type: DataTypes.STRING(16), allowNull: false },
      templateVersionId: { type: DataTypes.UUID, allowNull: true },
      landlordUserId: { type: DataTypes.UUID, allowNull: false },
      code: { type: DataTypes.STRING(16), allowNull: false, unique: true },
      title: { type: DataTypes.STRING(200), allowNull: false },
      bodyHtml: { type: DataTypes.TEXT, allowNull: false },
      dataSnapshot: { type: DataTypes.JSONB, allowNull: false },
      dataSha256: { type: DataTypes.CHAR(64), allowNull: true },
      editedManually: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'draft' },
      signingOrder: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'tenant_first' },
      pdfFileId: { type: DataTypes.UUID, allowNull: true },
      pdfSha256: { type: DataTypes.CHAR(64), allowNull: true },
      paperScanFileId: { type: DataTypes.UUID, allowNull: true },
      paperSignedOn: { type: DataTypes.DATEONLY, allowNull: true },
      supersedesId: { type: DataTypes.UUID, allowNull: true },
      cancelReason: { type: DataTypes.TEXT, allowNull: true },
      sentAt: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.UUID, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'contract_documents', underscored: true, version: true },
  );
}
