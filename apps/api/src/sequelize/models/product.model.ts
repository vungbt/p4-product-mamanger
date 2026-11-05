import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ProductAttributes {
  id: string;
  name: string;
  price: number;
  description: string;
  imageId: string | null;
  categoryId: string | null;
  stock: number;
  slug: string;
  status: import('@p4/shared').ProductPublicationStatus;
  brand: string;
  material: string;
  careInstructions: string;
  seoTitle: string;
  seoDescription: string;
  sizeGuideId: string | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductCreation = Optional<
  ProductAttributes,
  | 'slug'
  | 'status'
  | 'brand'
  | 'material'
  | 'careInstructions'
  | 'seoTitle'
  | 'seoDescription'
  | 'sizeGuideId'
  | 'version'
  | 'id'
  | 'imageId'
  | 'categoryId'
  | 'createdAt'
  | 'updatedAt'
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
  declare categoryId: string | null;
  declare stock: number;
  declare slug: string;
  declare status: import('@p4/shared').ProductPublicationStatus;
  declare brand: string;
  declare material: string;
  declare careInstructions: string;
  declare seoTitle: string;
  declare seoDescription: string;
  declare sizeGuideId: string | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initProductModel(sequelize: Sequelize) {
  ProductModel.init(
    {
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        defaultValue: () => crypto.randomUUID(),
      },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'draft' },
      sizeGuideId: { type: DataTypes.UUID, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      brand: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      material: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      careInstructions: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      seoTitle: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      seoDescription: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
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
      categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'category_id',
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
