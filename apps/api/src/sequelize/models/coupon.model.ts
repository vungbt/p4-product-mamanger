import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export type CouponType = 'percent' | 'fixed';

export interface CouponAttributes {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CouponCreation = Optional<
  CouponAttributes,
  | 'id'
  | 'minOrderAmount'
  | 'maxDiscount'
  | 'usageLimit'
  | 'usedCount'
  | 'startsAt'
  | 'endsAt'
  | 'isActive'
  | 'createdAt'
  | 'updatedAt'
>;

export class CouponModel
  extends Model<CouponAttributes, CouponCreation>
  implements CouponAttributes
{
  declare id: string;
  declare code: string;
  declare type: CouponType;
  declare value: number;
  declare minOrderAmount: number;
  declare maxDiscount: number | null;
  declare usageLimit: number | null;
  declare usedCount: number;
  declare startsAt: Date | null;
  declare endsAt: Date | null;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initCouponModel(sequelize: Sequelize) {
  CouponModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      code: { type: DataTypes.STRING, allowNull: false, unique: true },
      type: { type: DataTypes.ENUM('percent', 'fixed'), allowNull: false },
      value: { type: DataTypes.INTEGER, allowNull: false },
      minOrderAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'min_order_amount',
      },
      maxDiscount: { type: DataTypes.INTEGER, allowNull: true, field: 'max_discount' },
      usageLimit: { type: DataTypes.INTEGER, allowNull: true, field: 'usage_limit' },
      usedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'used_count',
      },
      startsAt: { type: DataTypes.DATE, allowNull: true, field: 'starts_at' },
      endsAt: { type: DataTypes.DATE, allowNull: true, field: 'ends_at' },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    { sequelize, tableName: 'coupons', underscored: true },
  );
  return CouponModel;
}
