import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface ShippingMethodAttributes {
  id: string;
  name: string;
  cities: string[];
  active: boolean;
  codEnabled: boolean;
  fee: number;
  estimatedDays: number;
  version: number;
  freeAbove: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ShippingMethodModel
  extends Model<ShippingMethodAttributes>
  implements ShippingMethodAttributes
{
  declare id: string;
  declare name: string;
  declare cities: string[];
  declare active: boolean;
  declare codEnabled: boolean;
  declare fee: number;
  declare estimatedDays: number;
  declare version: number;
  declare freeAbove: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initShippingMethodModel(sequelize: Sequelize) {
  ShippingMethodModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      cities: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false },
      codEnabled: { type: DataTypes.BOOLEAN, allowNull: false },
      fee: { type: DataTypes.INTEGER, allowNull: false },
      estimatedDays: { type: DataTypes.INTEGER, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
      freeAbove: { type: DataTypes.INTEGER, allowNull: true },
    },
    { sequelize, tableName: 'shipping_methods', underscored: true },
  );
}
