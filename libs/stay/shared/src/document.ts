/* -------------------------------------------------------------------------- */
/* Online contracts (ST-30a)                                                   */
/* -------------------------------------------------------------------------- */

/** Kinds of templates/documents. 30a uses `contract`; the others arrive with 30b. */
export const DOCUMENT_KINDS = ['contract', 'addendum', 'handover', 'settlement'] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

/**
 * `draft` → `sent` → `viewed` → `signed_by_tenant` → `completed`; or `draft` → `owner_signed` →
 * `sent` → … → `completed` when the owner signs first. Other ends: `rejected`, `cancelled`,
 * `completed_paper` (signed on paper, scan attached), `superseded` (replaced by a newer completed
 * document) and `expired` (signing links older than 14 days; sending again renews them).
 */
export const DOCUMENT_STATUSES = [
  'draft',
  'owner_signed',
  'sent',
  'viewed',
  'signed_by_tenant',
  'completed',
  'rejected',
  'cancelled',
  'completed_paper',
  'superseded',
  'expired',
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

/** Statuses waiting for tenant signatures (their links work until `expiresAt`). */
export const DOCUMENT_SIGNING_STATUSES = ['sent', 'viewed'] as const satisfies DocumentStatus[];
/** Final statuses: nothing changes any more, except `completed` → `superseded`. */
export const DOCUMENT_FINAL_STATUSES = [
  'completed',
  'completed_paper',
  'superseded',
  'rejected',
  'cancelled',
] as const satisfies DocumentStatus[];

export const SIGNING_ORDERS = ['tenant_first', 'owner_first'] as const;
export type SigningOrder = (typeof SIGNING_ORDERS)[number];

export const SIGNER_ROLES = ['tenant', 'owner'] as const;
export type SignerRole = (typeof SIGNER_ROLES)[number];

export const SIGNER_STATUSES = ['pending', 'viewed', 'signed', 'rejected'] as const;
export type SignerStatus = (typeof SIGNER_STATUSES)[number];

/** `drawn` on screen, `typed` full name, `stored` = the landlord's saved signature. */
export const SIGNATURE_METHODS = ['drawn', 'typed', 'stored'] as const;
export type SignatureMethod = (typeof SIGNATURE_METHODS)[number];

export const DOCUMENT_EVENT_TYPES = [
  'created',
  'edited',
  'sent',
  'viewed',
  'signed',
  'rejected',
  'owner_signed',
  'completed',
  'cancelled',
  'paper',
  'superseded',
  'downloaded',
  'verification_failed',
] as const;
export type DocumentEventType = (typeof DOCUMENT_EVENT_TYPES)[number];

/** Days a signing link stays valid after sending. */
export const DOCUMENT_SIGN_TTL_DAYS = 14;
/** Wrong "last 4 phone digits" on the signing form before the signer is locked. */
export const DOCUMENT_SIGN_MAX_FAILED_ATTEMPTS = 5;
export const DOCUMENT_SIGN_LOCK_MINUTES = 15;
/** Largest signature image (PNG/JPEG data URL, decoded). */
export const SIGNATURE_IMAGE_MAX_BYTES = 200_000;
/** Largest .docx accepted by the template import. */
export const DOCX_IMPORT_MAX_BYTES = 5_242_880;
/** Largest paper scan (PDF/JPG/PNG) and the largest PDF accepted by the public verification. */
export const DOCUMENT_SCAN_MAX_BYTES = 10_485_760;
/** Largest template or document body (HTML characters). */
export const DOCUMENT_BODY_MAX_LENGTH = 400_000;

/** Path of the public integrity check page for a document code. */
export const documentVerifyPath = (code: string) => `/verify/${code}`;
/** Path of the tenant signing page in the portal. */
export const portalDocumentPath = (documentId: string) => `/p/documents/${documentId}`;

/* -------------------------------------------------------------------------- */
/* Template variables                                                          */
/* -------------------------------------------------------------------------- */

export const TEMPLATE_VARIABLE_GROUPS = [
  'document',
  'landlord',
  'tenant',
  'occupants',
  'room',
  'term',
  'money',
  'services',
  'vehicles',
  'billing',
  'payment',
  'rules',
] as const;
export type TemplateVariableGroup = (typeof TEMPLATE_VARIABLE_GROUPS)[number];

export interface TemplateVariable {
  /** Written `{{key}}` in a template. */
  key: string;
  group: TemplateVariableGroup;
  label: string;
  description: string;
  example: string;
  /** A document using it cannot be sent while the value is missing. */
  required: boolean;
  /** `table`: renders an HTML table (place it alone in its paragraph). */
  format: 'text' | 'table' | 'html';
}

const variable = (
  key: string,
  group: TemplateVariableGroup,
  label: string,
  example: string,
  options: { required?: boolean; format?: TemplateVariable['format']; description?: string } = {},
): TemplateVariable => ({
  key,
  group,
  label,
  description: options.description ?? label,
  example,
  required: options.required ?? false,
  format: options.format ?? 'text',
});

/** Variables of contract templates (st-30.md "Biến trong mẫu"); 30b adds addendum/handover. */
export const TEMPLATE_VARIABLES: readonly TemplateVariable[] = [
  variable('van_ban.ma', 'document', 'Mã văn bản', 'VB-7K3M9QX2', {
    description: 'Mã in ở chân trang PDF, dùng để kiểm tra văn bản.',
  }),
  variable('van_ban.ngay_lap', 'document', 'Ngày lập', 'ngày 12 tháng 11 năm 2026'),
  variable('van_ban.noi_lap', 'document', 'Nơi lập', '12 Nguyễn Trãi, Q.1, TP.HCM', {
    description: 'Địa chỉ toà nhà.',
  }),
  variable('ben_cho_thue.ho_ten', 'landlord', 'Họ tên bên cho thuê', 'Nguyễn Văn Chủ', {
    required: true,
  }),
  variable('ben_cho_thue.ngay_sinh', 'landlord', 'Ngày sinh bên cho thuê', '01/01/1975'),
  variable('ben_cho_thue.cccd', 'landlord', 'CCCD bên cho thuê', '079075000123', {
    required: true,
  }),
  variable('ben_cho_thue.ngay_cap_cccd', 'landlord', 'Ngày cấp CCCD bên cho thuê', '01/01/2021'),
  variable('ben_cho_thue.thuong_tru', 'landlord', 'Thường trú bên cho thuê', 'Q.1, TP.HCM'),
  variable('ben_cho_thue.sdt', 'landlord', 'SĐT bên cho thuê', '0901234567', { required: true }),
  variable('ben_thue.ho_ten', 'tenant', 'Họ tên bên thuê', 'Trần Thị Thuê', { required: true }),
  variable('ben_thue.ngay_sinh', 'tenant', 'Ngày sinh bên thuê', '02/02/1998'),
  variable('ben_thue.cccd', 'tenant', 'CCCD bên thuê', '079198000456', { required: true }),
  variable('ben_thue.ngay_cap_cccd', 'tenant', 'Ngày cấp CCCD bên thuê', '15/03/2022'),
  variable('ben_thue.thuong_tru', 'tenant', 'Thường trú bên thuê', 'Huế'),
  variable('ben_thue.sdt', 'tenant', 'SĐT bên thuê', '0912345678', { required: true }),
  variable('ben_thue.nghe_nghiep', 'tenant', 'Nghề nghiệp bên thuê', 'Nhân viên văn phòng'),
  variable('nguoi_o.danh_sach', 'occupants', 'Danh sách người ở', '(bảng)', {
    format: 'table',
    description: 'Bảng: họ tên, ngày sinh, CCCD, quan hệ (người ở cùng, ngoài người đại diện).',
  }),
  variable('toa.ten', 'room', 'Tên toà', 'Nhà trọ An Bình'),
  variable('toa.dia_chi', 'room', 'Địa chỉ toà', '12 Nguyễn Trãi, Q.1, TP.HCM', {
    required: true,
  }),
  variable('phong.ma', 'room', 'Mã phòng', 'P101', { required: true }),
  variable('phong.tang', 'room', 'Tầng', '1'),
  variable('phong.dien_tich', 'room', 'Diện tích (m²)', '20'),
  variable('phong.so_nguoi_toi_da', 'room', 'Số người tối đa', '3'),
  variable('hop_dong.ngay_bat_dau', 'term', 'Ngày bắt đầu', '01/12/2026', { required: true }),
  variable('hop_dong.ngay_ket_thuc', 'term', 'Ngày kết thúc', '30/11/2027'),
  variable('hop_dong.thoi_han_thang', 'term', 'Thời hạn (tháng)', '12'),
  variable('hop_dong.gia_thue', 'money', 'Giá thuê', '3.500.000', { required: true }),
  variable(
    'hop_dong.gia_thue_bang_chu',
    'money',
    'Giá thuê bằng chữ',
    'Ba triệu năm trăm nghìn đồng',
  ),
  variable('hop_dong.tien_coc', 'money', 'Tiền cọc', '3.500.000'),
  variable(
    'hop_dong.tien_coc_bang_chu',
    'money',
    'Tiền cọc bằng chữ',
    'Ba triệu năm trăm nghìn đồng',
  ),
  variable('dich_vu.bang', 'services', 'Bảng dịch vụ', '(bảng)', {
    format: 'table',
    description: 'Bảng: dịch vụ, cách tính, đơn giá tại ngày bắt đầu.',
  }),
  variable('xe.danh_sach', 'vehicles', 'Danh sách xe', 'Xe máy 59A1-12345', {
    description: 'Biển số và loại xe đăng ký trong hợp đồng.',
  }),
  variable('ky_thu.ngay_phat_hanh', 'billing', 'Ngày phát hành hoá đơn', 'ngày 1 hằng tháng'),
  variable('ky_thu.han_thanh_toan', 'billing', 'Hạn thanh toán', 'ngày 5 hằng tháng'),
  variable(
    'ky_thu.cach_tinh',
    'billing',
    'Cách tính kỳ thu',
    'tiền phòng tháng M + dịch vụ tháng M + điện nước tháng M−1',
  ),
  variable('thanh_toan.ngan_hang', 'payment', 'Ngân hàng', 'Vietcombank'),
  variable('thanh_toan.so_tai_khoan', 'payment', 'Số tài khoản', '0123456789'),
  variable('thanh_toan.chu_tai_khoan', 'payment', 'Chủ tài khoản', 'NGUYEN VAN CHU'),
  variable('noi_quy', 'rules', 'Nội quy', '(nội quy của toà)', {
    format: 'html',
    description: 'Nội quy của toà, mỗi dòng một đoạn.',
  }),
];

const VARIABLE_KEYS = new Set(TEMPLATE_VARIABLES.map((item) => item.key));

/** `{{ key }}` placeholders; keys are lower-case snake words joined by dots. */
const PLACEHOLDER = /\{\{\s*([a-z_]+(?:\.[a-z_]+)*)\s*\}\}/g;

export function isTemplateVariable(key: string): boolean {
  return VARIABLE_KEYS.has(key);
}

/** Distinct placeholder keys of a template body, in order of first use (known or not). */
export function templatePlaceholders(html: string): string[] {
  return [...new Set([...html.matchAll(PLACEHOLDER)].map((match) => match[1] ?? ''))];
}

/** Placeholders of `html` that are not template variables (shown in red in the editor). */
export function unknownTemplateVariables(html: string): string[] {
  return templatePlaceholders(html).filter((key) => !isTemplateVariable(key));
}

/**
 * Replaces every `{{key}}` with `values[key]` (already HTML: escaped text or a table); unknown
 * keys are left untouched so the editor can flag them.
 */
export function fillTemplate(html: string, values: Readonly<Record<string, string>>): string {
  return html.replace(PLACEHOLDER, (whole, key: string) => values[key] ?? whole);
}

/** Escapes text for HTML element content and attribute values. */
export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Name comparison of the signing form: case-insensitive, extra spaces ignored, Unicode NFC
 * (accents must match: "Nguyễn" ≠ "Nguyen").
 */
export function normalizePersonName(name: string): string {
  return name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

/** Required variables marked missing in a filled body (`data-missing="key"`). */
export function missingDocumentFields(html: string): string[] {
  return [
    ...new Set([...html.matchAll(/data-missing="([a-z_.]+)"/g)].map((match) => match[1] ?? '')),
  ];
}

/* -------------------------------------------------------------------------- */
/* DTOs                                                                         */
/* -------------------------------------------------------------------------- */

/** `GET/PUT /api/settings/landlord` (O-35): the owner filling the "Bên cho thuê" block. */
export interface LandlordProfile {
  fullName: string;
  birthDate: string | null;
  idNumber: string | null;
  idIssuedAt: string | null;
  idIssuedBy: string | null;
  permanentAddress: string | null;
  phone: string | null;
  /** Saved signature as a PNG/JPEG data URL; `null` until drawn or uploaded. */
  signatureImage: string | null;
  signatureUpdatedAt: string | null;
  /** 0 before the first save. */
  version: number;
}

export interface ContractTemplateVersion {
  id: string;
  version: number;
  note: string | null;
  createdByName: string | null;
  createdAt: string;
  variablesUsed: string[];
}

/** `GET /api/contract-templates` row (O-36). */
export interface ContractTemplateSummary {
  id: string;
  /** `null`: usable in every building. */
  buildingId: string | null;
  buildingName: string | null;
  kind: DocumentKind;
  name: string;
  active: boolean;
  activeVersion: number;
  updatedAt: string;
  /** Documents created from any version (a used template is disabled, never deleted). */
  documentCount: number;
  version: number;
}

/** `GET /api/contract-templates/:id`: the active body and the version history. */
export interface ContractTemplateDetail extends ContractTemplateSummary {
  activeVersionId: string;
  bodyHtml: string;
  versions: ContractTemplateVersion[];
}

/** `GET /api/contract-template-versions/:id`: one stored version (to view or restore). */
export interface ContractTemplateVersionDetail extends ContractTemplateVersion {
  templateId: string;
  bodyHtml: string;
}

/** `POST /api/contract-templates/:id/preview`. */
export interface TemplatePreview {
  html: string;
  /** Required variables without data (the `data-missing` marks of `html`). */
  missing: string[];
  /** Placeholders that are not variables. */
  unknown: string[];
}

/** `POST /api/contract-templates/import-docx`: the Word file as sanitized editor HTML. */
export interface DocxImportResult {
  bodyHtml: string;
  /** Blanks (`……`, `....`, `___`, `[Họ tên]`) highlighted to replace with variables. */
  blanks: number;
  /** Content the editor cannot keep (images, unsupported styles), from the converter. */
  warnings: string[];
}

export interface DocumentSigner {
  id: string;
  role: SignerRole;
  tenantId: string | null;
  userId: string | null;
  name: string;
  required: boolean;
  status: SignerStatus;
  expiresAt: string | null;
  lockedUntil: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  method: SignatureMethod | null;
  rejectReason: string | null;
}

export interface DocumentEvent {
  id: string;
  type: DocumentEventType;
  signerId: string | null;
  actorName: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

/** `GET /api/contracts/:id/documents` row. */
export interface ContractDocumentSummary {
  id: string;
  contractId: string;
  buildingId: string;
  kind: DocumentKind;
  code: string;
  title: string;
  status: DocumentStatus;
  signingOrder: SigningOrder;
  editedManually: boolean;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/** `GET /api/documents/:id` (O-38). */
export interface ContractDocumentDetail extends ContractDocumentSummary {
  templateId: string | null;
  templateName: string | null;
  templateVersion: number | null;
  bodyHtml: string;
  /** Required variables still marked missing in the body (sending is blocked). */
  missing: string[];
  dataSha256: string | null;
  pdfSha256: string | null;
  hasPdf: boolean;
  hasPaperScan: boolean;
  cancelReason: string | null;
  supersedesId: string | null;
  supersededById: string | null;
  /** Occupants that may be added as optional signers when sending. */
  occupants: { tenantId: string; name: string; primary: boolean }[];
  signers: DocumentSigner[];
  events: DocumentEvent[];
  /** Whether the current user is the landlord of the document (may sign it). */
  canOwnerSign: boolean;
}

/** `GET /api/portal/documents` row (T-13). */
export interface PortalDocumentSummary {
  id: string;
  kind: DocumentKind;
  code: string;
  title: string;
  status: DocumentStatus;
  /** Status of the signature of the portal occupant; `null` when not a signer. */
  myStatus: SignerStatus | null;
  /** Waiting for my signature now (shown first, badge on the home page). */
  awaitingMe: boolean;
  sentAt: string | null;
  completedAt: string | null;
}

/** `GET /api/portal/documents/:id` (T-12). Only signers read the body (CCCD inside). */
export interface PortalDocument extends PortalDocumentSummary {
  bodyHtml: string | null;
  myName: string | null;
  expiresAt: string | null;
  lockedUntil: string | null;
  hasPdf: boolean;
  signers: { name: string; role: SignerRole; status: SignerStatus; signedAt: string | null }[];
}

/** `GET /api/public/documents/verify/:code` (P-01): never the content, names or CCCD. */
export interface DocumentVerification {
  code: string;
  kind: DocumentKind;
  buildingName: string;
  status: DocumentStatus;
  signedCount: number;
  signerCount: number;
  completedAt: string | null;
  /** SHA-256 of the final PDF, when completed online. */
  pdfSha256: string | null;
}

/** `POST /api/public/documents/verify/:code` with a PDF file. */
export interface DocumentFileCheck {
  code: string;
  matches: boolean;
  sha256: string;
}
