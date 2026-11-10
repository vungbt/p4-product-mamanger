import type { InvoiceKind, InvoiceStatus } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface InvoiceAttributes {
  id: string;
  buildingId: string;
  contractId: string;
  roomId: string;
  kind: InvoiceKind;
  period: string;
  code: string | null;
  status: InvoiceStatus;
  issuedOn: string | null;
  dueOn: string;
  subtotal: number;
  rounding: number;
  total: number;
  paidTotal: number;
  roundingUnit: number;
  shareTokenHash: string | null;
  shareExpiresAt: Date | null;
  voidReason: string | null;
  voidedAt: Date | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InvoiceModel extends Model<
  InvoiceAttributes,
  Optional<
    InvoiceAttributes,
    | 'id'
    | 'code'
    | 'status'
    | 'issuedOn'
    | 'paidTotal'
    | 'shareTokenHash'
    | 'shareExpiresAt'
    | 'voidReason'
    | 'voidedAt'
    | 'version'
    | 'createdAt'
    | 'updatedAt'
  >
> {
  declare id: string;
  declare buildingId: string;
  declare contractId: string;
  declare roomId: string;
  declare kind: InvoiceKind;
  declare period: string;
  declare code: string | null;
  declare status: InvoiceStatus;
  declare issuedOn: string | null;
  declare dueOn: string;
  declare subtotal: number;
  declare rounding: number;
  declare total: number;
  declare paidTotal: number;
  declare roundingUnit: number;
  declare shareTokenHash: string | null;
  declare shareExpiresAt: Date | null;
  declare voidReason: string | null;
  declare voidedAt: Date | null;
  declare version: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

/** BIGINT columns come back as strings from pg; money stays a safe integer. */
const money = (field: 'subtotal' | 'rounding' | 'total' | 'paidTotal' | 'roundingUnit') => ({
  type: DataTypes.BIGINT,
  allowNull: false,
  get(this: InvoiceModel) {
    return Number(this.getDataValue(field));
  },
});

export function initInvoiceModel(sequelize: Sequelize) {
  InvoiceModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      contractId: { type: DataTypes.UUID, allowNull: false },
      roomId: { type: DataTypes.UUID, allowNull: false },
      kind: { type: DataTypes.STRING(12), allowNull: false },
      period: { type: DataTypes.CHAR(7), allowNull: false },
      code: { type: DataTypes.STRING(32), allowNull: true },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'draft' },
      issuedOn: { type: DataTypes.DATEONLY, allowNull: true },
      dueOn: { type: DataTypes.DATEONLY, allowNull: false },
      subtotal: money('subtotal'),
      rounding: money('rounding'),
      total: money('total'),
      paidTotal: { ...money('paidTotal'), defaultValue: 0 },
      roundingUnit: money('roundingUnit'),
      shareTokenHash: { type: DataTypes.STRING(128), allowNull: true },
      shareExpiresAt: { type: DataTypes.DATE, allowNull: true },
      voidReason: { type: DataTypes.TEXT, allowNull: true },
      voidedAt: { type: DataTypes.DATE, allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'invoices', underscored: true, version: true },
  );
}
