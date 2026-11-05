import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type ShipmentStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export interface ShipmentAttributes {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  carrier: string | null;
  trackingCode: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  fulfillmentStatus: import('@p4/shared').FulfillmentStatus;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ShipmentCreation = Optional<
  ShipmentAttributes,
  | 'fulfillmentStatus'
  | 'version'
  | 'id'
  | 'status'
  | 'carrier'
  | 'trackingCode'
  | 'shippedAt'
  | 'deliveredAt'
  | 'createdAt'
  | 'updatedAt'
>;

export class ShipmentModel
  extends Model<ShipmentAttributes, ShipmentCreation>
  implements ShipmentAttributes
{
  declare id: string;
  declare orderId: string;
  declare status: ShipmentStatus;
  declare carrier: string | null;
  declare trackingCode: string | null;
  declare shippedAt: Date | null;
  declare deliveredAt: Date | null;
  declare fulfillmentStatus: import('@p4/shared').FulfillmentStatus;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initShipmentModel(sequelize: Sequelize) {
  ShipmentModel.init(
    {
      fulfillmentStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending_pack' },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'order_id',
      },
      status: {
        type: DataTypes.ENUM('pending', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      carrier: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      trackingCode: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'tracking_code',
      },
      shippedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'shipped_at',
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'delivered_at',
      },
    },
    {
      sequelize,
      tableName: 'shipments',
      underscored: true,
    },
  );
  return ShipmentModel;
}
