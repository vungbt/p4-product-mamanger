import type { MeterKind } from './constants.js';

export interface MeterReadingInput {
  meterId: string;
  period: string;
  reading: number;
  readOn: string;
  photoFileId?: string | null;
  /** 0 for a new reading. */
  version: number;
  confirmHighConsumption?: boolean;
}

export interface MeterReplacementInput {
  finalReading: number;
  initialReading: number;
  replacedOn: string;
  serial?: string | null;
  confirmHighConsumption?: boolean;
}

export interface StayMeterReading {
  id: string;
  meterId: string;
  period: string;
  reading: number;
  readOn: string;
  photoFileId: string | null;
  photo: { url: string; expiresAt: string } | null;
  status: 'draft' | 'locked';
  version: number;
}

export interface ReadingMeter {
  meterId: string;
  kind: MeterKind;
  previous: number;
  /** Consumption of any closed segments in this period. */
  carriedConsumption: number;
  current: StayMeterReading | null;
  consumption: number | null;
  segments?: { meterId: string; startReading: number; endReading: number }[];
  average: number | null;
  warnings: string[];
}

export interface ReadingRoom {
  roomId: string;
  code: string;
  floor: number;
  contractId: string;
  meters: ReadingMeter[];
}

export interface ReadingGrid {
  buildingId: string;
  period: string;
  rooms: ReadingRoom[];
}

export interface ReadingSaveResult {
  meterId: string;
  data: StayMeterReading | null;
  error: { code: string; message: string; status: number } | null;
}

export interface ReadingBulkResult {
  results: ReadingSaveResult[];
}
