import type { OrderStatus } from '@p4/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface OrderAttributes {
  id: string;
  userId: string;
  userEmail: string;
  status: OrderStatus;
  addressId: string | null;
  shippingFullName: string | null;
  shippingPhone: string | null;
  shippingLine1: string | null;
  shippingCity: string | null;
  shippingFee: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderCreation = Optional<
  OrderAttributes,
  | 'id'
  | 'status'
  | 'addressId'
  | 'shippingFullName'
  | 'shippingPhone'
  | 'shippingLine1'
  | 'shippingCity'
  | 'shippingFee'
  | 'discountAmount'
  | 'createdAt'
  | 'updatedAt'
>;

export class OrderModel extends Model<OrderAttributes, OrderCreation> implements OrderAttributes {
  declare id: string;
  declare userId: string;
  declare userEmail: string;
  declare status: OrderStatus;
  declare addressId: string | null;
  declare shippingFullName: string | null;
  declare shippingPhone: string | null;
  declare shippingLine1: string | null;
  declare shippingCity: string | null;
  declare shippingFee: number;
  declare subtotal: number;
  declare discountAmount: number;
  declare total: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initOrderModel(sequelize: Sequelize) {
  OrderModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
      },
      userEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'user_email',
      },
      status: {
        type: DataTypes.ENUM('pending', 'paid', 'shipping', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      addressId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'address_id',
      },
      shippingFullName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'shipping_full_name',
      },
      shippingPhone: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'shipping_phone',
      },
      shippingLine1: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'shipping_line1',
      },
      shippingCity: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'shipping_city',
      },
      shippingFee: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'shipping_fee',
      },
      subtotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      discountAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'discount_amount',
      },
      total: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'orders',
      underscored: true,
    },
  );
  return OrderModel;
}
