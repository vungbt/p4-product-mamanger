import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface OrderAttributes {
  id: string;
  userId: string;
  userEmail: string;
  total: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OrderCreation = Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class OrderModel extends Model<OrderAttributes, OrderCreation> implements OrderAttributes {
  declare id: string;
  declare userId: string;
  declare userEmail: string;
  declare total: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initOrderModel(sequelize: Sequelize) {
  OrderModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
      },
      userEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'user_email',
      },
      total: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'orders',
      underscored: true,
    },
  );
  return OrderModel;
}
