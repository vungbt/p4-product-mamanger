import type { ContractStatus, InvoiceKind, InvoiceStatus } from './constants.js';
import { type IsoDate, toEpochDay } from './date.js';

/**
 * Receivable age groups (screens.md O-25), by the most overdue unpaid invoice of a contract:
 * not due yet, 1–7, 8–30 and more than 30 days past `dueOn` (Asia/Ho_Chi_Minh).
 */
export const RECEIVABLE_BUCKETS = ['not_due', '1_7', '8_30', 'over_30'] as const;
export type ReceivableBucket = (typeof RECEIVABLE_BUCKETS)[number];

export const RECEIVABLE_SORT_FIELDS = ['remaining', 'overdueDays', 'roomCode'] as const;
export type ReceivableSortField = (typeof RECEIVABLE_SORT_FIELDS)[number];

/** Whole days `today` is after `dueOn`; 0 on or before the due date. */
export function invoiceOverdueDays(dueOn: IsoDate, today: IsoDate): number {
  return Math.max(0, toEpochDay(today) - toEpochDay(dueOn));
}

export function receivableBucket(overdueDays: number): ReceivableBucket {
  if (overdueDays <= 0) return 'not_due';
  if (overdueDays <= 7) return '1_7';
  if (overdueDays <= 30) return '8_30';
  return 'over_30';
}

/** An unpaid invoice of a receivable row: issued/partially paid with `remaining > 0`. */
export interface ReceivableInvoice {
  id: string;
  code: string | null;
  kind: InvoiceKind;
  period: string;
  status: InvoiceStatus;
  total: number;
  paidTotal: number;
  /** `total − paidTotal`, always > 0. */
  remaining: number;
  dueOn: string;
  /** Days past `dueOn` today (Asia/Ho_Chi_Minh); 0 when not due yet. */
  overdueDays: number;
  /** Expiry of the active share link (ST-16), `null` when none or expired. */
  shareExpiresAt: string | null;
}

/** `GET /api/buildings/:buildingId/receivables` row: one contract with unpaid invoices. */
export interface StayReceivable {
  contractId: string;
  contractCode: string;
  contractStatus: ContractStatus;
  /** Room of the contract today (after room changes). */
  roomId: string;
  roomCode: string;
  /** Full name of the contract's current representative (primary tenant). */
  representativeName: string | null;
  /** Representative's phone for "Gọi"; only for users who may read the building's tenants. */
  representativePhone: string | null;
  /** Unpaid invoices (issued or partially paid, `remaining > 0`); drafts and void excluded. */
  invoiceCount: number;
  remaining: number;
  /** Remaining of the invoices past their due date. */
  overdueRemaining: number;
  oldestDueOn: string;
  /** Days the oldest overdue invoice is past due; 0 when nothing is overdue. */
  overdueDays: number;
  bucket: ReceivableBucket;
  /** Oldest due first. */
  invoices: ReceivableInvoice[];
}

export interface ReceivableBucketTotal {
  bucket: ReceivableBucket;
  /** Contracts (rows) in the bucket. */
  count: number;
  remaining: number;
}

/** `meta` of the receivables list, besides pagination. */
export interface ReceivableTotals {
  /** Sum of `total − paidTotal` of every unpaid invoice of the rows matching `q` and `bucket`. */
  totalRemaining: number;
  /** Part of `totalRemaining` past its due date. */
  overdueRemaining: number;
  /** Unpaid invoices of those rows. */
  invoiceCount: number;
  /** One entry per bucket (zeros included), matching `q` but not the `bucket` filter. */
  buckets: ReceivableBucketTotal[];
}
