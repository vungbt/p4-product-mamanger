import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface OrderItemAttributes {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderItemCreation = Optional<OrderItemAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class OrderItemModel
  extends Model<OrderItemAttributes, OrderItemCreation>
  implements OrderItemAttributes
{
  declare id: string;
  declare orderId: string;
  declare productId: string;
  declare productName: string;
  declare quantity: number;
  declare unitPrice: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initOrderItemModel(sequelize: Sequelize) {
  OrderItemModel.init(
    {
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
      productId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'product_id',
      },
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'product_name',
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'unit_price',
      },
    },
    {
      sequelize,
      tableName: 'order_items',
      underscored: true,
    },
  );
  return OrderItemModel;
}
