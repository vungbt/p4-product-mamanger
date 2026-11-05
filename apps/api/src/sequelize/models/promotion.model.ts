import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface PromotionAttributes {
  id: string;
  name: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount: number;
  priority: number;
  version: number;
  maxDiscount: number | null;
  variantIds: string[];
  categoryIds: string[];
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PromotionModel extends Model<PromotionAttributes> implements PromotionAttributes {
  declare id: string;
  declare name: string;
  declare type: 'percent' | 'fixed';
  declare value: number;
  declare minOrderAmount: number;
  declare priority: number;
  declare version: number;
  declare maxDiscount: number | null;
  declare variantIds: string[];
  declare categoryIds: string[];
  declare isActive: boolean;
  declare startsAt: Date | null;
  declare endsAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initPromotionModel(sequelize: Sequelize) {
  PromotionModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      value: { type: DataTypes.INTEGER, allowNull: false },
      minOrderAmount: { type: DataTypes.INTEGER, allowNull: false },
      priority: { type: DataTypes.INTEGER, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
      maxDiscount: { type: DataTypes.INTEGER, allowNull: true },
      variantIds: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false },
      categoryIds: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false },
      startsAt: { type: DataTypes.DATE, allowNull: true },
      endsAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: 'promotions', underscored: true },
  );
}
