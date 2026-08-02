import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface OrderCouponAttributes {
  id: string;
  orderId: string;
  couponId: string;
  code: string;
  discountAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderCouponCreation = Optional<OrderCouponAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class OrderCouponModel
  extends Model<OrderCouponAttributes, OrderCouponCreation>
  implements OrderCouponAttributes
{
  declare id: string;
  declare orderId: string;
  declare couponId: string;
  declare code: string;
  declare discountAmount: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initOrderCouponModel(sequelize: Sequelize) {
  OrderCouponModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'order_id' },
      couponId: { type: DataTypes.UUID, allowNull: false, field: 'coupon_id' },
      code: { type: DataTypes.STRING, allowNull: false },
      discountAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'discount_amount',
      },
    },
    { sequelize, tableName: 'order_coupons', underscored: true },
  );
  return OrderCouponModel;
}
