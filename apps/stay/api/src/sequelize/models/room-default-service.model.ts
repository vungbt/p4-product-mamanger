import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** A service suggested by default when a contract is created for the room. */
export interface RoomDefaultServiceAttributes {
  roomId: string;
  serviceId: string;
  createdAt?: Date;
}

export type RoomDefaultServiceCreation = Optional<RoomDefaultServiceAttributes, 'createdAt'>;

export class RoomDefaultServiceModel
  extends Model<RoomDefaultServiceAttributes, RoomDefaultServiceCreation>
  implements RoomDefaultServiceAttributes
{
  declare roomId: string;
  declare serviceId: string;
  declare readonly createdAt: Date;
}

export function initRoomDefaultServiceModel(sequelize: Sequelize) {
  RoomDefaultServiceModel.init(
    {
      roomId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      serviceId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    },
    {
      sequelize,
      tableName: 'room_default_services',
      underscored: true,
      updatedAt: false,
    },
  );
}
