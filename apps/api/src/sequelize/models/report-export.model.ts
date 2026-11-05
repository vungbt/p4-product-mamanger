import type { ReportKind, ReportQuery } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface ReportExportAttributes {
  id: string;
  userId: string;
  report: ReportKind;
  filters: ReportQuery;
  status: 'pending' | 'ready' | 'failed';
  content: string | null;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
export class ReportExportModel
  extends Model<ReportExportAttributes>
  implements ReportExportAttributes
{
  declare id: string;
  declare userId: string;
  declare report: ReportKind;
  declare filters: ReportQuery;
  declare status: ReportExportAttributes['status'];
  declare content: string | null;
  declare expiresAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initReportExportModel(sequelize: Sequelize) {
  ReportExportModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      report: { type: DataTypes.STRING, allowNull: false },
      filters: { type: DataTypes.JSONB, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    { sequelize, tableName: 'report_exports', underscored: true },
  );
}
