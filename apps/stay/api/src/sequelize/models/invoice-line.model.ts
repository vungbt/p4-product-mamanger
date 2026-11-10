import type { InvoiceLine } from '@stay/billing';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
export interface InvoiceLineAttributes {
 id: string;
 invoiceId: string;
 type: InvoiceLine["type"];
 serviceId: string | null;
 description: InvoiceLine["description"];
 period: string | null;
 quantity: number;
 unit: string | null;
 unitPrice: number | null;
 ratioNum: number | null;
 ratioDen: number | null;
 amount: number;
 meta: InvoiceLine["meta"];
 position: number;
}
export class InvoiceLineModel extends Model<InvoiceLineAttributes, Optional<InvoiceLineAttributes, 'id' | 'serviceId' | 'period' | 'unit' | 'unitPrice' | 'ratioNum' | 'ratioDen'>> {
 declare id: string;
 declare invoiceId: string;
 declare type: InvoiceLine["type"];
 declare serviceId: string | null;
 declare description: InvoiceLine["description"];
 declare period: string | null;
 declare quantity: number;
 declare unit: string | null;
 declare unitPrice: number | null;
 declare ratioNum: number | null;
 declare ratioDen: number | null;
 declare amount: number;
 declare meta: InvoiceLine["meta"];
 declare position: number;
 declare createdAt: Date;
}
export function initInvoiceLineModel(sequelize: Sequelize) {
 InvoiceLineModel.init({
 id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
 invoiceId: { type: DataTypes.UUID, allowNull: false },
 type: { type: DataTypes.STRING(16), allowNull: false },
 serviceId: { type: DataTypes.UUID, allowNull: true },
 description: { type: DataTypes.JSONB, allowNull: false },
 period: { type: DataTypes.CHAR(7), allowNull: true },
 quantity: { type: DataTypes.INTEGER, allowNull: false },
 unit: { type: DataTypes.STRING(80), allowNull: true },
 unitPrice: { type: DataTypes.BIGINT, allowNull: true, get() { const value = this.getDataValue('unitPrice'); return value === null ? null : Number(value); } },
 ratioNum: { type: DataTypes.INTEGER, allowNull: true },
 ratioDen: { type: DataTypes.INTEGER, allowNull: true },
 amount: { type: DataTypes.BIGINT, allowNull: false, get() { const value = this.getDataValue('amount'); return value === null ? null : Number(value); } },
 meta: { type: DataTypes.JSONB, allowNull: false },
 position: { type: DataTypes.INTEGER, allowNull: false },
 }, { sequelize, tableName: 'invoice_lines', underscored: true });
}
