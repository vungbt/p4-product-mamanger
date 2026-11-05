import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface ContentTaxonomyAttributes {
  id: string;
  kind: 'category' | 'tag';
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContentTaxonomyModel
  extends Model<ContentTaxonomyAttributes>
  implements ContentTaxonomyAttributes
{
  declare id: string;
  declare kind: 'category' | 'tag';
  declare name: string;
  declare slug: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContentTaxonomyModel(sequelize: Sequelize) {
  ContentTaxonomyModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      kind: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, tableName: 'content_taxonomies', underscored: true },
  );
}
