import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface CouponRedemptionAttributes {
  id: string;
  couponId: string;
  orderId: string;
  userId: string;
  status: 'reserved' | 'committed' | 'released';
  amount: number;
  ruleVersion: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CouponRedemptionModel
  extends Model<CouponRedemptionAttributes>
  implements CouponRedemptionAttributes
{
  declare id: string;
  declare couponId: string;
  declare orderId: string;
  declare userId: string;
  declare status: 'reserved' | 'committed' | 'released';
  declare amount: number;
  declare ruleVersion: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initCouponRedemptionModel(sequelize: Sequelize) {
  CouponRedemptionModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      couponId: { type: DataTypes.UUID, allowNull: false },
      orderId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      amount: { type: DataTypes.INTEGER, allowNull: false },
      ruleVersion: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'coupon_redemptions', underscored: true },
  );
}
