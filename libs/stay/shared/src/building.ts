import type { ServiceKind } from './constants.js';
import type { BillingDay, BillingSettings, ReadingDayMonth, RoundingUnit } from './settings.js';

/** Building code used in invoice codes: `A`–`Z`, `0`–`9`, at most 6 characters. */
export const BUILDING_CODE_PATTERN = /^[A-Z0-9]{1,6}$/;

/**
 * Code suggested from a building name: the initial of each word without diacritics (`đ` → `D`),
 * numbers kept whole, upper case, at most 6 characters — "Nhà trọ Hoà Bình 2" → `NTHB2`.
 * Empty when the name has no letters or digits.
 */
export function suggestBuildingCode(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
    .map((word) => (/^\d+$/.test(word) ? word : word.charAt(0)))
    .join('')
    .slice(0, 6);
}

/** `GET /api/buildings?status=`: archived buildings are hidden by default. */
export const BUILDING_STATUS_FILTERS = ['active', 'archived', 'all'] as const;
export type BuildingStatusFilter = (typeof BUILDING_STATUS_FILTERS)[number];

/** Quick counters of a building (rooms arrive with ST-08, contracts with ST-10). */
export interface BuildingStats {
  roomCount: number;
  /** Rooms with an active contract. */
  occupiedRoomCount: number;
}

/** A building as listed by `GET /api/buildings`. Billing fields set to `null` follow `/api/settings`. */
export interface StayBuilding {
  id: string;
  code: string;
  name: string;
  address: string | null;
  readingDay: BillingDay | null;
  readingDayMonth: ReadingDayMonth | null;
  issueDay: BillingDay | null;
  dueDay: BillingDay | null;
  graceDays: number | null;
  roundingUnit: RoundingUnit | null;
  refundUnusedRent: boolean | null;
  /** Move-out facility depreciation fee (VND, 0 = off); `null` follows the system. */
  moveOutFee: number | null;
  /** VietQR bank BIN (6 digits). */
  bankBin: string | null;
  bankAccount: string | null;
  /** Account holder in upper case without diacritics. */
  bankAccountName: string | null;
  /** House rules shown to tenants. */
  rulesText: string | null;
  /** Contact phone shown to tenants. */
  contactPhone: string | null;
  archivedAt: string | null;
  stats: BuildingStats;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** `GET /api/buildings/:id`. */
export interface StayBuildingDetail extends StayBuilding {
  /** Billing parameters in force: the building's own values, else the system defaults. */
  billing: BillingSettings;
  /** The code is locked once the building has invoices. */
  codeLocked: boolean;
}

/** One dated price override (`building_service_prices`); `price: null` returns to the default. */
export interface BuildingPriceOverride {
  id: string;
  serviceId: string;
  price: number | null;
  effectiveFrom: string;
  createdAt: string;
}

/** Price of one service in a building on a date. */
export interface BuildingServicePrice {
  serviceId: string;
  code: string;
  name: string;
  /** Optional service description (e.g. "Thang máy, máy giặt, rác"). */
  description: string | null;
  kind: ServiceKind;
  unit: string;
  active: boolean;
  defaultPrice: number;
  /** Price in force on the requested date. */
  price: number;
  /** `override` when a building price applies, else `default`. */
  source: 'default' | 'override';
  /** `effectiveFrom` of the override row that decided the price, `null` without one. */
  effectiveFrom: string | null;
  /** Every override of this service in the building, newest `effectiveFrom` first. */
  history: BuildingPriceOverride[];
}

/** `GET /api/buildings/:id/prices`. */
export interface BuildingPriceList {
  buildingId: string;
  /** Date the prices are resolved for (`YYYY-MM-DD`, Asia/Ho_Chi_Minh). */
  date: string;
  items: BuildingServicePrice[];
}
