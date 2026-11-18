import type { ContractStatus } from './constants.js';

export interface DepositInput {
  type: 'received' | 'refunded' | 'forfeited';
  amount: number;
  occurredOn: string;
  method: 'cash' | 'bank_transfer' | 'other';
  reason?: string | null;
}

export interface DepositEntry {
  id: string;
  contractId: string;
  type: 'received' | 'applied' | 'refunded' | 'forfeited';
  amount: number;
  occurredOn: string;
  method: 'cash' | 'bank_transfer' | 'other';
  note: string | null;
  invoiceId: string | null;
  createdAt: string;
}

export interface DepositBalance {
  received: number;
  applied: number;
  refunded: number;
  forfeited: number;
  held: number;
}

export interface DepositSummary extends DepositBalance {
  contractId: string;
  buildingId: string;
  code: string;
  status: ContractStatus;
  roomCode: string;
  primaryTenantName: string | null;
}

export interface DepositLedger {
  contractId: string;
  buildingId: string;
  balance: DepositBalance;
  entries: DepositEntry[];
}
