import type {
  ContractStatus,
  InvoiceKind,
  InvoiceStatus,
  MeterKind,
  PaymentMethod,
  ServiceKind,
} from './constants.js';
import type { PublicInvoiceBase } from './invoice.js';
import type { PortalOpenRequests, PortalPaymentClaim } from './requests.js';
import type { VehicleType } from './tenant.js';

/* -------------------------------------------------------------------------- */
/* Tenant portal (ST-25)                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Portal session cookie (HttpOnly, SameSite=Lax, path `/api/portal`, 90 days). Production uses
 * the `__Secure-` prefix. It is never a Better Auth session: staff cookies are not portal
 * sessions and the portal cookie is not accepted by staff routes.
 */
export const PORTAL_SESSION_COOKIE = 'stay_portal_session';
/** Days a verified device keeps its portal session. */
export const PORTAL_SESSION_TTL_DAYS = 90;
/** Wrong "last 4 phone digits" in a row before the link is locked. */
export const PORTAL_MAX_FAILED_ATTEMPTS = 5;
/** Minutes a link stays locked after too many wrong digits. */
export const PORTAL_LOCK_MINUTES = 15;
/** Days an ended contract keeps its portal (to read the settlement). */
export const PORTAL_ENDED_GRACE_DAYS = 30;

/** Path of the portal entry page of the web app for a link token. */
export const portalLinkPath = (token: string) => `/p/${token}`;

/**
 * `active` works; `locked` after too many wrong digits (until `lockedUntil`); `revoked` by staff or
 * replaced by a new link; `expired` when the contract ended more than 30 days ago, was cancelled
 * or the person no longer lives there.
 */
export const PORTAL_LINK_STATUSES = ['active', 'locked', 'revoked', 'expired'] as const;
export type PortalLinkStatus = (typeof PORTAL_LINK_STATUSES)[number];

/** `GET /api/contracts/:id/portal-links` row (staff). Never contains the token or its hash. */
export interface TenantPortalLink {
  id: string;
  contractId: string;
  tenantId: string;
  /** Full name of the occupant (staff may read the contract's occupants). */
  tenantName: string;
  status: PortalLinkStatus;
  /** Last successful verification (4 last phone digits) on a device. */
  lastOpenedAt: string | null;
  lockedUntil: string | null;
  revokedAt: string | null;
  /** Devices currently signed in with this link. */
  activeSessions: number;
  createdByName: string | null;
  createdAt: string;
}

/** `POST /api/contracts/:id/portal-links`. */
export interface TenantPortalLinkInput {
  /** A current occupant of the contract. */
  tenantId: string;
}

/**
 * `POST /api/contracts/:id/portal-links` (201). The token is returned only here: the API stores
 * its SHA-256 hash, so creating a new link for the same occupant revokes the previous one.
 */
export interface TenantPortalLinkCreated {
  link: TenantPortalLink;
  token: string;
  /** `/p/{token}` on the web app. */
  path: string;
  /** Absolute link on the web origin. */
  url: string;
  /** Active link of the same occupant that this one replaced (now revoked). */
  replacedLinkId: string | null;
}

/** `DELETE /api/portal-links/:id` (idempotent). */
export interface TenantPortalLinkRevokeResult {
  link: TenantPortalLink;
  /** `false` when the link was already revoked. */
  revoked: boolean;
  /** Portal sessions (devices) signed out. */
  sessionsRevoked: number;
}

/** `POST /api/portal/links/lookup` (public): the greeting of the entry page (T-02). */
export interface PortalLinkLookupInput {
  token: string;
}

export interface PortalLinkLookup {
  roomCode: string;
  buildingName: string;
  /** This device already has a valid portal session of this link: skip the digits. */
  signedIn: boolean;
}

/** `POST /api/portal/sessions` (public). */
export interface PortalSessionInput {
  token: string;
  /** The last 4 digits of the occupant's own phone number. */
  phoneLast4: string;
}

/** `POST /api/portal/sessions` (201); the session itself is only in the HttpOnly cookie. */
export interface PortalSessionResult {
  expiresAt: string;
}

/** `DELETE /api/portal/sessions`. */
export interface PortalSignOutResult {
  signedOut: boolean;
}

/** An issued invoice of the tenant's contract (never drafts or void invoices). */
export interface PortalInvoiceSummary {
  id: string;
  kind: InvoiceKind;
  period: string;
  code: string;
  status: InvoiceStatus;
  issuedOn: string | null;
  dueOn: string;
  total: number;
  paidTotal: number;
  /** `total − paidTotal`. */
  remaining: number;
  overdue: boolean;
}

/** A recorded (not reversed) payment, without reference, note or who recorded it. */
export interface PortalPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidOn: string;
}

/** `GET /api/portal/invoices/:id`: the public invoice view plus id and payment history. */
export interface PortalInvoice extends PublicInvoiceBase {
  id: string;
  /** Newest first. */
  payments: PortalPayment[];
  /** "Tôi đã chuyển khoản" claims of the invoice, newest first (a pending one blocks a new one). */
  claims: PortalPaymentClaim[];
}

/** An announcement of the building (ST-25 `announcements`, written by staff on O-32). */
export interface PortalNotice {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  expiresAt: string | null;
}

/** `GET /api/portal/me`: data of the home page (T-03). */
export interface PortalMe {
  /** The signed-in occupant's own name. */
  tenantName: string;
  contractCode: string;
  contractStatus: ContractStatus;
  roomCode: string;
  buildingName: string;
  buildingAddress: string | null;
  /** Contact phone of the building (tel:/Zalo links). */
  contactPhone: string | null;
  /** Latest issued invoice (by issue date), `null` when none. */
  currentInvoice: PortalInvoiceSummary | null;
  /** Sum of `remaining` of every unpaid issued invoice. */
  totalDebt: number;
  /** Part of `totalDebt` on invoices other than `currentInvoice`. */
  previousDebt: number;
  unpaidInvoiceCount: number;
  /** Pinned, unexpired announcements for the room. */
  pinnedNotices: PortalNotice[];
  /** Open maintenance reports, own pending requests and pending payment claims. */
  openRequests: PortalOpenRequests;
  sessionExpiresAt: string;
}

/** A service of the contract with the price in force today. */
export interface PortalContractService {
  name: string;
  /** Optional service description (e.g. "Thang máy, máy giặt, rác"). */
  description: string | null;
  kind: ServiceKind;
  unit: string;
  price: number;
}

/** Other occupants appear only by abbreviated name ("N. V. An"). */
export interface PortalOccupant {
  name: string;
  isPrimary: boolean;
  isSelf: boolean;
}

/** Plates of other occupants' vehicles are masked. */
export interface PortalVehicle {
  plate: string;
  type: VehicleType;
  isOwn: boolean;
}

/** `GET /api/portal/contract` (T-06, read-only). */
export interface PortalContract {
  code: string;
  status: ContractStatus;
  roomCode: string;
  buildingName: string;
  startDate: string;
  endDate: string | null;
  noticeDate: string | null;
  movedOutAt: string | null;
  /** Rent in force today. */
  rent: number;
  depositHeld: number;
  /** Day of the month invoices are issued / due (31 = last day). */
  issueDay: number;
  dueDay: number;
  services: PortalContractService[];
  occupants: PortalOccupant[];
  vehicles: PortalVehicle[];
}

/** Metered consumption of one month from the issued invoices (snapshot values). */
export interface PortalUsageReading {
  kind: MeterKind;
  startReading: number | null;
  endReading: number | null;
  consumption: number;
  unit: string | null;
  unitPrice: number | null;
  amount: number;
}

export interface PortalUsagePeriod {
  /** Consumption month `YYYY-MM`. */
  period: string;
  electricity: PortalUsageReading | null;
  water: PortalUsageReading | null;
}

/** `GET /api/portal/usage` (T-07): up to 12 consumption months, oldest first. */
export interface PortalUsage {
  periods: PortalUsagePeriod[];
}

/** `GET /api/portal/notices` (T-10). */
export interface PortalNotices {
  /** Pinned first, then newest. */
  announcements: PortalNotice[];
  buildingName: string;
  rulesText: string | null;
  contactPhone: string | null;
}
