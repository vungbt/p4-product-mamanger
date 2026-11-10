import type { InvoiceStatus, PaymentMethod, PaymentStatus } from './constants.js';

/** `POST /api/invoices/:id/payments` (with an `Idempotency-Key` header). */
export interface PaymentInput {
  /** Integer VND, 1 … the invoice's remaining amount (`payment_exceeds_remaining` otherwise). */
  amount: number;
  method: PaymentMethod;
  /** `YYYY-MM-DD` (Asia/Ho_Chi_Minh), not after today. */
  paidOn: string;
  /** Bank transaction id or receipt number, for reconciliation. */
  reference?: string | null;
  note?: string | null;
}

/** `POST /api/payments/:id/reverse`: a payment is never edited or deleted, only reversed. */
export interface PaymentReverseInput {
  reason: string;
}

/** One payment of an invoice (`GET /api/payments`, `GET /api/invoices/:id` → `payments`). */
export interface StayPayment {
  id: string;
  invoiceId: string;
  /** Invoice code `{building}-{YYYYMM}-{nnn}`. */
  invoiceCode: string | null;
  buildingId: string;
  contractId: string;
  roomId: string;
  roomCode: string;
  amount: number;
  method: PaymentMethod;
  paidOn: string;
  reference: string | null;
  note: string | null;
  /** Derived from `reversedAt`: reversed payments no longer count towards `paidTotal`. */
  status: PaymentStatus;
  reversedAt: string | null;
  reverseReason: string | null;
  /** Display name of who reversed it. */
  reversedByName: string | null;
  /** Display name of who recorded it ("người ghi"). */
  actorName: string | null;
  createdAt: string;
}

/** Sum of the non-reversed payments of one method over the whole filter. */
export interface PaymentMethodTotal {
  method: PaymentMethod;
  amount: number;
  count: number;
}

/** `POST /api/invoices/:id/payments` and `POST /api/payments/:id/reverse`. */
export interface PaymentResult {
  payment: StayPayment;
  /** The invoice after the payment: `paidTotal`, `remaining` and the recomputed status. */
  invoice: {
    id: string;
    status: InvoiceStatus;
    total: number;
    paidTotal: number;
    remaining: number;
    version: number;
  };
}
