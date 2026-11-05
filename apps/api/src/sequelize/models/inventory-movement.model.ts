import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface InventoryMovementAttributes {
  id: string;
  variantId: string;
  kind: import('@p4/shared').InventoryMovementKind;
  quantity: number;
  onHandDelta: number;
  reservedDelta: number;
  onHandAfter: number;
  reservedAfter: number;
  actorId: string | null;
  reason: string;
  reference: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InventoryMovementModel
  extends Model<InventoryMovementAttributes>
  implements InventoryMovementAttributes
{
  declare id: string;
  declare variantId: string;
  declare kind: import('@p4/shared').InventoryMovementKind;
  declare quantity: number;
  declare onHandDelta: number;
  declare reservedDelta: number;
  declare onHandAfter: number;
  declare reservedAfter: number;
  declare actorId: string | null;
  declare reason: string;
  declare reference: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initInventoryMovementModel(sequelize: Sequelize) {
  InventoryMovementModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      variantId: { type: DataTypes.UUID, allowNull: false },
      kind: { type: DataTypes.STRING, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      onHandDelta: { type: DataTypes.INTEGER, allowNull: false },
      reservedDelta: { type: DataTypes.INTEGER, allowNull: false },
      onHandAfter: { type: DataTypes.INTEGER, allowNull: false },
      reservedAfter: { type: DataTypes.INTEGER, allowNull: false },
      actorId: { type: DataTypes.UUID, allowNull: true },
      reason: { type: DataTypes.TEXT, allowNull: false },
      reference: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, tableName: 'inventory_movements', underscored: true },
  );
}
