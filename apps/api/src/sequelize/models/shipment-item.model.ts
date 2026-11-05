import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface ShipmentItemAttributes {
  id: string;
  shipmentId: string;
  orderItemId: string;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export class ShipmentItemModel
  extends Model<ShipmentItemAttributes>
  implements ShipmentItemAttributes
{
  declare id: string;
  declare shipmentId: string;
  declare orderItemId: string;
  declare quantity: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initShipmentItemModel(sequelize: Sequelize) {
  ShipmentItemModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      shipmentId: { type: DataTypes.UUID, allowNull: false },
      orderItemId: { type: DataTypes.UUID, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'shipment_items', underscored: true },
  );
}
