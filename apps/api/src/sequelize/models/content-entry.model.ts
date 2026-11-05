import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface ContentEntryAttributes {
  id: string;
  kind: import('@p4/shared').ContentKind;
  slug: string;
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  body: import('@p4/shared').ContentBlock[];
  coverFileId: string | null;
  authorId: string;
  taxonomyIds: string[];
  status: import('@p4/shared').ContentStatus;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  version: number;
  publishedSnapshot: import('@p4/shared').PublishedContent | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContentEntryModel
  extends Model<ContentEntryAttributes>
  implements ContentEntryAttributes
{
  declare id: string;
  declare kind: import('@p4/shared').ContentKind;
  declare slug: string;
  declare title: string;
  declare excerpt: string;
  declare seoTitle: string;
  declare seoDescription: string;
  declare body: import('@p4/shared').ContentBlock[];
  declare coverFileId: string | null;
  declare authorId: string;
  declare taxonomyIds: string[];
  declare status: import('@p4/shared').ContentStatus;
  declare publishedAt: Date | null;
  declare scheduledAt: Date | null;
  declare version: number;
  declare publishedSnapshot: import('@p4/shared').PublishedContent | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContentEntryModel(sequelize: Sequelize) {
  ContentEntryModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      kind: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      excerpt: { type: DataTypes.STRING, allowNull: false },
      seoTitle: { type: DataTypes.STRING, allowNull: false },
      seoDescription: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.JSONB, allowNull: false },
      coverFileId: { type: DataTypes.UUID, allowNull: true },
      authorId: { type: DataTypes.UUID, allowNull: false },
      taxonomyIds: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      publishedAt: { type: DataTypes.DATE, allowNull: true },
      scheduledAt: { type: DataTypes.DATE, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false },
      publishedSnapshot: { type: DataTypes.JSONB, allowNull: true },
    },
    { sequelize, tableName: 'content_entries', underscored: true },
  );
}
