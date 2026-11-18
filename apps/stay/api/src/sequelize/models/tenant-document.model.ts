import type { TenantDocumentKind } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** A private image attached to a tenant (CCCD front/back). */
export interface TenantDocumentAttributes {
  id: string;
  tenantId: string;
  fileId: string;
  kind: TenantDocumentKind;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TenantDocumentCreation = Optional<
  TenantDocumentAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

export class TenantDocumentModel
  extends Model<TenantDocumentAttributes, TenantDocumentCreation>
  implements TenantDocumentAttributes
{
  declare id: string;
  declare tenantId: string;
  declare fileId: string;
  declare kind: TenantDocumentKind;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initTenantDocumentModel(sequelize: Sequelize) {
  TenantDocumentModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      tenantId: { type: DataTypes.UUID, allowNull: false },
      fileId: { type: DataTypes.UUID, allowNull: false },
      kind: { type: DataTypes.STRING(16), allowNull: false },
    },
    { sequelize, tableName: 'tenant_documents', underscored: true },
  );
}
