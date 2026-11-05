import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface CartItemAttributes {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  addedPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}
export class CartItemModel extends Model<CartItemAttributes> implements CartItemAttributes {
  declare id: string;
  declare cartId: string;
  declare variantId: string;
  declare quantity: number;
  declare addedPrice: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initCartItemModel(sequelize: Sequelize) {
  CartItemModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      cartId: { type: DataTypes.UUID, allowNull: false },
      variantId: { type: DataTypes.UUID, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      addedPrice: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'cart_items', underscored: true },
  );
}
