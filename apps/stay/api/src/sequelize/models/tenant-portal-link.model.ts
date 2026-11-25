import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** One portal link of an occupant (ST-25). Only the SHA-256 hash of the token is stored. */
export interface TenantPortalLinkAttributes {
  id: string;
  accountUserId?: string | null;
  buildingId: string;
  contractId: string;
  tenantId: string;
  tokenHash: string;
  createdBy: string | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  failedAttempts: number;
  lockedUntil: Date | null;
  lastOpenedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TenantPortalLinkCreation = Optional<
  TenantPortalLinkAttributes,
  | 'id'
  | 'createdBy'
  | 'revokedAt'
  | 'revokedBy'
  | 'failedAttempts'
  | 'lockedUntil'
  | 'lastOpenedAt'
  | 'createdAt'
  | 'updatedAt'
>;

export class TenantPortalLinkModel
  extends Model<TenantPortalLinkAttributes, TenantPortalLinkCreation>
  implements TenantPortalLinkAttributes
{
  declare id: string;
  declare accountUserId: string | null;
  declare buildingId: string;
  declare contractId: string;
  declare tenantId: string;
  declare tokenHash: string;
  declare createdBy: string | null;
  declare revokedAt: Date | null;
  declare revokedBy: string | null;
  declare failedAttempts: number;
  declare lockedUntil: Date | null;
  declare lastOpenedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initTenantPortalLinkModel(sequelize: Sequelize) {
  TenantPortalLinkModel.init(
    {
      accountUserId: { type: DataTypes.UUID, allowNull: true },
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      contractId: { type: DataTypes.UUID, allowNull: false },
      tenantId: { type: DataTypes.UUID, allowNull: false },
      tokenHash: { type: DataTypes.CHAR(64), allowNull: false },
      createdBy: { type: DataTypes.UUID, allowNull: true },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
      revokedBy: { type: DataTypes.UUID, allowNull: true },
      failedAttempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lockedUntil: { type: DataTypes.DATE, allowNull: true },
      lastOpenedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: 'tenant_portal_links', underscored: true },
  );
}
