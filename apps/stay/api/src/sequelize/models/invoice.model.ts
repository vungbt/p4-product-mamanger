import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
export interface InvoiceAttributes {
 id: string;
 buildingId: string;
 contractId: string;
 roomId: string;
 kind: 'monthly' | 'move_in' | 'settlement';
 period: string;
 code: string | null;
 status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';
 issuedOn: string | null;
 dueOn: string;
 subtotal: number;
 rounding: number;
 total: number;
 paidTotal: number;
 roundingUnit: number;
 voidReason: string | null;
 version: number;
}
export class InvoiceModel extends Model<InvoiceAttributes, Optional<InvoiceAttributes, 'id' | 'code' | 'issuedOn' | 'voidReason' | 'status' | 'paidTotal' | 'version'>> {
 declare id: string;
 declare buildingId: string;
 declare contractId: string;
 declare roomId: string;
 declare kind: 'monthly' | 'move_in' | 'settlement';
 declare period: string;
 declare code: string | null;
 declare status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';
 declare issuedOn: string | null;
 declare dueOn: string;
 declare subtotal: number;
 declare rounding: number;
 declare total: number;
 declare paidTotal: number;
 declare roundingUnit: number;
 declare voidReason: string | null;
 declare version: number;
 declare createdAt: Date;
}
export function initInvoiceModel(sequelize: Sequelize) {
 InvoiceModel.init({
 id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
 buildingId: { type: DataTypes.UUID, allowNull: false },
 contractId: { type: DataTypes.UUID, allowNull: false },
 roomId: { type: DataTypes.UUID, allowNull: false },
 kind: { type: DataTypes.STRING(12), allowNull: false },
 period: { type: DataTypes.CHAR(7), allowNull: false },
 code: { type: DataTypes.STRING(80), allowNull: true },
 status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'draft' },
 issuedOn: { type: DataTypes.DATEONLY, allowNull: true },
 dueOn: { type: DataTypes.DATEONLY, allowNull: false },
 subtotal: { type: DataTypes.BIGINT, allowNull: false, get() { const value = this.getDataValue('subtotal'); return value === null ? null : Number(value); } },
 rounding: { type: DataTypes.BIGINT, allowNull: false, get() { const value = this.getDataValue('rounding'); return value === null ? null : Number(value); } },
 total: { type: DataTypes.BIGINT, allowNull: false, get() { const value = this.getDataValue('total'); return value === null ? null : Number(value); } },
 paidTotal: { type: DataTypes.BIGINT, allowNull: false, get() { const value = this.getDataValue('paidTotal'); return value === null ? null : Number(value); }, defaultValue: 0 },
 roundingUnit: { type: DataTypes.BIGINT, allowNull: false, get() { const value = this.getDataValue('roundingUnit'); return value === null ? null : Number(value); } },
 voidReason: { type: DataTypes.TEXT, allowNull: true },
 version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
 }, { sequelize, tableName: 'invoices', underscored: true, version: true });
}
