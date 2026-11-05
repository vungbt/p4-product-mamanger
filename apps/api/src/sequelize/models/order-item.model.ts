import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface OrderItemAttributes {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  variantId?: string | null;
  sku: string;
  size: string;
  color: string;
  imageUrl: string;
  discountAmount: number;
  lineTotal: number;
  cancelledQuantity: number;
  fulfilledQuantity: number;
  returnedQuantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderItemCreation = Optional<
  OrderItemAttributes,
  | 'sku'
  | 'size'
  | 'color'
  | 'imageUrl'
  | 'discountAmount'
  | 'lineTotal'
  | 'cancelledQuantity'
  | 'fulfilledQuantity'
  | 'returnedQuantity'
  | 'id'
  | 'createdAt'
  | 'updatedAt'
>;

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
  declare variantId: string | null;
  declare sku: string;
  declare size: string;
  declare color: string;
  declare imageUrl: string;
  declare discountAmount: number;
  declare lineTotal: number;
  declare cancelledQuantity: number;
  declare fulfilledQuantity: number;
  declare returnedQuantity: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initOrderItemModel(sequelize: Sequelize) {
  OrderItemModel.init(
    {
      variantId: { type: DataTypes.UUID, allowNull: true },
      sku: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      size: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      color: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      imageUrl: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      discountAmount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lineTotal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      cancelledQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      fulfilledQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      returnedQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
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
