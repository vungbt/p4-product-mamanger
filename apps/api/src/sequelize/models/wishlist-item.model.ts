import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface WishlistItemAttributes {
  id: string;
  userId: string;
  productId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export class WishlistItemModel
  extends Model<WishlistItemAttributes>
  implements WishlistItemAttributes
{
  declare id: string;
  declare userId: string;
  declare productId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initWishlistItemModel(sequelize: Sequelize) {
  WishlistItemModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      productId: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, tableName: 'wishlist_items', underscored: true },
  );
}
