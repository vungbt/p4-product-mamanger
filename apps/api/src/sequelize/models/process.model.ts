import { DataTypes, Model, type Sequelize } from 'sequelize';

export interface ProcessAttributes {
  id: string;
  userId: string;
  kind: import('@p4/processes/shared').ProcessKind;
  state: import('@p4/processes/shared').ProcessState;
  phase: import('@p4/processes/shared').ProcessSnapshot['phase'];
  input: import('@p4/processes/shared').ProcessInput;
  version: number;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errorCode: string | null;
  result: import('@p4/processes/shared').ProcessResult | null;
  outputKey: string | null;
  expiresAt: Date;
  cleanedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProcessModel extends Model<ProcessAttributes> implements ProcessAttributes {
  declare id: string;
  declare userId: string;
  declare kind: import('@p4/processes/shared').ProcessKind;
  declare state: import('@p4/processes/shared').ProcessState;
  declare phase: import('@p4/processes/shared').ProcessSnapshot['phase'];
  declare input: import('@p4/processes/shared').ProcessInput;
  declare version: number;
  declare total: number;
  declare processed: number;
  declare succeeded: number;
  declare failed: number;
  declare errorCode: string | null;
  declare result: import('@p4/processes/shared').ProcessResult | null;
  declare outputKey: string | null;
  declare expiresAt: Date;
  declare cleanedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initProcessModel(sequelize: Sequelize) {
  ProcessModel.init(
    {
      cleanedAt: { type: DataTypes.DATE, allowNull: true },
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      kind: { type: DataTypes.STRING, allowNull: false },
      state: { type: DataTypes.STRING, allowNull: false },
      phase: { type: DataTypes.STRING, allowNull: false },
      input: { type: DataTypes.JSONB, allowNull: false },
      version: { type: DataTypes.INTEGER, allowNull: false },
      total: { type: DataTypes.INTEGER, allowNull: false },
      processed: { type: DataTypes.INTEGER, allowNull: false },
      succeeded: { type: DataTypes.INTEGER, allowNull: false },
      failed: { type: DataTypes.INTEGER, allowNull: false },
      errorCode: { type: DataTypes.STRING, allowNull: true },
      result: { type: DataTypes.JSONB, allowNull: true },
      outputKey: { type: DataTypes.STRING, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    { sequelize, tableName: 'processes', underscored: true },
  );
}
