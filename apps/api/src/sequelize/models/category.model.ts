import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface CategoryAttributes {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CategoryCreation = Optional<
  CategoryAttributes,
  'id' | 'description' | 'createdAt' | 'updatedAt'
>;

export class CategoryModel
  extends Model<CategoryAttributes, CategoryCreation>
  implements CategoryAttributes
{
  declare id: string;
  declare name: string;
  declare slug: string;
  declare description: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initCategoryModel(sequelize: Sequelize) {
  CategoryModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    },
    { sequelize, tableName: 'categories', underscored: true },
  );
  return CategoryModel;
}
