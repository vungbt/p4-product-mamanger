import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface ContentRedirectAttributes {
  id: string;
  entryId: string;
  kind: import('@p4/shared').ContentKind;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContentRedirectModel
  extends Model<ContentRedirectAttributes>
  implements ContentRedirectAttributes
{
  declare id: string;
  declare entryId: string;
  declare kind: import('@p4/shared').ContentKind;
  declare slug: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContentRedirectModel(sequelize: Sequelize) {
  ContentRedirectModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      entryId: { type: DataTypes.UUID, allowNull: false },
      kind: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, tableName: 'content_redirects', underscored: true },
  );
}
