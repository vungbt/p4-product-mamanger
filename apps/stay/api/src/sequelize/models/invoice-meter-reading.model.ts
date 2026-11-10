import { DataTypes, Model, type Sequelize } from 'sequelize';

/**
 * Meter readings a draft was computed from, with the value used. Issuing locks them and refuses
 * a draft whose readings changed since; voiding unlocks those no other issued invoice uses.
 */
export interface InvoiceMeterReadingAttributes {
  invoiceId: string;
  readingId: string;
  readingValue: number;
}

export class InvoiceMeterReadingModel extends Model<InvoiceMeterReadingAttributes> {
  declare invoiceId: string;
  declare readingId: string;
  declare readingValue: number;
}

export function initInvoiceMeterReadingModel(sequelize: Sequelize) {
  InvoiceMeterReadingModel.init(
    {
      invoiceId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      readingId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
      readingValue: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('readingValue'));
        },
      },
    },
    { sequelize, tableName: 'invoice_meter_readings', underscored: true, timestamps: false },
  );
}
