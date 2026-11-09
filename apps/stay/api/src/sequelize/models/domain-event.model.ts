import type { JsonValue } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface DomainEventAttributes {
  id: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: JsonValue;
  status: 'pending' | 'processing' | 'delivered' | 'dead_letter';
  attempts: number;
  availableAt: Date;
  leaseUntil: Date | null;
  deliveredAt: Date | null;
  leaseToken?: string | null;
  lastErrorCode?: string | null;
  dedupeKey?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DomainEventModel
  extends Model<DomainEventAttributes>
  implements DomainEventAttributes
{
  declare id: string;
  declare type: string;
  declare aggregateType: string;
  declare aggregateId: string;
  declare payload: JsonValue;
  declare status: 'pending' | 'processing' | 'delivered' | 'dead_letter';
  declare attempts: number;
  declare availableAt: Date;
  declare leaseUntil: Date | null;
  declare deliveredAt: Date | null;
  declare leaseToken: string | null;
  declare lastErrorCode: string | null;
  declare dedupeKey: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initDomainEventModel(sequelize: Sequelize) {
  DomainEventModel.init(
    {
      leaseToken: { type: DataTypes.UUID, allowNull: true },
      lastErrorCode: { type: DataTypes.STRING, allowNull: true },
      dedupeKey: { type: DataTypes.STRING, allowNull: true, unique: true },
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      type: { type: DataTypes.STRING, allowNull: false },
      aggregateType: { type: DataTypes.STRING, allowNull: false },
      aggregateId: { type: DataTypes.STRING, allowNull: false },
      payload: { type: DataTypes.JSONB, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      attempts: { type: DataTypes.INTEGER, allowNull: false },
      availableAt: { type: DataTypes.DATE, allowNull: false },
      leaseUntil: { type: DataTypes.DATE, allowNull: true },
      deliveredAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: 'domain_events', underscored: true },
  );
}
