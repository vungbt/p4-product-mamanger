import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** A building announcement for tenants (ST-25). `roomIds: null` = the whole building. */
export interface AnnouncementAttributes {
  id: string;
  buildingId: string;
  title: string;
  body: string;
  roomIds: string[] | null;
  pinned: boolean;
  expiresAt: Date | null;
  createdBy: string | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type AnnouncementCreation = Optional<
  AnnouncementAttributes,
  'id' | 'roomIds' | 'pinned' | 'expiresAt' | 'createdBy' | 'version' | 'createdAt' | 'updatedAt'
>;

export class AnnouncementModel
  extends Model<AnnouncementAttributes, AnnouncementCreation>
  implements AnnouncementAttributes
{
  declare id: string;
  declare buildingId: string;
  declare title: string;
  declare body: string;
  declare roomIds: string[] | null;
  declare pinned: boolean;
  declare expiresAt: Date | null;
  declare createdBy: string | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initAnnouncementModel(sequelize: Sequelize) {
  AnnouncementModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING(200), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      roomIds: { type: DataTypes.ARRAY(DataTypes.UUID), allowNull: true },
      pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      expiresAt: { type: DataTypes.DATE, allowNull: true },
      createdBy: { type: DataTypes.UUID, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'announcements', underscored: true, version: true },
  );
}
