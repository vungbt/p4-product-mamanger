import type {
  ContractStatus,
  InvoiceKind,
  InvoiceStatus,
  MeterKind,
  RoomStatus,
  ServiceKind,
} from './constants.js';
import { StayValueError } from './errors.js';

/** Room code, unique among the building's active rooms: `A`–`Z`, `0`–`9`, `.` and `-`. */
export const ROOM_CODE_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,11}$/;
export const ROOM_CODE_MAX_LENGTH = 12;

/** Floors `0` (ground floor) to `99`. */
export const ROOM_FLOOR_MIN = 0;
export const ROOM_FLOOR_MAX = 99;
export const ROOM_MAX_OCCUPANTS_LIMIT = 20;
export const ROOM_AREA_MAX = 1000;
export const ROOM_PRICE_MAX = 1_000_000_000;
/** Whole meter readings (kWh, m³), rules.md "Chỉ số điện nước". */
export const METER_READING_MAX = 999_999_999;

/** Bulk creation: at most this many rooms per request, rooms per floor up to the second limit. */
export const ROOM_BULK_LIMIT = 200;
export const ROOM_BULK_PER_FLOOR_MAX = 50;

/** Room code template tokens: `{floor}` (floor number) and `{number}` (two digits, `01`…). */
export const ROOM_CODE_FLOOR_TOKEN = '{floor}';
export const ROOM_CODE_NUMBER_TOKEN = '{number}';
/** `{floor}{number}`: floor 1, rooms 1–4 → `101`…`104`. */
export const DEFAULT_ROOM_CODE_TEMPLATE = `${ROOM_CODE_FLOOR_TOKEN}${ROOM_CODE_NUMBER_TOKEN}`;

/** Upper-case, trimmed room code as stored. */
export function normalizeRoomCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isRoomCode(value: unknown): value is string {
  return typeof value === 'string' && ROOM_CODE_PATTERN.test(value);
}

export interface RoomCodeTemplateInput {
  floorFrom: number;
  floorTo: number;
  roomsPerFloor: number;
  /** Must contain `{number}`; `{floor}` is needed when several floors are generated. */
  template: string;
}

export interface GeneratedRoomCode {
  code: string;
  floor: number;
}

/**
 * Codes of a bulk creation, floor by floor: `{floor}{number}` with floors 1–2 and 2 rooms per
 * floor gives `101, 102, 201, 202`. Throws `StayValueError` for an invalid range or template.
 */
export function generateRoomCodes({
  floorFrom,
  floorTo,
  roomsPerFloor,
  template,
}: RoomCodeTemplateInput): GeneratedRoomCode[] {
  const integers = [floorFrom, floorTo, roomsPerFloor].every(Number.isSafeInteger);

  if (
    !integers ||
    floorFrom < ROOM_FLOOR_MIN ||
    floorTo > ROOM_FLOOR_MAX ||
    floorFrom > floorTo ||
    roomsPerFloor < 1 ||
    roomsPerFloor > ROOM_BULK_PER_FLOOR_MAX
  )
    throw new StayValueError('INVALID_ROOM_RANGE', 'Invalid floor range or room count', {
      floorFrom,
      floorTo,
      roomsPerFloor,
    });
  if ((floorTo - floorFrom + 1) * roomsPerFloor > ROOM_BULK_LIMIT)
    throw new StayValueError('ROOM_BULK_LIMIT', `At most ${ROOM_BULK_LIMIT} rooms at once`, {
      limit: ROOM_BULK_LIMIT,
    });
  if (
    !template.includes(ROOM_CODE_NUMBER_TOKEN) ||
    (floorFrom !== floorTo && !template.includes(ROOM_CODE_FLOOR_TOKEN))
  )
    throw new StayValueError('INVALID_ROOM_TEMPLATE', 'Invalid room code template', template);

  const codes: GeneratedRoomCode[] = [];

  for (let floor = floorFrom; floor <= floorTo; floor += 1) {
    for (let number = 1; number <= roomsPerFloor; number += 1) {
      const code = normalizeRoomCode(
        template
          .replaceAll(ROOM_CODE_FLOOR_TOKEN, String(floor))
          .replaceAll(ROOM_CODE_NUMBER_TOKEN, String(number).padStart(2, '0')),
      );

      if (!isRoomCode(code))
        throw new StayValueError('INVALID_ROOM_TEMPLATE', 'Invalid room code template', template);
      codes.push({ code, floor });
    }
  }

  return codes;
}

/** `GET /api/buildings/:buildingId/rooms?status=`. */
export const ROOM_STATUS_FILTERS: readonly RoomStatus[] = [
  'vacant',
  'reserved',
  'occupied',
  'maintenance',
];

/** The contract holding the room (`active`/`ending`, or a reserving one). Filled by ST-10. */
export interface RoomContractSummary {
  id: string;
  code: string;
  status: ContractStatus;
  primaryTenantName: string | null;
  startDate: string;
  endDate: string | null;
  /** Agreed monthly rent (VND). */
  rent: number;
  /** Deposit currently held (VND). */
  depositHeld: number;
}

/** A room as listed on the room map (`GET /api/buildings/:buildingId/rooms`). */
export interface StayRoom {
  id: string;
  buildingId: string;
  code: string;
  floor: number;
  /** m², up to two decimals. */
  areaM2: number | null;
  /** Advertised monthly rent (VND); the contract fixes the agreed rent. */
  listPrice: number;
  maxOccupants: number;
  maintenance: boolean;
  maintenanceReason: string | null;
  /** Expected end of the maintenance (`YYYY-MM-DD`). */
  maintenanceUntil: string | null;
  note: string | null;
  archivedAt: string | null;
  /**
   * Derived (rules.md): `reserved`/`occupied` from the room's contract, else `maintenance` when
   * switched on, else `vacant`. Never set by hand.
   */
  status: RoomStatus;
  defaultServiceIds: string[];
  /** Current contract; `null` until contracts exist (ST-10). */
  contract: RoomContractSummary | null;
  /** People living in the room today (ST-10). */
  occupantCount: number;
  /** Unpaid amount of issued invoices (VND, ST-14/ST-18). */
  debt: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** A service suggested by default when creating a contract for the room. */
export interface RoomService {
  id: string;
  code: string;
  name: string;
  kind: ServiceKind;
  unit: string;
  active: boolean;
}

/** An installed electricity or water meter of the room. */
export interface RoomMeter {
  id: string;
  kind: MeterKind;
  serial: string | null;
  installedOn: string;
  /** Whole number (kWh, m³) read when the meter was installed. */
  initialReading: number;
  /** Latest recorded reading (ST-13); `null` until the first one. */
  latestReading: number | null;
  /** Period of `latestReading` (`YYYY-MM`). */
  latestPeriod: string | null;
}

/** Someone living in the room under its current contract (ST-10). */
export interface RoomOccupant {
  tenantId: string;
  fullName: string;
  phone: string | null;
  isPrimary: boolean;
  fromDate: string;
}

/** One of the room's latest invoices (ST-14). */
export interface RoomInvoiceSummary {
  id: string;
  code: string | null;
  kind: InvoiceKind;
  period: string;
  status: InvoiceStatus;
  total: number;
  paidTotal: number;
  dueOn: string | null;
}

/** `GET /api/rooms/:id`. Sections owned by later tasks are empty until they ship. */
export interface StayRoomDetail extends StayRoom {
  buildingCode: string;
  buildingName: string;
  defaultServices: RoomService[];
  meters: RoomMeter[];
  occupants: RoomOccupant[];
  /** Latest six invoices, newest first. */
  invoices: RoomInvoiceSummary[];
}

/** Number of active rooms per derived status. */
export interface RoomStatusCounts {
  vacant: number;
  reserved: number;
  occupied: number;
  maintenance: number;
}

/** `GET /api/buildings/:buildingId/rooms/summary`: counters and floors of the room map. */
export interface RoomSummary {
  buildingId: string;
  total: number;
  counts: RoomStatusCounts;
  /** Floors with at least one active room, ascending. */
  floors: number[];
}

/** One code of a bulk creation preview. */
export interface RoomBulkPreviewItem {
  code: string;
  floor: number;
  /** An active room already has this code: it will be skipped. */
  exists: boolean;
}

/** `POST /api/buildings/:buildingId/rooms/bulk/preview`. */
export interface RoomBulkPreview {
  items: RoomBulkPreviewItem[];
  createCount: number;
  skipCount: number;
}

export interface RoomBulkSkipped {
  code: string;
  floor: number;
  reason: 'exists';
}

/** `POST /api/buildings/:buildingId/rooms/bulk`. Replays with the same key return this again. */
export interface RoomBulkResult {
  buildingId: string;
  created: StayRoom[];
  skipped: RoomBulkSkipped[];
}
