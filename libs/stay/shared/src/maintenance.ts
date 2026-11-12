import type { StayExpense } from './expense.js';
import type {
  MaintenanceCategory,
  MaintenanceSeverity,
  MaintenanceSource,
  MaintenanceStatus,
  RequestPhoto,
} from './requests.js';

/** Staff job, sharing the ST-25 maintenance_requests table. */
export interface MaintenanceInput {
  roomId: string;
  title: string;
  description: string;
  category?: MaintenanceCategory;
  severity?: MaintenanceSeverity;
  photoFileIds?: string[];
}

export interface MaintenanceUpdateInput {
  version: number;
  title?: string;
  description?: string;
  photoFileIds?: string[];
  status?: MaintenanceStatus;
  reply?: string;
}

export interface MaintenanceHistory {
  status: MaintenanceStatus;
  at: string;
}

export interface StayMaintenance {
  id: string;
  buildingId: string;
  roomId: string | null;
  roomCode: string | null;
  title: string;
  description: string;
  source: MaintenanceSource;
  status: MaintenanceStatus;
  photos: RequestPhoto[];
  reply: string | null;
  history: MaintenanceHistory[];
  expense: StayExpense | null;
  version: number;
  createdAt: string;
}
