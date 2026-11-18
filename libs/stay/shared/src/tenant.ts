import { formatIsoDate, isIsoDate } from './date.js';

/**
 * Where a tenant stands, derived from contracts (ST-10): `living` = occupant of an active
 * contract, `left` = only ended contracts, `no_contract` = never on a contract.
 */
export const TENANT_STATUSES = ['living', 'left', 'no_contract'] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

/** `GET /api/tenants?status=`: `all` (default) hides archived profiles, `archived` shows only them. */
export const TENANT_STATUS_FILTERS = ['all', ...TENANT_STATUSES, 'archived'] as const;
export type TenantStatusFilter = (typeof TENANT_STATUS_FILTERS)[number];

export const TENANT_GENDERS = ['male', 'female', 'other'] as const;
export type TenantGender = (typeof TENANT_GENDERS)[number];

/** `tenant_documents.kind`: one front and one back image of the CCCD per tenant. */
export const TENANT_DOCUMENT_KINDS = ['id_front', 'id_back', 'other'] as const;
export type TenantDocumentKind = (typeof TENANT_DOCUMENT_KINDS)[number];

export const VEHICLE_TYPES = ['motorbike', 'electric_bike', 'bicycle', 'car', 'other'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

/** CCCD (căn cước công dân): 12 digits. */
export const ID_NUMBER_PATTERN = /^\d{12}$/;

/** Mobile/landline number stored as `0xxxxxxxxx` (10 digits). */
export const TENANT_PHONE_PATTERN = /^0\d{9}$/;

/** Plate as typed (`59-X1 123.45`): letters, digits, dash, dot and spaces. */
export const VEHICLE_PLATE_PATTERN = /^[0-9A-Z][0-9A-Z.\- ]{2,14}[0-9A-Z]$/;

/**
 * `0xxxxxxxxx` from a phone as people type it (`090 123 4567`, `+84 90-123-4567`, `84901234567`),
 * or `null` when it is not a 10-digit Vietnamese number.
 */
export function normalizePhone(raw: string): string | null {
  const compact = raw.trim().replace(/[\s.\-()]/g, '');
  const digits = compact.startsWith('+84')
    ? `0${compact.slice(3)}`
    : /^84\d{9}$/.test(compact)
      ? `0${compact.slice(2)}`
      : compact;

  return TENANT_PHONE_PATTERN.test(digits) ? digits : null;
}

/** CCCD without spaces/dots, or `null` when it is not 12 digits. */
export function normalizeIdNumber(raw: string): string | null {
  const digits = raw.trim().replace(/[\s.-]/g, '');

  return ID_NUMBER_PATTERN.test(digits) ? digits : null;
}

/** Plate in upper case with single spaces, or `null` when malformed. */
export function normalizePlate(raw: string): string | null {
  const plate = raw.trim().replace(/\s+/g, ' ').toUpperCase();

  return VEHICLE_PLATE_PATTERN.test(plate) ? plate : null;
}

/** Plates compared without separators: `59-X1 123.45` and `59X112345` are the same vehicle. */
export function plateKey(plate: string): string {
  return plate.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

/** CCCD shown on screens: first 3 and last 4 digits (`001*****2345`). */
export function maskIdNumber(idNumber: string): string {
  if (idNumber.length <= 7) return '*'.repeat(idNumber.length);
  return `${idNumber.slice(0, 3)}${'*'.repeat(idNumber.length - 7)}${idNumber.slice(-4)}`;
}

/** `YYYY-MM-DD` from `dd/MM/yyyy`, `d/M/yyyy`, `dd-MM-yyyy` or `YYYY-MM-DD`; `null` otherwise. */
export function parseVietnameseDate(raw: string): string | null {
  const text = raw.trim();

  if (isIsoDate(text)) return text;

  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);

  if (!match) return null;
  try {
    return formatIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));
  } catch {
    return null;
  }
}

/** A building-scoped room reference (rooms arrive with ST-08, occupancy with ST-10). */
export interface TenantRoomRef {
  id: string;
  code: string;
}

/** One row of `GET /api/tenants`. */
export interface StayTenant {
  id: string;
  buildingId: string;
  fullName: string;
  /** `0xxxxxxxxx`. */
  phone: string;
  /** CCCD with the middle digits hidden; `POST /api/tenants/:id/reveal-id` returns it in full. */
  idNumberMasked: string | null;
  status: TenantStatus;
  /** Room of the active contract (ST-10); `null` without one. */
  currentRoom: TenantRoomRef | null;
  /** Temporary residence declared (ST-28); `null` until that feature exists. */
  residenceDeclared: boolean | null;
  archivedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantVehicle {
  id: string;
  tenantId: string;
  plate: string;
  type: VehicleType;
  note: string | null;
  createdAt: string;
}

/**
 * A CCCD image. `url` is a signed, short-lived link to the private file (re-read the profile to
 * renew it); `null` when the file's storage is not available on this server.
 */
export interface TenantDocument {
  id: string;
  kind: TenantDocumentKind;
  fileId: string;
  url: string | null;
  /** When `url` stops working (ISO date-time). */
  urlExpiresAt: string | null;
  createdAt: string;
}

/** A contract the tenant occupies or occupied (filled by ST-10). */
export interface TenantContractRef {
  id: string;
  code: string;
  room: TenantRoomRef;
  status: string;
  fromDate: string;
  toDate: string | null;
}

/** `GET /api/tenants/:id`. */
export interface StayTenantDetail extends StayTenant {
  email: string | null;
  /** `YYYY-MM-DD`. */
  idIssuedAt: string | null;
  birthDate: string | null;
  gender: TenantGender | null;
  hometown: string | null;
  permanentAddress: string | null;
  occupation: string | null;
  note: string | null;
  vehicles: TenantVehicle[];
  documents: TenantDocument[];
  contracts: TenantContractRef[];
  /** Last time the tenant portal link was opened (ST-25); `null` before that feature. */
  portalLastOpenedAt: string | null;
}

/** `POST /api/tenants/:id/reveal-id`: the full CCCD (each call is audited). */
export interface TenantIdReveal {
  idNumber: string | null;
}

/**
 * `extensions.duplicateTenant` of a 400 when the CCCD (or, on import, phone) is already used.
 * `tenantId` is only given when the caller may open that profile.
 */
export interface DuplicateTenantRef {
  field: 'idNumber' | 'phone';
  tenantId: string | null;
}

/** Import columns in template order; headers match case- and accent-insensitively. */
export const TENANT_IMPORT_COLUMNS = [
  { key: 'fullName', header: 'Họ tên', required: true },
  { key: 'phone', header: 'Số điện thoại', required: true },
  { key: 'email', header: 'Email', required: false },
  { key: 'idNumber', header: 'Số CCCD', required: false },
  { key: 'idIssuedAt', header: 'Ngày cấp', required: false },
  { key: 'birthDate', header: 'Ngày sinh', required: false },
  { key: 'gender', header: 'Giới tính', required: false },
  { key: 'hometown', header: 'Quê quán', required: false },
  { key: 'permanentAddress', header: 'Địa chỉ thường trú', required: false },
  { key: 'occupation', header: 'Nghề nghiệp', required: false },
  { key: 'note', header: 'Ghi chú', required: false },
] as const;
export type TenantImportColumn = (typeof TENANT_IMPORT_COLUMNS)[number]['key'];

export const TENANT_IMPORT_MAX_ROWS = 1000;

/** `valid` rows are created on commit; `error` and `duplicate` rows are skipped. */
export const TENANT_IMPORT_ROW_STATUSES = ['valid', 'error', 'duplicate'] as const;
export type TenantImportRowStatus = (typeof TENANT_IMPORT_ROW_STATUSES)[number];

export interface TenantImportCellError {
  column: TenantImportColumn;
  message: string;
}

/** One data row of the file, as read (`values`) and as it would be saved (`normalized`). */
export interface TenantImportRow {
  /** Line in the file (the header is line 1). */
  line: number;
  status: TenantImportRowStatus;
  values: Partial<Record<TenantImportColumn, string>>;
  errors: TenantImportCellError[];
  /** Set when `status` is `duplicate`. */
  duplicate: DuplicateTenantRef | null;
}

/** `POST /api/tenants/import/preview`: nothing is written. */
export interface TenantImportPreview {
  buildingId: string;
  fileName: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  duplicateCount: number;
  rows: TenantImportRow[];
}

/** One row sent back to `POST /api/tenants/import` (the `values` of a previewed row). */
export interface TenantImportCommitRow {
  line: number;
  values: Partial<Record<TenantImportColumn, string>>;
}

/** `POST /api/tenants/import` body. */
export interface TenantImportCommitInput {
  buildingId: string;
  rows: TenantImportCommitRow[];
}

/** Result of `POST /api/tenants/import`: only valid rows are created; nothing is assigned to rooms. */
export interface TenantImportResult {
  buildingId: string;
  createdCount: number;
  skippedCount: number;
  tenantIds: string[];
  /** Rows not created and why (re-validated at commit time). */
  skipped: { line: number; status: Exclude<TenantImportRowStatus, 'valid'> }[];
  /** `true` when this is the stored answer of an earlier request with the same key. */
  replayed: boolean;
}
