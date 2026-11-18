import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** A device verified for a portal link (ST-25). Only the SHA-256 hash of the cookie is stored. */
export interface TenantPortalSessionAttributes {
  id: string;
  linkId: string;
  sessionHash: string;
  expiresAt: Date;
  userAgent: string | null;
  createdAt?: Date;
}

export class TenantPortalSessionModel
  extends Model<
    TenantPortalSessionAttributes,
    Optional<TenantPortalSessionAttributes, 'id' | 'userAgent' | 'createdAt'>
  >
  implements TenantPortalSessionAttributes
{
  declare id: string;
  declare linkId: string;
  declare sessionHash: string;
  declare expiresAt: Date;
  declare userAgent: string | null;
  declare readonly createdAt: Date;
}

export function initTenantPortalSessionModel(sequelize: Sequelize) {
  TenantPortalSessionModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      linkId: { type: DataTypes.UUID, allowNull: false },
      sessionHash: { type: DataTypes.CHAR(64), allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      userAgent: { type: DataTypes.STRING(255), allowNull: true },
    },
    { sequelize, tableName: 'tenant_portal_sessions', underscored: true, updatedAt: false },
  );
}
