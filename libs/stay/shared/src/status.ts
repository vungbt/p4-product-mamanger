import type { ContractStatus, InvoiceStatus, MeterReadingStatus } from './constants.js';
import { compareIsoDates, type IsoDate } from './date.js';

type TransitionMap<S extends string> = Readonly<Record<S, readonly S[]>>;

/**
 * `draft` → `active` → `ending` → `ended`; `draft` → `cancelled`.
 * Renewal keeps `active` (no transition).
 */
export const CONTRACT_TRANSITIONS: TransitionMap<ContractStatus> = {
  draft: ['active', 'cancelled'],
  active: ['ending'],
  ending: ['ended'],
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

/** Overdue is derived: `issued`/`partially_paid` and `today` is after the due date. */
export function isInvoiceOverdue(status: InvoiceStatus, dueOn: IsoDate, today: IsoDate): boolean {
  return (status === 'issued' || status === 'partially_paid') && compareIsoDates(today, dueOn) > 0;
}
