import type { PaymentClaimStatus } from '@stay/shared';
import { DataTypes, Model, type Optional, type Sequelize } from 'sequelize';

/** "Tôi đã chuyển khoản" from the tenant portal (ST-25); confirming creates a payment. */
export interface PaymentClaimAttributes {
  id: string;
  buildingId: string;
  contractId: string;
  invoiceId: string;
  tenantId: string;
  portalLinkId: string | null;
  amount: number;
  paidOn: string;
  receiptFileId: string | null;
  reference: string | null;
  note: string | null;
  status: PaymentClaimStatus;
  paymentId: string | null;
  rejectReason: string | null;
  handledBy: string | null;
  handledAt: Date | null;
  idempotencyKey: string | null;
  /** SHA-256 of the submitted body, to tell a retry from another claim with the same key. */
  idempotencyHash: string | null;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentClaimCreation = Optional<
  PaymentClaimAttributes,
  | 'id'
  | 'portalLinkId'
  | 'receiptFileId'
  | 'reference'
  | 'note'
  | 'status'
  | 'paymentId'
  | 'rejectReason'
  | 'handledBy'
  | 'handledAt'
  | 'idempotencyKey'
  | 'idempotencyHash'
  | 'version'
  | 'createdAt'
  | 'updatedAt'
>;

export class PaymentClaimModel
  extends Model<PaymentClaimAttributes, PaymentClaimCreation>
  implements PaymentClaimAttributes
{
  declare id: string;
  declare buildingId: string;
  declare contractId: string;
  declare invoiceId: string;
  declare tenantId: string;
  declare portalLinkId: string | null;
  declare amount: number;
  declare paidOn: string;
  declare receiptFileId: string | null;
  declare reference: string | null;
  declare note: string | null;
  declare status: PaymentClaimStatus;
  declare paymentId: string | null;
  declare rejectReason: string | null;
  declare handledBy: string | null;
  declare handledAt: Date | null;
  declare idempotencyKey: string | null;
  declare idempotencyHash: string | null;
  declare version: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export function initPaymentClaimModel(sequelize: Sequelize) {
  PaymentClaimModel.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      buildingId: { type: DataTypes.UUID, allowNull: false },
      contractId: { type: DataTypes.UUID, allowNull: false },
      invoiceId: { type: DataTypes.UUID, allowNull: false },
      tenantId: { type: DataTypes.UUID, allowNull: false },
      portalLinkId: { type: DataTypes.UUID, allowNull: true },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        // BIGINT comes back as a string from pg; money stays a safe integer.
        get() {
          return Number(this.getDataValue('amount'));
        },
      },
      paidOn: { type: DataTypes.DATEONLY, allowNull: false },
      receiptFileId: { type: DataTypes.UUID, allowNull: true },
      reference: { type: DataTypes.STRING(120), allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: true },
      status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'pending' },
      paymentId: { type: DataTypes.UUID, allowNull: true },
      rejectReason: { type: DataTypes.TEXT, allowNull: true },
      handledBy: { type: DataTypes.UUID, allowNull: true },
      handledAt: { type: DataTypes.DATE, allowNull: true },
      idempotencyKey: { type: DataTypes.STRING(128), allowNull: true },
      idempotencyHash: { type: DataTypes.CHAR(64), allowNull: true },
      version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    },
    { sequelize, tableName: 'payment_claims', underscored: true, version: true },
  );
}
