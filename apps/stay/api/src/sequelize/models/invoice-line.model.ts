import type {
  InvoiceLineType,
  StayInvoiceLineDescription,
  StayInvoiceLineMeta,
} from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface InvoiceLineAttributes {
  id: string;
  invoiceId: string;
  position: number;
  type: InvoiceLineType;
  serviceId: string | null;
  description: StayInvoiceLineDescription;
  period: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number | null;
  ratioNum: number | null;
  ratioDen: number | null;
  amount: number;
  manual: boolean;
  meta: StayInvoiceLineMeta;
}

export class InvoiceLineModel extends Model<
  InvoiceLineAttributes,
  Optional<InvoiceLineAttributes, 'id' | 'manual'>
> {
  declare id: string;
  declare invoiceId: string;
  declare position: number;
  declare type: InvoiceLineType;
  declare serviceId: string | null;
  declare description: StayInvoiceLineDescription;
  declare period: string | null;
  declare quantity: number;
  declare unit: string | null;
  declare unitPrice: number | null;
  declare ratioNum: number | null;
  declare ratioDen: number | null;
  declare amount: number;
  declare manual: boolean;
  declare meta: StayInvoiceLineMeta;
  declare createdAt: Date;
}

export function initInvoiceLineModel(sequelize: Sequelize) {
  InvoiceLineModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      invoiceId: { type: DataTypes.UUID, allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false },
      type: { type: DataTypes.STRING(16), allowNull: false },
      serviceId: { type: DataTypes.UUID, allowNull: true },
      description: { type: DataTypes.JSONB, allowNull: false },
      period: { type: DataTypes.CHAR(7), allowNull: true },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      unit: { type: DataTypes.STRING(32), allowNull: true },
      unitPrice: {
        type: DataTypes.BIGINT,
        allowNull: true,
        get() {
          const value = this.getDataValue('unitPrice');

          return value === null ? null : Number(value);
        },
      },
      ratioNum: { type: DataTypes.INTEGER, allowNull: true },
      ratioDen: { type: DataTypes.INTEGER, allowNull: true },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('amount'));
        },
      },
      manual: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      meta: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    },
    { sequelize, tableName: 'invoice_lines', underscored: true },
  );
}
