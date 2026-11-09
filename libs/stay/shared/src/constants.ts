/** Business time zone: periods and business dates are evaluated here. */
export const STAY_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/** Default `roundingUnit` of a building (VND). */
export const DEFAULT_ROUNDING_UNIT = 1000;

export const ROOM_STATUSES = ['vacant', 'reserved', 'occupied', 'maintenance'] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const CONTRACT_STATUSES = ['draft', 'active', 'ending', 'ended', 'cancelled'] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const INVOICE_STATUSES = ['draft', 'issued', 'partially_paid', 'paid', 'void'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** Payments are never edited or deleted; `reversed` is derived from `reversed_at`. */
export const PAYMENT_STATUSES = ['recorded', 'reversed'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Deposit lifecycle: `held` → `applied` / `refunded` / `forfeited` (partially or fully). */
export const DEPOSIT_STATUSES = ['held', 'applied', 'refunded', 'forfeited'] as const;
export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];

/** Rows of the deposit ledger (`deposit_entries.type`). */
export const DEPOSIT_ENTRY_TYPES = ['received', 'applied', 'refunded', 'forfeited'] as const;
export type DepositEntryType = (typeof DEPOSIT_ENTRY_TYPES)[number];

export const METER_READING_STATUSES = ['draft', 'locked'] as const;
export type MeterReadingStatus = (typeof METER_READING_STATUSES)[number];

export const METER_KINDS = ['electricity', 'water'] as const;
export type MeterKind = (typeof METER_KINDS)[number];

export const SERVICE_KINDS = [
  'electricity',
  'water',
  'per_room',
  'per_person',
  'per_vehicle',
] as const;
export type ServiceKind = (typeof SERVICE_KINDS)[number];

/** Service kinds billed in advance with the rent (everything except metered kinds). */
export const FIXED_SERVICE_KINDS = ['per_room', 'per_person', 'per_vehicle'] as const;
export type FixedServiceKind = (typeof FIXED_SERVICE_KINDS)[number];

export const INVOICE_KINDS = ['move_in', 'monthly', 'settlement'] as const;
export type InvoiceKind = (typeof INVOICE_KINDS)[number];

export const INVOICE_LINE_TYPES = [
  'rent',
  'service',
  'electricity',
  'water',
  'surcharge',
  'discount',
  'adjustment',
  'refund',
  'deposit',
  'rounding',
] as const;
export type InvoiceLineType = (typeof INVOICE_LINE_TYPES)[number];

export function isMeterKind(value: unknown): value is MeterKind {
  return (METER_KINDS as readonly unknown[]).includes(value);
}

export function isFixedServiceKind(value: unknown): value is FixedServiceKind {
  return (FIXED_SERVICE_KINDS as readonly unknown[]).includes(value);
}
