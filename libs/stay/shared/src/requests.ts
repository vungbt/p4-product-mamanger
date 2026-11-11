import type { VehicleType } from './tenant.js';

/* -------------------------------------------------------------------------- */
/* Tenant requests, maintenance reports and payment claims (ST-25 part B)      */
/* -------------------------------------------------------------------------- */

/** Báo hỏng (T-08): điện, nước, thiết bị, khác. */
export const MAINTENANCE_CATEGORIES = ['electricity', 'water', 'appliance', 'other'] as const;
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

/** Bình thường / gấp. */
export const MAINTENANCE_SEVERITIES = ['normal', 'urgent'] as const;
export type MaintenanceSeverity = (typeof MAINTENANCE_SEVERITIES)[number];

/**
 * `maintenance_requests.status`: `new` (just reported), `open`/`in_progress` (accepted; ST-22 adds
 * the internal workflow), `done`, `rejected` (with a reason), `cancelled` (by the tenant).
 */
export const MAINTENANCE_STATUSES = [
  'new',
  'open',
  'in_progress',
  'done',
  'rejected',
  'cancelled',
] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

/** Who reported it: the owner/manager (ST-22) or a tenant on the portal (T-08). */
export const MAINTENANCE_SOURCES = ['owner', 'tenant'] as const;
export type MaintenanceSource = (typeof MAINTENANCE_SOURCES)[number];

/** Photos per maintenance report (T-08). */
export const MAINTENANCE_MAX_PHOTOS = 5;

/** T-09 request types. Contract changes only happen when staff accept them. */
export const TENANT_REQUEST_TYPES = [
  'move_out',
  'add_occupant',
  'remove_occupant',
  'add_vehicle',
  'remove_vehicle',
  'other',
] as const;
export type TenantRequestType = (typeof TENANT_REQUEST_TYPES)[number];

/** `tenant_requests.status`; `cancelled` = withdrawn by the tenant while `new`. */
export const TENANT_REQUEST_STATUSES = ['new', 'accepted', 'rejected', 'cancelled'] as const;
export type TenantRequestStatus = (typeof TENANT_REQUEST_STATUSES)[number];

/** `payment_claims.status`; `cancelled` = withdrawn by the tenant while `pending`. */
export const PAYMENT_CLAIM_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled'] as const;
export type PaymentClaimStatus = (typeof PAYMENT_CLAIM_STATUSES)[number];

/** Maintenance reports and requests a contract may send per day (st-25.md). */
export const PORTAL_DAILY_SUBMISSIONS = 10;

/** `move_out`: báo trả phòng. The date must be today or later when staff accept it. */
export interface MoveOutRequestPayload {
  /** `YYYY-MM-DD`. */
  expectedMoveOutDate: string;
  reason?: string | null;
}

/** `add_occupant`: a new person lives in the room from `fromDate`. */
export interface AddOccupantRequestPayload {
  fullName: string;
  /** 10 digits starting with 0. */
  phone: string;
  /** `YYYY-MM-DD`, inside the contract term. */
  fromDate: string;
}

/** `remove_occupant`: an occupant leaves on `toDate` (no longer counted on that day). */
export interface RemoveOccupantRequestPayload {
  /** Name as the tenant wrote it; staff pick the occupant when accepting. */
  fullName: string;
  toDate: string;
}

/** `add_vehicle`: register a vehicle of the requesting occupant from `fromDate`. */
export interface AddVehicleRequestPayload {
  plate: string;
  vehicleType: VehicleType;
  fromDate: string;
}

/** `remove_vehicle`: stop billing a registered vehicle from `toDate`. */
export interface RemoveVehicleRequestPayload {
  plate: string;
  toDate: string;
}

/** `other`: free text. */
export interface OtherRequestPayload {
  message: string;
}

/** Payload of a tenant request, validated per `type` (see each payload). */
export type TenantRequestPayload =
  | MoveOutRequestPayload
  | AddOccupantRequestPayload
  | RemoveOccupantRequestPayload
  | AddVehicleRequestPayload
  | RemoveVehicleRequestPayload
  | OtherRequestPayload;

/* ----------------------------- Portal (tenant) ---------------------------- */

/** `POST /api/portal/invoices/:id/payment-claims` ("Tôi đã chuyển khoản"; `Idempotency-Key`). */
export interface PaymentClaimInput {
  /** Integer VND, 1 … the invoice's remaining amount. */
  amount: number;
  /** `YYYY-MM-DD`, not after today (Asia/Ho_Chi_Minh). */
  paidOn: string;
  /** A completed portal upload with purpose `payment_receipt`. */
  receiptFileId?: string | null;
  /** Transaction code shown by the bank app, if any. */
  reference?: string | null;
  note?: string | null;
}

/** A claim as the tenant sees it (T-05 "Đang chờ xác nhận", or the reject reason). */
export interface PortalPaymentClaim {
  id: string;
  invoiceId: string;
  amount: number;
  paidOn: string;
  status: PaymentClaimStatus;
  rejectReason: string | null;
  /** Sent by the signed-in occupant (only they may cancel it while pending). */
  isOwn: boolean;
  createdAt: string;
  handledAt: string | null;
}

/** `POST /api/portal/maintenance` (T-08). */
export interface PortalMaintenanceInput {
  title: string;
  description: string;
  category: MaintenanceCategory;
  severity: MaintenanceSeverity;
  /** Completed portal uploads with purpose `maintenance_photo` (at most 5). */
  photoFileIds?: string[];
}

/** A private image with a signed URL valid for a few minutes (`url` null without storage). */
export interface RequestPhoto {
  fileId: string;
  url: string | null;
}

/** A maintenance report of the contract (T-08 list). */
export interface PortalMaintenance {
  id: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  severity: MaintenanceSeverity;
  status: MaintenanceStatus;
  /** Latest reply (or reject reason) of the owner/manager. */
  reply: string | null;
  repliedAt: string | null;
  photos: RequestPhoto[];
  isOwn: boolean;
  createdAt: string;
}

/** `POST /api/portal/requests` (T-09). */
export interface TenantRequestInput {
  type: TenantRequestType;
  payload: TenantRequestPayload;
}

/** A request of the signed-in occupant (T-09 list). */
export interface PortalTenantRequest {
  id: string;
  type: TenantRequestType;
  payload: TenantRequestPayload;
  status: TenantRequestStatus;
  reply: string | null;
  createdAt: string;
  handledAt: string | null;
}

/** Open items of the contract on the portal home (T-03). */
export interface PortalOpenRequests {
  /** Maintenance reports not done/rejected/cancelled. */
  maintenance: number;
  /** Own requests still `new`. */
  requests: number;
  /** Payment claims still `pending`. */
  paymentClaims: number;
}

/** `POST /api/portal/uploads` (portal session): purposes a tenant may upload. */
export const PORTAL_UPLOAD_PURPOSES = ['payment_receipt', 'maintenance_photo'] as const;
export type PortalUploadPurpose = (typeof PORTAL_UPLOAD_PURPOSES)[number];

export interface PortalUploadInput {
  purpose: PortalUploadPurpose;
}

/* ------------------------------ Staff inbox ------------------------------ */

/** Kind of an inbox item (O-26). */
export const INBOX_KINDS = ['maintenance', 'tenant_request', 'payment_claim'] as const;
export type InboxKind = (typeof INBOX_KINDS)[number];

/**
 * Inbox status shared by every kind (status chips): `pending` (new/pending), `in_progress`
 * (maintenance accepted), `done` (accepted, confirmed or fixed), `rejected`, `cancelled`.
 */
export const INBOX_STATUSES = ['pending', 'in_progress', 'done', 'rejected', 'cancelled'] as const;
export type InboxStatus = (typeof INBOX_STATUSES)[number];

/** Maintenance part of an inbox item. */
export interface InboxMaintenance {
  title: string;
  description: string;
  category: MaintenanceCategory;
  severity: MaintenanceSeverity;
  status: MaintenanceStatus;
  source: MaintenanceSource;
  photos: RequestPhoto[];
}

/** Tenant request part of an inbox item. */
export interface InboxTenantRequest {
  type: TenantRequestType;
  payload: TenantRequestPayload;
  status: TenantRequestStatus;
  /** What accepting did (ids only), e.g. `{ tenantId }` of the added occupant. */
  result: Record<string, string | number | boolean | null> | null;
}

/** Payment claim part of an inbox item. */
export interface InboxPaymentClaim {
  invoiceId: string;
  invoiceCode: string | null;
  invoicePeriod: string;
  /** Remaining amount of the invoice now. */
  invoiceRemaining: number;
  amount: number;
  paidOn: string;
  reference: string | null;
  note: string | null;
  status: PaymentClaimStatus;
  receipt: RequestPhoto | null;
  /** Payment created when confirmed. */
  paymentId: string | null;
}

/** `GET /api/requests` row (O-26): one maintenance report, tenant request or payment claim. */
export interface InboxItem {
  id: string;
  kind: InboxKind;
  status: InboxStatus;
  buildingId: string;
  contractId: string | null;
  contractCode: string | null;
  roomId: string | null;
  roomCode: string | null;
  /** The occupant who sent it (staff may read the contract's occupants). */
  tenantId: string | null;
  tenantName: string | null;
  /** Reply, reject reason or claim reject reason. */
  reply: string | null;
  handledByName: string | null;
  handledAt: string | null;
  createdAt: string;
  maintenance: InboxMaintenance | null;
  request: InboxTenantRequest | null;
  claim: InboxPaymentClaim | null;
}

/** `meta.counts` of `GET /api/requests`: every status (also 0) for the filter without `status`. */
export interface InboxStatusCount {
  status: InboxStatus;
  count: number;
}

/**
 * `POST /api/requests/:id/accept`. Maintenance: `in_progress`, or `done: true` to close it.
 * Tenant requests run the contract change (ST-12/ST-17) in one transaction; the optional fields
 * override the payload: `effectiveDate`, `tenantId` (occupant leaving, `remove_occupant`),
 * `newPrimaryTenantId` (when the representative leaves), `vehicleId` (`remove_vehicle`).
 */
export interface InboxAcceptInput {
  reply?: string | null;
  done?: boolean;
  effectiveDate?: string | null;
  tenantId?: string | null;
  newPrimaryTenantId?: string | null;
  vehicleId?: string | null;
}

/** `POST /api/requests/:id/reject`, `POST /api/payment-claims/:id/reject`. */
export interface InboxRejectInput {
  reason: string;
}

/** `POST /api/requests/:id/reply`: the tenant sees it on T-08/T-09. */
export interface InboxReplyInput {
  message: string;
}

/** `POST /api/payment-claims/:id/confirm`: defaults are the claim's amount, date and reference. */
export interface PaymentClaimConfirmInput {
  amount?: number | null;
  paidOn?: string | null;
  reference?: string | null;
}

/* ----------------------------- Announcements ----------------------------- */

/** `GET /api/announcements` `status`: still shown, expired (or archived) or both. */
export const ANNOUNCEMENT_STATUSES = ['active', 'expired', 'all'] as const;
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];

/** `POST /api/announcements`; `PUT` adds `version`. */
export interface AnnouncementInput {
  buildingId: string;
  title: string;
  body: string;
  /** `null` or empty = the whole building; else rooms of the building. */
  roomIds?: string[] | null;
  pinned?: boolean;
  /** Last day it is shown (`YYYY-MM-DD`, Asia/Ho_Chi_Minh); `null` = no expiry. */
  expiresOn?: string | null;
}

/** An announcement as staff manage it (O-32). */
export interface StayAnnouncement {
  id: string;
  buildingId: string;
  title: string;
  body: string;
  roomIds: string[] | null;
  /** Codes of the targeted rooms (same order as `roomIds`). */
  roomCodes: string[];
  pinned: boolean;
  expiresAt: string | null;
  expired: boolean;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/** `DELETE /api/announcements/:id`. */
export interface AnnouncementDeleteResult {
  id: string;
  deleted: boolean;
}
