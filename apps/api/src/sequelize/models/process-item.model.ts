import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface ProcessItemAttributes {
  id: string;
  processId: string;
  index: number;
  state: 'valid' | 'invalid' | 'applied' | 'failed';
  data: import('@p4/shared').JsonValue;
  result: import('@p4/shared').JsonValue | null;
  issues: import('@p4/processes/shared').ProcessIssue[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProcessItemModel
  extends Model<ProcessItemAttributes>
  implements ProcessItemAttributes
{
  declare id: string;
  declare processId: string;
  declare index: number;
  declare state: 'valid' | 'invalid' | 'applied' | 'failed';
  declare data: import('@p4/shared').JsonValue;
  declare result: import('@p4/shared').JsonValue | null;
  declare issues: import('@p4/processes/shared').ProcessIssue[];
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initProcessItemModel(sequelize: Sequelize) {
  ProcessItemModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      processId: { type: DataTypes.UUID, allowNull: false },
      index: { type: DataTypes.INTEGER, allowNull: false },
      state: { type: DataTypes.STRING, allowNull: false },
      data: { type: DataTypes.JSONB, allowNull: false },
      result: { type: DataTypes.JSONB, allowNull: true },
      issues: { type: DataTypes.JSONB, allowNull: false },
    },
    { sequelize, tableName: 'process_items', underscored: true },
  );
}
