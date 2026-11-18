/** Reports use invoice periods for billed and actual payment dates for collected. */
export interface ReportAmounts {
  billed: number;
  collected: number;
  expenses: number;
  profit: number;
}

export interface RevenueMonth extends ReportAmounts {
  period: string;
}

export interface RevenueReport {
  buildingId: string;
  from: string;
  to: string;
  months: RevenueMonth[];
  totals: ReportAmounts;
}

export interface RoomReportRow {
  roomId: string;
  roomCode: string;
  billed: number;
  collected: number;
  occupiedMonths: number;
  occupiedDays: number;
  availableDays: number;
  occupancyRate: number | null;
}

export interface RoomsReport {
  buildingId: string;
  year: number;
  rooms: RoomReportRow[];
}

export interface UtilityReportMonth {
  period: string;
  electricityQuantity: number;
  waterQuantity: number;
  electricityBilled: number;
  waterBilled: number;
  electricityExpenses: number;
  waterExpenses: number;
  combinedExpenses: number;
  electricityLossPercent: number | null;
  waterLossPercent: number | null;
}

export interface UtilitiesReport {
  buildingId: string;
  from: string;
  to: string;
  months: UtilityReportMonth[];
}

export const REPORT_SHEETS = ['invoices', 'payments', 'expenses', 'receivables'] as const;
export type ReportSheet = (typeof REPORT_SHEETS)[number];

export interface ReportExportInput {
  buildingId: string;
  from: string;
  to: string;
  sheets: ReportSheet[];
}
