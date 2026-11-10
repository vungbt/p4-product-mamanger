import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface ExpenseCategoryAttributes {
  id: string;
  name: string;
  active: boolean;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ExpenseCategoryModel
  extends Model<
    ExpenseCategoryAttributes,
    Optional<ExpenseCategoryAttributes, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'active'>
  >
  implements ExpenseCategoryAttributes
{
  declare id: string;
  declare name: string;
  declare active: boolean;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initExpenseCategoryModel(sequelize: Sequelize) {
  ExpenseCategoryModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'expense_categories', underscored: true, version: true },
  );
}
