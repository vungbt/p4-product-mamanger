import { invoiceOverdueDays } from './billing-cycle.js';
import type { ContractStatus, InvoiceStatus, MeterReadingStatus } from './constants.js';
import type { IsoDate } from './date.js';

type TransitionMap<S extends string> = Readonly<Record<S, readonly S[]>>;

/**
 * `draft` → `active` → `ending` → `ended`; `draft` → `cancelled`; `active` → `ended`
 * (settled without prior notice); `ending` → `active` (move-out notice cancelled).
 * Renewal keeps `active` (no transition).
 */
export const CONTRACT_TRANSITIONS: TransitionMap<ContractStatus> = {
  draft: ['active', 'cancelled'],
  active: ['ending', 'ended'],
  ending: ['ended', 'active'],
  ended: [],
  cancelled: [],
};

/**
 * `draft` → `issued` → `partially_paid` → `paid`; `issued` → `void` while unpaid.
 * Payment status is recalculated from non-reversed payments, so an issued invoice may go
 * straight to `paid`, and a reversal may move it back to `partially_paid` or `issued`.
 */
export const INVOICE_TRANSITIONS: TransitionMap<InvoiceStatus> = {
  draft: ['issued'],
  issued: ['partially_paid', 'paid', 'void'],
  partially_paid: ['paid', 'issued'],
  paid: ['partially_paid', 'issued'],
  void: [],
};

/** `draft` → `locked` when an invoice using it is issued; voiding unlocks it. */
export const METER_READING_TRANSITIONS: TransitionMap<MeterReadingStatus> = {
  draft: ['locked'],
  locked: ['draft'],
};

export function canTransition<S extends string>(
  transitions: TransitionMap<S>,
  from: S,
  to: S,
): boolean {
  return transitions[from]?.includes(to) ?? false;
}

/**
 * Overdue is derived: `issued`/`partially_paid` and `today` is after `dueOn + graceDays`
 * (`invoiceOverdueDays` > 0; the building's grace period, 0 = the day after `dueOn`).
 */
export function isInvoiceOverdue(
  status: InvoiceStatus,
  dueOn: IsoDate,
  today: IsoDate,
  graceDays: number,
): boolean {
  return (
    (status === 'issued' || status === 'partially_paid') &&
    invoiceOverdueDays(dueOn, today, graceDays) > 0
  );
}
