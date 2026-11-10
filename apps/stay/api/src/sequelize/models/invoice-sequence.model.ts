import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** Last code number per building and period; its row is locked while issuing (ST-14). */
export interface InvoiceSequenceAttributes {
  id: string;
  buildingId: string;
  period: string;
  lastNumber: number;
}

export class InvoiceSequenceModel extends Model<
  InvoiceSequenceAttributes,
  Optional<InvoiceSequenceAttributes, 'id' | 'lastNumber'>
> {
  declare id: string;
  declare buildingId: string;
  declare period: string;
  declare lastNumber: number;
}

export function initInvoiceSequenceModel(sequelize: Sequelize) {
  InvoiceSequenceModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      period: { type: DataTypes.CHAR(7), allowNull: false },
      lastNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { sequelize, tableName: 'invoice_sequences', underscored: true },
  );
}
