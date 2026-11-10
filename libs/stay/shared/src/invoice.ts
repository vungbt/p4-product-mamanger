import type { InvoiceKind, InvoiceLineType, InvoiceStatus } from './constants.js';

export interface StayInvoiceLine {
  id: string;
  type: InvoiceLineType;
  serviceId: string | null;
  description: { key: string; params: Record<string, string | number> };
  period: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number | null;
  ratioNum: number | null;
  ratioDen: number | null;
  amount: number;
  meta: {
    startReading?: number;
    endReading?: number;
    segments?: { meterId: string | null; startReading: number; endReading: number; consumption: number }[];
    reason?: string;
    referenceInvoiceId?: string;
    sourceEventId?: string;
    roomId?: string;
  };
}

export interface StayInvoice {
  id: string;
  buildingId: string;
  contractId: string;
  roomId: string;
  roomCode: string;
  kind: InvoiceKind;
  period: string;
  code: string | null;
  status: InvoiceStatus;
  issuedOn: string | null;
  dueOn: string;
  subtotal: number;
  rounding: number;
  roundingUnit: number;
  total: number;
  paidTotal: number;
  remaining: number;
  overdue: boolean;
  voidReason: string | null;
  version: number;
  lines: StayInvoiceLine[];
}

export interface BillingPreviewRow {
  contractId: string;
  roomId: string;
  roomCode: string;
  eligible: boolean;
  reason: string | null;
  total: number | null;
  invoiceId: string | null;
}

export interface BillingPreview {
  buildingId: string;
  period: string;
  rows: BillingPreviewRow[];
  expectedTotal: number;
}

export interface InvoiceManualInput {
  type: 'surcharge' | 'discount';
  description: string;
  amount: number;
  reason: string;
}
