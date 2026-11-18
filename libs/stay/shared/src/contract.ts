import type {
  ContractStatus,
  InvoiceKind,
  InvoiceLineType,
  ManualPaymentMethod,
  MeterKind,
  ServiceKind,
} from './constants.js';
import type { StayInvoice, StayInvoiceLineDescription, StayInvoiceLineMeta } from './invoice.js';

export interface ContractInput {
  roomId: string;
  startDate: string;
  endDate: string | null;
  rent: number;
  depositAmount: number;
  depositCollected: boolean;
  depositMethod: 'cash' | 'bank_transfer' | 'other';
  depositDate: string | null;
  initialElectricPhotoFileId: string | null;
  initialWaterPhotoFileId: string | null;
  depositNote: string | null;
  initialElectric: number;
  initialWater: number;
  note: string | null;
  occupantIds: string[];
  primaryTenantId: string | null;
  serviceIds: string[];
  vehicleIds: string[];
}

export interface ContractOccupant {
  tenantId: string;
  fullName: string;
  isPrimary: boolean;
  fromDate: string;
  toDate: string | null;
}

export interface ContractService {
  serviceId: string;
  name: string;
  kind: ServiceKind;
  fromDate: string;
  toDate: string | null;
}

export interface ContractVehicle {
  vehicleId: string;
  plate: string;
  fromDate: string;
  toDate: string | null;
}

export interface ContractEvent {
  id: string;
  type: string;
  actorId: string;
  actorName: string;
  payload: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface StayContract extends ContractInput {
  id: string;
  buildingId: string;
  code: string;
  roomCode: string;
  initialElectricPhotoUrl: string | null;
  initialWaterPhotoUrl: string | null;
  status: ContractStatus;
  primaryTenantName: string | null;
  depositHeld: number;
  /** Expected move-out date given with the notice (`ending`); `null` otherwise. */
  noticeDate: string | null;
  /** Move-out day of a settled (`ended`) contract. */
  movedOutAt: string | null;
  /** Non-void settlement invoice (ST-17), once settled. */
  settlementInvoiceId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  occupants: ContractOccupant[];
  services: ContractService[];
  vehicles: ContractVehicle[];
  events: ContractEvent[];
}

export interface MoveInPreviewLine {
  type: string;
  serviceId: string | null;
  label: string;
  quantity: number;
  unitPrice: number | null;
  ratioNum: number | null;
  ratioDen: number | null;
  amount: number;
}

export interface MoveInPreview {
  period: string;
  lines: MoveInPreviewLine[];
  subtotal: number;
  rounding: number;
  total: number;
  occupantCount: number;
  vehicleCount: number;
  warnings: string[];
}

/** toDate is exclusive for changes: a departure is no longer active on that date. */
export type ContractChangeKind =
  | 'renew'
  | 'rent-change'
  | 'occupants'
  | 'leave'
  | 'vehicles'
  | 'services'
  | 'room-change';

export interface ContractChangeInput {
  version: number;
  effectiveDate: string;
  preview?: boolean;
  endDate?: string;
  rent?: number;
  tenantId?: string;
  fullName?: string;
  phone?: string;
  newPrimaryTenantId?: string;
  vehicleId?: string;
  serviceId?: string;
  enabled?: boolean;
  roomId?: string;
  closingElectric?: number;
  closingWater?: number;
  initialElectric?: number;
  initialWater?: number;
}

export interface ContractChangePreview {
  effectiveDate: string;
  period: string;
  utilityPeriod: string | null;
  firstIssuePeriod: string;
  changedFields: string[];
  description: string;
  warnings: string[];
}

export interface ContractChangeResult {
  impact: ContractChangePreview;
  contract: StayContract | null;
}

/** `POST /api/contracts/:id/notice`: active → ending (or a new date while ending). */
export interface ContractNoticeInput {
  version: number;
  /** `YYYY-MM-DD`: not before today or the start date, not after the end date. */
  expectedMoveOutDate: string;
  note?: string | null;
}

/** `POST /api/contracts/:id/cancel-notice`: ending → active. */
export interface ContractVersionInput {
  version: number;
}

export interface SettlementSurchargeInput {
  /** Positive integer VND. */
  amount: number;
  /** Required (damage, cleaning…). */
  reason: string;
}

/** `POST /api/contracts/:id/settlement-preview`. */
export interface ContractSettlementInput {
  /** Move-out day D (inclusive, the last day of stay), not after today. */
  moveOutDate: string;
  /** Final readings; required when the room has that meter and the service is registered. */
  finalElectric?: number | null;
  finalWater?: number | null;
  /** Private `contract_meter` uploads of the final readings. */
  electricPhotoFileId?: string | null;
  waterPhotoFileId?: string | null;
  /**
   * Move-out surcharges, each with a reason (at most 20). Omitted (or `null`): one
   * "Khấu hao cơ sở vật chất" surcharge of the building's `moveOutFee` (none when 0). An array,
   * even empty, is used as sent, so the owner can edit or remove that line.
   */
  surcharges?: SettlementSurchargeInput[] | null;
}

/** `POST /api/contracts/:id/settle` (with an `Idempotency-Key` header). */
export interface ContractSettleInput extends ContractSettlementInput {
  version: number;
  /** How the remaining deposit is returned; default `cash`. */
  refundMethod?: ManualPaymentMethod;
}

/** One computed line of the settlement invoice (snapshot as stored on issue). */
export interface SettlementLine {
  type: InvoiceLineType;
  serviceId: string | null;
  description: StayInvoiceLineDescription;
  period: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number | null;
  ratioNum: number | null;
  ratioDen: number | null;
  amount: number;
  meta: StayInvoiceLineMeta;
}

/** Final utility reading: start = last billed reading (or move-in reading), end = final. */
export interface SettlementReading {
  kind: MeterKind;
  startReading: number;
  endReading: number;
  consumption: number;
}

/** An earlier invoice still owed, collected from the deposit on its own invoice. */
export interface SettlementOutstandingInvoice {
  invoiceId: string;
  code: string | null;
  kind: InvoiceKind;
  period: string;
  total: number;
  paidTotal: number;
  remaining: number;
  /** Part of the deposit recorded on it as a `deposit` payment. */
  depositApplied: number;
}

/** The settlement as computed by `@stay/billing`; settle stores exactly these numbers. */
export interface ContractSettlementPreview {
  contractId: string;
  buildingId: string;
  roomId: string;
  roomCode: string;
  moveOutDate: string;
  /** Period of the settlement invoice (month of the move-out). */
  period: string;
  /** Building setting `refundUnusedRent`. */
  refundUnusedRent: boolean;
  /** Move-out facility depreciation fee in force for the building (0 = off). */
  moveOutFee: number;
  readings: SettlementReading[];
  lines: SettlementLine[];
  subtotal: number;
  rounding: number;
  /** Settlement invoice total; negative when refunds exceed the charges. */
  total: number;
  /** Rent and services of stayed days not covered by an issued invoice. */
  unbilledTotal: number;
  utilitiesTotal: number;
  /** Refund of prepaid days after the move-out (negative or 0). */
  refundTotal: number;
  surchargeTotal: number;
  outstandingInvoices: SettlementOutstandingInvoice[];
  outstandingTotal: number;
  /** Settlement total + outstanding remaining. */
  amountDue: number;
  depositHeld: number;
  /** Deposit recorded as `deposit` payments (older invoices first, then the settlement one). */
  depositApplied: number;
  /** Part of `depositApplied` on the settlement invoice. */
  settlementDepositApplied: number;
  /** Deposit returned to the tenant (`refunded` entry). */
  depositRefunded: number;
  /** Still owed on the invoices after the deposit. */
  remainingDue: number;
  /** "Chủ trọ hoàn X": deposit held − amount due, when positive. */
  ownerRefunds: number;
  /** "Người thuê trả thêm Y": amount due − deposit held, when positive. */
  tenantPays: number;
}

/** `POST /api/contracts/:id/settle`. */
export interface ContractSettlementResult {
  contract: StayContract;
  /** The issued settlement invoice (share it with `POST /api/invoices/:id/share`). */
  invoice: StayInvoice;
  depositApplied: number;
  depositRefunded: number;
  remainingDue: number;
  ownerRefunds: number;
  tenantPays: number;
  /** The same `Idempotency-Key` and body was already settled. */
  replayed: boolean;
}

/** `409 contract_has_draft_invoices`: drafts to issue or void before settling. */
export interface SettlementDraftInvoice {
  invoiceId: string;
  kind: InvoiceKind;
  period: string;
}
