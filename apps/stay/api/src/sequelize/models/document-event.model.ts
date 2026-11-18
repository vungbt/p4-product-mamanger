import type { DocumentEventType } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** Evidence log of a document; append-only (a trigger refuses UPDATE/DELETE). */
export interface DocumentEventAttributes {
  id: string;
  documentId: string;
  signerId: string | null;
  type: DocumentEventType;
  actorUserId: string | null;
  actorName: string | null;
  ip: string | null;
  userAgent: string | null;
  dataSha256: string | null;
  createdAt?: Date;
}

export type DocumentEventCreation = Optional<
  DocumentEventAttributes,
  'id' | 'signerId' | 'actorUserId' | 'actorName' | 'ip' | 'userAgent' | 'dataSha256' | 'createdAt'
>;

export class DocumentEventModel
  extends Model<DocumentEventAttributes, DocumentEventCreation>
  implements DocumentEventAttributes
{
  declare id: string;
  declare documentId: string;
  declare signerId: string | null;
  declare type: DocumentEventType;
  declare actorUserId: string | null;
  declare actorName: string | null;
  declare ip: string | null;
  declare userAgent: string | null;
  declare dataSha256: string | null;
  declare readonly createdAt: Date;
}

export function initDocumentEventModel(sequelize: Sequelize) {
  DocumentEventModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      documentId: { type: DataTypes.UUID, allowNull: false },
      signerId: { type: DataTypes.UUID, allowNull: true },
      type: { type: DataTypes.STRING(24), allowNull: false },
      actorUserId: { type: DataTypes.UUID, allowNull: true },
      actorName: { type: DataTypes.STRING(120), allowNull: true },
      ip: { type: DataTypes.STRING(64), allowNull: true },
      userAgent: { type: DataTypes.STRING(255), allowNull: true },
      dataSha256: { type: DataTypes.CHAR(64), allowNull: true },
    },
    { sequelize, tableName: 'document_events', underscored: true, updatedAt: false },
  );
}
