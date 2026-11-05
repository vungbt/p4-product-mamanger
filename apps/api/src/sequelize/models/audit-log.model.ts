import type { JsonValue } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface AuditLogAttributes {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'success' | 'failure';
  changes: JsonValue;
  requestId: string | null;
  reason: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AuditLogModel extends Model<AuditLogAttributes> implements AuditLogAttributes {
  declare id: string;
  declare actorId: string | null;
  declare action: string;
  declare resourceType: string;
  declare resourceId: string;
  declare outcome: 'success' | 'failure';
  declare changes: JsonValue;
  declare requestId: string | null;
  declare reason: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initAuditLogModel(sequelize: Sequelize) {
  AuditLogModel.init(
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      actorId: { type: DataTypes.UUID, allowNull: true },
      action: { type: DataTypes.STRING, allowNull: false },
      resourceType: { type: DataTypes.STRING, allowNull: false },
      resourceId: { type: DataTypes.STRING, allowNull: false },
      outcome: { type: DataTypes.STRING, allowNull: false },
      changes: { type: DataTypes.JSONB, allowNull: false },
      requestId: { type: DataTypes.STRING, allowNull: true },
      reason: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: 'audit_logs', underscored: true },
  );
}
