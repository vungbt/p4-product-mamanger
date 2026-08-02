import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ProductImageAttributes {
  id: string;
  productId: string;
  fileId: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductImageCreation = Optional<
  ProductImageAttributes,
  'id' | 'sortOrder' | 'createdAt' | 'updatedAt'
>;

export class ProductImageModel
  extends Model<ProductImageAttributes, ProductImageCreation>
  implements ProductImageAttributes
{
  declare id: string;
  declare productId: string;
  declare fileId: string;
  declare sortOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initProductImageModel(sequelize: Sequelize) {
  ProductImageModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      productId: { type: DataTypes.STRING, allowNull: false, field: 'product_id' },
      fileId: { type: DataTypes.UUID, allowNull: false, field: 'file_id' },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
      },
    },
    { sequelize, tableName: 'product_images', underscored: true },
  );
  return ProductImageModel;
}
