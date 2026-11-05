import type { FulfillmentStatus, JsonValue } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface ShipmentEventAttributes {
  id: string;
  shipmentId: string;
  type: FulfillmentStatus;
  reference: string;
  detail: JsonValue;
  occurredAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
export class ShipmentEventModel
  extends Model<ShipmentEventAttributes>
  implements ShipmentEventAttributes
{
  declare id: string;
  declare shipmentId: string;
  declare type: FulfillmentStatus;
  declare reference: string;
  declare detail: JsonValue;
  declare occurredAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initShipmentEventModel(sequelize: Sequelize) {
  ShipmentEventModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      shipmentId: { type: DataTypes.UUID, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      reference: { type: DataTypes.STRING, allowNull: false },
      detail: { type: DataTypes.JSONB, allowNull: false },
      occurredAt: { type: DataTypes.DATE, allowNull: false },
    },
    { sequelize, tableName: 'shipment_events', underscored: true },
  );
}
