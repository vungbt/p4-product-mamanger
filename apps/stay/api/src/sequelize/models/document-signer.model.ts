import type { SignatureMethod, SignerRole, SignerStatus } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
import type { SignatureFormat } from './landlord-profile.model.js';

/** One signer of a document. The signature image is private (never audited or logged). */
export interface DocumentSignerAttributes {
  id: string;
  documentId: string;
  role: SignerRole;
  tenantId: string | null;
  userId: string | null;
  name: string;
  required: boolean;
  sortOrder: number;
  expiresAt: Date | null;
  failedAttempts: number;
  lockedUntil: Date | null;
  status: SignerStatus;
  viewedAt: Date | null;
  signedAt: Date | null;
  signatureMethod: SignatureMethod | null;
  signatureImage: Buffer | null;
  signatureFormat: SignatureFormat | null;
  typedName: string | null;
  rejectReason: string | null;
  signedDataSha256: string | null;
  /** How the signer was identified, e.g. `portal_phone_last4`, `password`. */
  verification: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type DocumentSignerCreation = Optional<
  DocumentSignerAttributes,
  | 'id'
  | 'tenantId'
  | 'userId'
  | 'required'
  | 'sortOrder'
  | 'expiresAt'
  | 'failedAttempts'
  | 'lockedUntil'
  | 'status'
  | 'viewedAt'
  | 'signedAt'
  | 'signatureMethod'
  | 'signatureImage'
  | 'signatureFormat'
  | 'typedName'
  | 'rejectReason'
  | 'signedDataSha256'
  | 'verification'
  | 'ip'
  | 'userAgent'
  | 'createdAt'
  | 'updatedAt'
>;

export class DocumentSignerModel
  extends Model<DocumentSignerAttributes, DocumentSignerCreation>
  implements DocumentSignerAttributes
{
  declare id: string;
  declare documentId: string;
  declare role: SignerRole;
  declare tenantId: string | null;
  declare userId: string | null;
  declare name: string;
  declare required: boolean;
  declare sortOrder: number;
  declare expiresAt: Date | null;
  declare failedAttempts: number;
  declare lockedUntil: Date | null;
  declare status: SignerStatus;
  declare viewedAt: Date | null;
  declare signedAt: Date | null;
  declare signatureMethod: SignatureMethod | null;
  declare signatureImage: Buffer | null;
  declare signatureFormat: SignatureFormat | null;
  declare typedName: string | null;
  declare rejectReason: string | null;
  declare signedDataSha256: string | null;
  declare verification: string | null;
  declare ip: string | null;
  declare userAgent: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initDocumentSignerModel(sequelize: Sequelize) {
  DocumentSignerModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      documentId: { type: DataTypes.UUID, allowNull: false },
      role: { type: DataTypes.STRING(8), allowNull: false },
      tenantId: { type: DataTypes.UUID, allowNull: true },
      userId: { type: DataTypes.UUID, allowNull: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      failedAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lockedUntil: { type: DataTypes.DATE, allowNull: true },
      status: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'pending' },
      viewedAt: { type: DataTypes.DATE, allowNull: true },
      signedAt: { type: DataTypes.DATE, allowNull: true },
      signatureMethod: { type: DataTypes.STRING(8), allowNull: true },
      signatureImage: { type: DataTypes.BLOB, allowNull: true },
      signatureFormat: { type: DataTypes.STRING(8), allowNull: true },
      typedName: { type: DataTypes.STRING(120), allowNull: true },
      rejectReason: { type: DataTypes.TEXT, allowNull: true },
      signedDataSha256: { type: DataTypes.CHAR(64), allowNull: true },
      verification: { type: DataTypes.STRING(32), allowNull: true },
      ip: { type: DataTypes.STRING(64), allowNull: true },
      userAgent: { type: DataTypes.STRING(255), allowNull: true },
    },
    { sequelize, tableName: 'document_signers', underscored: true },
  );
}
