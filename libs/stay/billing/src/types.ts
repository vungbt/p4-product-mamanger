import type {
  FixedServiceKind,
  InvoiceKind,
  InvoiceLineType,
  IsoDate,
  MeterKind,
  Period,
  ServiceKind,
  Vnd,
} from '@stay/shared';

export const LINE_DESCRIPTION_KEYS = {
  rent: 'invoiceLine.rent',
  service: 'invoiceLine.service',
  electricity: 'invoiceLine.electricity',
  water: 'invoiceLine.water',
  surcharge: 'invoiceLine.surcharge',
  discount: 'invoiceLine.discount',
  adjustment: 'invoiceLine.adjustment',
  refundRent: 'invoiceLine.refundRent',
  refundService: 'invoiceLine.refundService',
  rounding: 'invoiceLine.rounding',
} as const;

export type LineDescriptionKey = (typeof LINE_DESCRIPTION_KEYS)[keyof typeof LINE_DESCRIPTION_KEYS];

/** i18n key and parameters; the UI renders the text, the snapshot stays language-neutral. */
export interface LineDescription {
  key: LineDescriptionKey;
  params: Record<string, string | number>;
}

export interface MeterSegmentSnapshot {
  meterId: string | null;
  startReading: number;
  endReading: number;
  consumption: number;
}

/** JSON stored in `invoice_lines.meta`. */
export interface InvoiceLineMeta {
  serviceCode?: string;
  serviceKind?: ServiceKind;
  /** First and last day billed by a prorated rent/service line (inclusive). */
  coveredFrom?: IsoDate;
  coveredTo?: IsoDate;
  /** Metered lines: first start and last end reading, and every meter segment. */
  startReading?: number;
  endReading?: number;
  segments?: MeterSegmentSnapshot[];
  reason?: string;
  /** Adjustment: the original invoice being corrected. */
  referenceInvoiceId?: string;
  /** Refund: the invoice that prepaid the refunded days. */
  sourceInvoiceId?: string;
  /** Metered line of a room the contract has left (room change): that room. */
  roomId?: string;
  /** Contract event that produced the line (room change closing readings). */
  sourceEventId?: string;
}

/** One row of `invoice_lines`: a complete snapshot, never re-read from price tables. */
export interface InvoiceLine {
  type: InvoiceLineType;
  serviceId: string | null;
  description: LineDescription;
  period: Period | null;
  quantity: number;
  unit: string | null;
  unitPrice: Vnd | null;
  ratioNum: number | null;
  ratioDen: number | null;
  amount: Vnd;
  meta: InvoiceLineMeta;
}

export interface ComputedInvoice {
  kind: InvoiceKind;
  period: Period;
  lines: InvoiceLine[];
  /** Sum of all lines except the rounding line. */
  subtotal: Vnd;
  /** `total − subtotal`; also present as a `rounding` line when non-zero. */
  rounding: Vnd;
  /** Sum of every line, a multiple of `roundingUnit`. */
  total: Vnd;
  roundingUnit: Vnd;
}

/** Contract days; `endDate` is the last day of stay (inclusive), `null` when open-ended. */
export interface ContractTerm {
  startDate: IsoDate;
  endDate?: IsoDate | null;
}

export interface FixedServiceInput {
  serviceId?: string | null;
  code: string;
  name: string;
  kind: FixedServiceKind;
  unit?: string | null;
  /** Resolved price snapshot (see `resolvePrice`). */
  unitPrice: Vnd;
}

/** Readings of one physical meter over the consumption window. */
export interface MeterSegment {
  meterId?: string | null;
  startReading: number | null | undefined;
  endReading: number | null | undefined;
}

export interface UtilityInput {
  kind: MeterKind;
  serviceId?: string | null;
  code?: string;
  name?: string;
  unit?: string | null;
  unitPrice: Vnd;
  /** One segment normally; two when the meter was replaced during the window. */
  segments: MeterSegment[];
  /** Set for the closing segment of a room the contract moved out of; copied to `meta`. */
  roomId?: string;
  /** Contract event of that room change; copied to `meta`. */
  sourceEventId?: string;
}

export type ManualLineInput =
  | { type: 'surcharge'; amount: Vnd; reason: string }
  /** `amount` is the positive discount; the line is stored negative. */
  | { type: 'discount'; amount: Vnd; reason: string }
  /** Signed correction of an issued invoice that already has payments. */
  | { type: 'adjustment'; amount: Vnd; reason: string; referenceInvoiceId: string };

export interface BillingOptions {
  /** Building rounding unit for the invoice total. Default 1.000đ. */
  roundingUnit?: Vnd;
}

export interface MonthlyInvoiceInput extends BillingOptions {
  /** Period M. Rent and services are for M; utilities are consumption of M−1. */
  period: Period;
  contract: ContractTerm & { rent: Vnd };
  /** Registered occupants on the issue date. */
  occupantCount: number;
  /** Registered vehicles on the issue date. */
  vehicleCount: number;
  services?: FixedServiceInput[];
  utilities?: UtilityInput[];
  manualLines?: ManualLineInput[];
}

export interface MoveInInvoiceInput extends BillingOptions {
  contract: ContractTerm & { rent: Vnd };
  occupantCount: number;
  vehicleCount: number;
  services?: FixedServiceInput[];
  manualLines?: ManualLineInput[];
}

/** A rent/service line already billed in advance, as stored in `invoice_lines`. */
export interface PrepaidLineInput {
  type: 'rent' | 'service';
  serviceId?: string | null;
  code?: string;
  name?: string;
  period: Period;
  unitPrice: Vnd;
  quantity: number;
  coveredFrom: IsoDate;
  coveredTo: IsoDate;
  sourceInvoiceId?: string;
}

export interface OutstandingInvoiceInput {
  invoiceId: string;
  code?: string | null;
  period?: Period;
  total: Vnd;
  paidTotal: Vnd;
}

export interface OutstandingInvoice extends OutstandingInvoiceInput {
  remaining: Vnd;
}

export interface SettlementCharges {
  rent: Vnd;
  /** Registered occupants on the settlement date. */
  occupantCount: number;
  /** Registered vehicles on the settlement date. */
  vehicleCount: number;
  services?: FixedServiceInput[];
}

export interface SettlementInput extends BillingOptions {
  contract: { startDate: IsoDate };
  /** Move-out day D, the last day of stay (inclusive). */
  moveOutDate: IsoDate;
  /**
   * Periods that already have an issued monthly or move-in invoice. Every other period from the
   * contract start to D is charged rent + services for the days stayed. Periods of
   * `prepaidLines` count as invoiced too.
   */
  invoicedPeriods: Period[];
  /** Required when a period is not invoiced: rent and services as for a monthly invoice. */
  charges?: SettlementCharges;
  /** Utilities from the latest closing reading to the move-out reading. */
  utilities?: UtilityInput[];
  /** Building setting; default policy is `false` (no refund). */
  refundUnusedRent: boolean;
  /** Required when `refundUnusedRent` is on: prepaid rent/service lines covering days after D. */
  prepaidLines?: PrepaidLineInput[];
  /** Move-out surcharges (damage, cleaning…), each with a reason. */
  surcharges?: ManualLineInput[];
  /** Earlier unpaid invoices: listed and collected together, never added as lines. */
  outstandingInvoices?: OutstandingInvoiceInput[];
  /** Deposit balance currently held. */
  depositHeld: Vnd;
}

export interface SettlementResult extends ComputedInvoice {
  kind: 'settlement';
  outstandingInvoices: OutstandingInvoice[];
  outstandingTotal: Vnd;
  /** Settlement invoice total + outstanding remaining. */
  amountDue: Vnd;
  depositHeld: Vnd;
  /** Portion of the deposit offset against `amountDue` (`applied` entries). */
  depositApplied: Vnd;
  /** Portion of the deposit returned (`refunded` entry). */
  depositRefunded: Vnd;
  /** Owner pays the tenant X (`depositHeld − amountDue` when positive). */
  ownerRefunds: Vnd;
  /** Tenant pays Y (`amountDue − depositHeld` when positive). */
  tenantPays: Vnd;
}

export interface DepositAllocationInput {
  depositHeld: Vnd;
  /** Settlement invoice total (may be ≤ 0). */
  settlementTotal: Vnd;
  /** Earlier invoices with something left to collect, oldest first. */
  outstandingInvoices: { invoiceId: string; remaining: Vnd }[];
}

export interface DepositAllocationLine {
  /** `null`: the settlement invoice (not created yet in a preview). */
  invoiceId: string | null;
  /** Deposit recorded on this invoice (may be 0 when the deposit ran out). */
  amount: Vnd;
  /** Still owed on this invoice after the deposit. */
  remaining: Vnd;
}

export interface DepositAllocation {
  allocations: DepositAllocationLine[];
  /** Sum of `allocations` (`applied` entries). */
  depositApplied: Vnd;
  /** Part of `depositApplied` on the settlement invoice. */
  settlementDepositApplied: Vnd;
  /** Deposit returned (`refunded` entry). */
  depositRefunded: Vnd;
  /** −total of a negative settlement invoice: owed to the tenant, paid with the refund. */
  settlementCredit: Vnd;
  /** Still owed on the invoices after the deposit. */
  remainingDue: Vnd;
  /** Net: owner pays the tenant X. */
  ownerRefunds: Vnd;
  /** Net: tenant pays Y. */
  tenantPays: Vnd;
}
