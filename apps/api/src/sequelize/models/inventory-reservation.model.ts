import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type ReservationStatus = 'reserved' | 'committed' | 'released';

export interface InventoryReservationAttributes {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type InventoryReservationCreation = Optional<
  InventoryReservationAttributes,
  'id' | 'status' | 'expiresAt' | 'createdAt' | 'updatedAt'
>;

export class InventoryReservationModel
  extends Model<InventoryReservationAttributes, InventoryReservationCreation>
  implements InventoryReservationAttributes
{
  declare id: string;
  declare orderId: string;
  declare productId: string;
  declare quantity: number;
  declare status: ReservationStatus;
  declare expiresAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initInventoryReservationModel(sequelize: Sequelize) {
  InventoryReservationModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
      productId: { type: DataTypes.STRING, allowNull: false, field: 'product_id' },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM('reserved', 'committed', 'released'),
        allowNull: false,
        defaultValue: 'reserved',
      },
      expiresAt: { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
    },
    { sequelize, tableName: 'inventory_reservations', underscored: true },
  );
  return InventoryReservationModel;
}
