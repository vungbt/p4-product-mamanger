import type { ContractStatus, ServiceKind } from './constants.js';

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
