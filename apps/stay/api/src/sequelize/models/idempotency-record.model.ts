import type { JsonValue } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface IdempotencyRecordAttributes {
  id: string;
  scope: string;
  actorId: string;
  key: string;
  requestHash: string;
  result: JsonValue;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class IdempotencyRecordModel
  extends Model<IdempotencyRecordAttributes>
  implements IdempotencyRecordAttributes
{
  declare id: string;
  declare scope: string;
  declare actorId: string;
  declare key: string;
  declare requestHash: string;
  declare result: JsonValue;
  declare expiresAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initIdempotencyRecordModel(sequelize: Sequelize) {
  IdempotencyRecordModel.init(
    {
      id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      scope: { type: DataTypes.STRING, allowNull: false },
      actorId: { type: DataTypes.UUID, allowNull: false },
      key: { type: DataTypes.STRING, allowNull: false },
      requestHash: { type: DataTypes.STRING, allowNull: false },
      result: { type: DataTypes.JSONB, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    { sequelize, tableName: 'idempotency_records', underscored: true },
  );
}
