import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ExpenseAttributes {
  id: string;
  buildingId: string;
  roomId: string | null;
  categoryId: string;
  amount: number;
  spentOn: string;
  period: string;
  note: string | null;
  receiptFileId: string | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExpenseModel
  extends Model<
    ExpenseAttributes,
    Optional<ExpenseAttributes, 'id' | 'version' | 'createdAt' | 'updatedAt'>
  >
  implements ExpenseAttributes
{
  declare id: string;
  declare buildingId: string;
  declare roomId: string | null;
  declare categoryId: string;
  declare amount: number;
  declare spentOn: string;
  declare period: string;
  declare note: string | null;
  declare receiptFileId: string | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initExpenseModel(sequelize: Sequelize) {
  ExpenseModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      roomId: { type: DataTypes.UUID, allowNull: true },
      categoryId: { type: DataTypes.UUID, allowNull: false },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('amount'));
        },
      },
      spentOn: { type: DataTypes.DATEONLY, allowNull: false },
      period: { type: DataTypes.CHAR(7), allowNull: false },
      note: { type: DataTypes.TEXT, allowNull: true },
      receiptFileId: { type: DataTypes.UUID, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'expenses', underscored: true, version: true },
  );
}
