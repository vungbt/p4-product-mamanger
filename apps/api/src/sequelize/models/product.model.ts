import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ProductAttributes {
  id: string;
  name: string;
  price: number;
  description: string;
  imageId: string | null;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductCreation = Optional<
  ProductAttributes,
  'id' | 'imageId' | 'createdAt' | 'updatedAt'
>;

export class ProductModel
  extends Model<ProductAttributes, ProductCreation>
  implements ProductAttributes
{
  declare id: string;
  declare name: string;
  declare price: number;
  declare description: string;
  declare imageId: string | null;
  declare stock: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initProductModel(sequelize: Sequelize) {
  ProductModel.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      imageId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'image_id',
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: 'products',
      underscored: true,
    },
  );
  return ProductModel;
}
