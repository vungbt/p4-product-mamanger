import type { CheckoutQuoteSnapshot } from '@p4/shared';
import { DataTypes, Model, type Sequelize } from 'sequelize';
export interface CheckoutQuoteAttributes {
  id: string;
  userId: string;
  status: 'active' | 'consumed' | 'expired';
  snapshot: CheckoutQuoteSnapshot;
  fingerprint: string;
  expiresAt: Date;
  orderId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
export class CheckoutQuoteModel
  extends Model<CheckoutQuoteAttributes>
  implements CheckoutQuoteAttributes
{
  declare id: string;
  declare userId: string;
  declare status: CheckoutQuoteAttributes['status'];
  declare snapshot: CheckoutQuoteSnapshot;
  declare fingerprint: string;
  declare expiresAt: Date;
  declare orderId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
export function initCheckoutQuoteModel(sequelize: Sequelize) {
  CheckoutQuoteModel.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      snapshot: { type: DataTypes.JSONB, allowNull: false },
      fingerprint: { type: DataTypes.STRING, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      orderId: { type: DataTypes.UUID, allowNull: true },
    },
    { sequelize, tableName: 'checkout_quotes', underscored: true },
  );
}
