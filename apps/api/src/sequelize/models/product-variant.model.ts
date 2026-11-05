import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface ProductVariantAttributes {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  size: string;
  color: string;
  price: number;
  status: 'active' | 'inactive';
  isDefault: boolean;
  imageIds: string[];
  onHand: number;
  reserved: number;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductVariantModel
  extends Model<ProductVariantAttributes>
  implements ProductVariantAttributes
{
  declare id: string;
  declare productId: string;
  declare sku: string;
  declare barcode: string | null;
  declare size: string;
  declare color: string;
  declare price: number;
  declare status: 'active' | 'inactive';
  declare isDefault: boolean;
  declare imageIds: string[];
  declare onHand: number;
  declare reserved: number;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initProductVariantModel(sequelize: Sequelize) {
  ProductVariantModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      productId: { type: DataTypes.STRING, allowNull: false },
      sku: { type: DataTypes.STRING, allowNull: false, unique: true },
      barcode: { type: DataTypes.STRING, allowNull: true, unique: true },
      size: { type: DataTypes.STRING, allowNull: false },
      color: { type: DataTypes.STRING, allowNull: false },
      price: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      isDefault: { type: DataTypes.BOOLEAN, allowNull: false },
      imageIds: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false },
      onHand: { type: DataTypes.INTEGER, allowNull: false },
      reserved: { type: DataTypes.INTEGER, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, tableName: 'product_variants', underscored: true },
  );
}
