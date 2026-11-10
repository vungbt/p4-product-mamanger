import type { PaymentMethod } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

export interface PaymentAttributes {
  id: string;
  invoiceId: string;
  buildingId: string;
  amount: number;
  method: PaymentMethod;
  paidOn: string;
  reference: string | null;
  note: string | null;
  reversedAt: Date | null;
  reverseReason: string | null;
  reversedBy: string | null;
  actorId: string | null;
  createdAt?: Date;
}

/** Append-only: rows are only inserted, then possibly reversed once (`reversed_at`). */
export class PaymentModel extends Model<
  PaymentAttributes,
  Optional<
    PaymentAttributes,
    'id' | 'reference' | 'note' | 'reversedAt' | 'reverseReason' | 'reversedBy' | 'createdAt'
  >
> {
  declare id: string;
  declare invoiceId: string;
  declare buildingId: string;
  declare amount: number;
  declare method: PaymentMethod;
  declare paidOn: string;
  declare reference: string | null;
  declare note: string | null;
  declare reversedAt: Date | null;
  declare reverseReason: string | null;
  declare reversedBy: string | null;
  declare actorId: string | null;
  declare readonly createdAt: Date;
}

export function initPaymentModel(sequelize: Sequelize) {
  PaymentModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      invoiceId: { type: DataTypes.UUID, allowNull: false },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        // BIGINT comes back as a string from pg; money stays a safe integer.
        get() {
          return Number(this.getDataValue('amount'));
        },
      },
      method: { type: DataTypes.STRING(16), allowNull: false },
      paidOn: { type: DataTypes.DATEONLY, allowNull: false },
      reference: { type: DataTypes.STRING(120), allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: true },
      reversedAt: { type: DataTypes.DATE, allowNull: true },
      reverseReason: { type: DataTypes.TEXT, allowNull: true },
      reversedBy: { type: DataTypes.UUID, allowNull: true },
      actorId: { type: DataTypes.UUID, allowNull: true },
    },
    { sequelize, tableName: 'payments', underscored: true, updatedAt: false },
  );
}
