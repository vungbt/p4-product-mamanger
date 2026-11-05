import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface ContentRevisionAttributes {
  id: string;
  entryId: string;
  actorId: string;
  version: number;
  snapshot: import('@p4/shared').ContentEntry;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContentRevisionModel
  extends Model<ContentRevisionAttributes>
  implements ContentRevisionAttributes
{
  declare id: string;
  declare entryId: string;
  declare actorId: string;
  declare version: number;
  declare snapshot: import('@p4/shared').ContentEntry;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initContentRevisionModel(sequelize: Sequelize) {
  ContentRevisionModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      entryId: { type: DataTypes.UUID, allowNull: false },
      actorId: { type: DataTypes.UUID, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
      snapshot: { type: DataTypes.JSONB, allowNull: false },
    },
    { sequelize, tableName: 'content_revisions', underscored: true },
  );
}
