import type { TenantRequestPayload, TenantRequestStatus, TenantRequestType } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** A request from the tenant portal (T-09); staff accept or reject it (O-26). */
export interface TenantRequestAttributes {
  id: string;
  buildingId: string;
  contractId: string;
  roomId: string | null;
  tenantId: string;
  portalLinkId: string | null;
  type: TenantRequestType;
  payload: TenantRequestPayload;
  status: TenantRequestStatus;
  reply: string | null;
  /** Ids written when accepted (e.g. the added occupant's tenant id). */
  result: Record<string, string | number | boolean | null> | null;
  handledBy: string | null;
  handledAt: Date | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TenantRequestCreation = Optional<
  TenantRequestAttributes,
  | 'id'
  | 'roomId'
  | 'portalLinkId'
  | 'status'
  | 'reply'
  | 'result'
  | 'handledBy'
  | 'handledAt'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
>;

export class TenantRequestModel
  extends Model<TenantRequestAttributes, TenantRequestCreation>
  implements TenantRequestAttributes
{
  declare id: string;
  declare buildingId: string;
  declare contractId: string;
  declare roomId: string | null;
  declare tenantId: string;
  declare portalLinkId: string | null;
  declare type: TenantRequestType;
  declare payload: TenantRequestPayload;
  declare status: TenantRequestStatus;
  declare reply: string | null;
  declare result: Record<string, string | number | boolean | null> | null;
  declare handledBy: string | null;
  declare handledAt: Date | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initTenantRequestModel(sequelize: Sequelize) {
  TenantRequestModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      contractId: { type: DataTypes.UUID, allowNull: false },
      roomId: { type: DataTypes.UUID, allowNull: true },
      tenantId: { type: DataTypes.UUID, allowNull: false },
      portalLinkId: { type: DataTypes.UUID, allowNull: true },
      type: { type: DataTypes.STRING(32), allowNull: false },
      payload: { type: DataTypes.JSONB, allowNull: false },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'new' },
      reply: { type: DataTypes.TEXT, allowNull: true },
      result: { type: DataTypes.JSONB, allowNull: true },
      handledBy: { type: DataTypes.UUID, allowNull: true },
      handledAt: { type: DataTypes.DATE, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'tenant_requests', underscored: true, version: true },
  );
}
