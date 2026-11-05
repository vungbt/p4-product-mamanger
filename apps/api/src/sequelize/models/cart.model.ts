import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface CartAttributes {
  id: string;
  userId: string;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export class CartModel extends Model<CartAttributes> implements CartAttributes {
  declare id: string;
  declare userId: string;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initCartModel(sequelize: Sequelize) {
  CartModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, unique: true },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'carts', underscored: true },
  );
}
