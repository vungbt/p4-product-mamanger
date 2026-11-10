import type { InvoiceKind, InvoiceLineType, InvoiceStatus, MeterKind } from './constants.js';
import type { StayPayment } from './payment.js';

/** Line types an owner/manager adds by hand to a draft (`POST /api/invoices/:id/lines`). */
export const MANUAL_INVOICE_LINE_TYPES = ['surcharge', 'discount'] as const;
export type ManualInvoiceLineType = (typeof MANUAL_INVOICE_LINE_TYPES)[number];

/** One physical meter of a metered line: `consumption = endReading − startReading`. */
export interface StayInvoiceMeterSegment {
  meterId: string | null;
  startReading: number;
  endReading: number;
  consumption: number;
}

/** Snapshot details of a line (`invoice_lines.meta`); never re-read from price tables. */
export interface StayInvoiceLineMeta {
  serviceCode?: string;
  serviceKind?: string;
  /** Prorated rent/service: first and last day billed (inclusive). */
  coveredFrom?: string;
  coveredTo?: string;
  /** Metered lines: first start and last end reading, and every meter segment. */
  startReading?: number;
  endReading?: number;
  segments?: StayInvoiceMeterSegment[];
  /** Manual lines: the reason entered by the owner/manager. */
  reason?: string;
  /** Adjustment: the corrected invoice. */
  referenceInvoiceId?: string;
  /** Refund: the invoice that prepaid the refunded days. */
  sourceInvoiceId?: string;
  /** Closing segment of a room the contract moved out of (room change). */
  roomId?: string;
  /** Contract event of that room change. */
  sourceEventId?: string;
}

/** Language-neutral description: `key` is an i18n key (`invoiceLine.rent`…) with parameters. */
export interface StayInvoiceLineDescription {
  key: string;
  params: Record<string, string | number>;
}

export interface StayInvoiceLine {
  id: string;
  type: InvoiceLineType;
  serviceId: string | null;
  description: StayInvoiceLineDescription;
  /** Rent/service: billed month. Utilities: consumption month (M−1). */
  period: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number | null;
  ratioNum: number | null;
  ratioDen: number | null;
  /** Integer VND; negative for discounts and negative rounding. */
  amount: number;
  /** Added by hand (surcharge/discount); kept when the draft is refreshed. */
  manual: boolean;
  meta: StayInvoiceLineMeta;
}

/** `GET /api/invoices` row. */
export interface StayInvoiceSummary {
  id: string;
  buildingId: string;
  contractId: string;
  contractCode: string;
  roomId: string;
  roomCode: string;
  kind: InvoiceKind;
  /** Billing period `YYYY-MM` (move-in: the start month). */
  period: string;
  /** `{building}-{YYYYMM}-{nnn}`, assigned when issued; `null` for drafts. */
  code: string | null;
  status: InvoiceStatus;
  issuedOn: string | null;
  dueOn: string;
  subtotal: number;
  rounding: number;
  total: number;
  paidTotal: number;
  /** `total − paidTotal`. */
  remaining: number;
  /** Derived: issued/partially paid, past `dueOn` (Asia/Ho_Chi_Minh) and `remaining > 0`. */
  overdue: boolean;
  version: number;
  createdAt: string;
}

/** `GET /api/invoices/:id`: the invoice with its snapshot lines (sum of `amount` = `total`). */
export interface StayInvoice extends StayInvoiceSummary {
  roundingUnit: number;
  voidReason: string | null;
  voidedAt: string | null;
  lines: StayInvoiceLine[];
  /** Payment history (ST-15), newest first, reversed ones included. */
  payments: StayPayment[];
}

/** Why a contract gets no draft for the period. */
export const BILLING_EXCLUSION_REASONS = [
  /** A closing reading of the consumption month (M−1) is missing. */
  'missing_reading',
  /** The room has no meter for a registered utility. */
  'missing_meter',
  /** A reading is lower than the previous one (data-entry error; never clamped to 0). */
  'negative_consumption',
  /** The period already has an issued invoice (never recomputed). */
  'already_issued',
  /** The contract has a move-in invoice for this period (next one is M+1). */
  'move_in_invoice',
  /** The contract has no day of stay in the period. */
  'no_occupancy',
  /** Other invalid billing data (see `reasonDetail`). */
  'invalid_data',
] as const;
export type BillingExclusionReason = (typeof BILLING_EXCLUSION_REASONS)[number];

export interface BillingPreviewRow {
  contractId: string;
  contractCode: string;
  roomId: string;
  roomCode: string;
  eligible: boolean;
  reason: BillingExclusionReason | null;
  /** E.g. `{ kind: 'electricity', period: '2026-10' }` for a missing reading. */
  reasonDetail: { kind?: MeterKind; period?: string; message?: string } | null;
  /** Existing non-void monthly/move-in invoice of the period. */
  invoiceId: string | null;
  invoiceStatus: InvoiceStatus | null;
  /** Expected (eligible) or issued total; `null` when excluded for missing data. */
  subtotal: number | null;
  total: number | null;
}

/** `GET /api/buildings/:buildingId/billing/:period/preview`. */
export interface BillingPreview {
  buildingId: string;
  period: string;
  /** Consumption month of the utilities (M−1). */
  utilityPeriod: string;
  issueDate: string;
  dueDate: string;
  rows: BillingPreviewRow[];
  eligibleCount: number;
  excludedCount: number;
  /** Sum of eligible rows: drafts that will be created or refreshed. */
  expectedTotal: number;
}

/** `POST /api/buildings/:buildingId/billing/:period/drafts`. */
export interface BillingDraftResult extends BillingPreview {
  created: number;
  refreshed: number;
  /** Same `Idempotency-Key` and body: nothing was written again. */
  replayed: boolean;
}

/** `POST /api/invoices/:id/lines`. `amount` is positive; a discount is stored negative. */
export interface InvoiceLineInput {
  type: ManualInvoiceLineType;
  amount: number;
  reason: string;
  /** Optional optimistic lock: the invoice `version` read by the client. */
  version?: number;
}

/** `POST /api/invoices/issue`. */
export interface InvoiceIssueInput {
  ids: string[];
}

export interface InvoiceIssueResult {
  invoices: StayInvoiceSummary[];
  count: number;
  total: number;
}

/** `POST /api/invoices/:id/void`. */
export interface InvoiceVoidInput {
  reason: string;
  version?: number;
}
