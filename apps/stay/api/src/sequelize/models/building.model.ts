import type { BillingDay, ReadingDayMonth, RoundingUnit } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** Billing columns left `null` follow `system_settings` (key `billing`). */
export interface BuildingAttributes {
  id: string;
  code: string;
  name: string;
  address: string | null;
  readingDay: BillingDay | null;
  readingDayMonth: ReadingDayMonth | null;
  issueDay: BillingDay | null;
  dueDay: BillingDay | null;
  graceDays: number | null;
  /** Move-out facility depreciation fee (VND, 0 = off). */
  moveOutFee: number | null;
  roundingUnit: RoundingUnit | null;
  refundUnusedRent: boolean | null;
  bankBin: string | null;
  bankAccount: string | null;
  bankAccountName: string | null;
  rulesText: string | null;
  contactPhone: string | null;
  archivedAt: Date | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BuildingCreation = Optional<
  BuildingAttributes,
  | 'id'
  | 'address'
  | 'readingDay'
  | 'readingDayMonth'
  | 'issueDay'
  | 'dueDay'
  | 'graceDays'
  | 'moveOutFee'
  | 'roundingUnit'
  | 'refundUnusedRent'
  | 'bankBin'
  | 'bankAccount'
  | 'bankAccountName'
  | 'rulesText'
  | 'contactPhone'
  | 'archivedAt'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
>;

export class BuildingModel
  extends Model<BuildingAttributes, BuildingCreation>
  implements BuildingAttributes
{
  declare id: string;
  declare code: string;
  declare name: string;
  declare address: string | null;
  declare readingDay: BillingDay | null;
  declare readingDayMonth: ReadingDayMonth | null;
  declare issueDay: BillingDay | null;
  declare dueDay: BillingDay | null;
  declare graceDays: number | null;
  declare moveOutFee: number | null;
  declare roundingUnit: RoundingUnit | null;
  declare refundUnusedRent: boolean | null;
  declare bankBin: string | null;
  declare bankAccount: string | null;
  declare bankAccountName: string | null;
  declare rulesText: string | null;
  declare contactPhone: string | null;
  declare archivedAt: Date | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initBuildingModel(sequelize: Sequelize) {
  BuildingModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      code: { type: DataTypes.STRING(6), allowNull: false, unique: true },
      name: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.STRING, allowNull: true },
      readingDay: { type: DataTypes.SMALLINT, allowNull: true },
      readingDayMonth: { type: DataTypes.STRING(4), allowNull: true },
      issueDay: { type: DataTypes.SMALLINT, allowNull: true },
      dueDay: { type: DataTypes.SMALLINT, allowNull: true },
      graceDays: { type: DataTypes.SMALLINT, allowNull: true },
      moveOutFee: { type: DataTypes.INTEGER, allowNull: true },
      roundingUnit: { type: DataTypes.INTEGER, allowNull: true },
      refundUnusedRent: { type: DataTypes.BOOLEAN, allowNull: true },
      bankBin: { type: DataTypes.STRING(6), allowNull: true },
      bankAccount: { type: DataTypes.STRING(19), allowNull: true },
      bankAccountName: { type: DataTypes.STRING(50), allowNull: true },
      rulesText: { type: DataTypes.TEXT, allowNull: true },
      contactPhone: { type: DataTypes.STRING(11), allowNull: true },
      archivedAt: { type: DataTypes.DATE, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'buildings', underscored: true, version: true },
  );
}
