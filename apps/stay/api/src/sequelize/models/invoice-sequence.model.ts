import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';
export interface InvoiceSequenceAttributes {
 id: string;
 buildingId: string;
 period: string;
 lastNumber: number;
}
export class InvoiceSequenceModel extends Model<InvoiceSequenceAttributes, Optional<InvoiceSequenceAttributes, 'id'>> {
 declare id: string;
 declare buildingId: string;
 declare period: string;
 declare lastNumber: number;
 declare createdAt: Date;
}
export function initInvoiceSequenceModel(sequelize: Sequelize) {
 InvoiceSequenceModel.init({
 id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
 buildingId: { type: DataTypes.UUID, allowNull: false },
 period: { type: DataTypes.CHAR(7), allowNull: false },
 lastNumber: { type: DataTypes.INTEGER, allowNull: false },
 }, { sequelize, tableName: 'invoice_sequences', underscored: true });
}
