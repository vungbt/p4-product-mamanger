import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface ProductSlugRedirectAttributes {
  slug: string;
  productId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductSlugRedirectModel
  extends Model<ProductSlugRedirectAttributes>
  implements ProductSlugRedirectAttributes
{
  declare slug: string;
  declare productId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initProductSlugRedirectModel(sequelize: Sequelize) {
  ProductSlugRedirectModel.init(
    {
      slug: { type: DataTypes.STRING, primaryKey: true },
      productId: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, tableName: 'product_slug_redirects', underscored: true },
  );
}
