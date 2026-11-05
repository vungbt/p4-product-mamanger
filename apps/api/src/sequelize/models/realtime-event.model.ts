import type { RealtimeEvent } from '@p4/realtime/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
export interface RealtimeEventAttributes {
  id: string;
  userId: string;
  dedupeKey: string;
  payload: RealtimeEvent['payload'];
  createdAt?: Date;
  updatedAt?: Date;
}
export class RealtimeEventModel
  extends Model<RealtimeEventAttributes, Optional<RealtimeEventAttributes, 'id'>>
  implements RealtimeEventAttributes
{
  declare id: string;
  declare userId: string;
  declare dedupeKey: string;
  declare payload: RealtimeEvent['payload'];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initRealtimeEventModel(sequelize: Sequelize) {
  RealtimeEventModel.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      dedupeKey: { type: DataTypes.STRING, allowNull: false, unique: true },
      payload: { type: DataTypes.JSONB, allowNull: false },
    },
    { sequelize, tableName: 'realtime_events', underscored: true },
  );
}
