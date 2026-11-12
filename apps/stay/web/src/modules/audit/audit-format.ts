import type { TagTone } from '@itclabs/react-ui';
import type { StayAuditLog } from '@stay/shared';
import { displayDate, formatVnd } from '@/libraries/format';

/** Audit times are shown in the owner's time zone. */
export const AUDIT_TIME_ZONE = 'Asia/Ho_Chi_Minh';

type JsonRecord = Record<string, unknown>;

/** An audit entry as the SDK returns it (`changes` is untyped JSON). */
export type AuditEntry = Omit<StayAuditLog, 'changes'> & { changes: unknown };

/** KPI bucket of an action verb. */
export type ActionGroup = 'create' | 'update' | 'finance' | 'remove' | 'other';

type VerbMeta = { label: string; tone: TagTone; group: ActionGroup };

/** Last segment of `resource.verb` actions (`invoice.issued` → `issued`). */
export function actionVerb(action: string): string {
  return action.includes('.') ? (action.split('.').at(-1) ?? action) : action;
}

const VERBS: Record<string, VerbMeta> = {
  create: { label: 'Tạo', tone: 'success', group: 'create' },
  created: { label: 'Tạo', tone: 'success', group: 'create' },
  draft_created: { label: 'Tạo nháp', tone: 'success', group: 'create' },
  bulk_create: { label: 'Tạo hàng loạt', tone: 'success', group: 'create' },
  session_created: { label: 'Mở phiên', tone: 'neutral', group: 'other' },
  share_created: { label: 'Tạo link', tone: 'brand', group: 'create' },
  import: { label: 'Nhập', tone: 'info', group: 'create' },
  update: { label: 'Sửa', tone: 'info', group: 'update' },
  updated: { label: 'Sửa', tone: 'info', group: 'update' },
  line_added: { label: 'Thêm dòng', tone: 'info', group: 'update' },
  line_removed: { label: 'Xoá dòng', tone: 'warning', group: 'update' },
  maintenance_on: { label: 'Bật bảo trì', tone: 'warning', group: 'update' },
  maintenance_off: { label: 'Tắt bảo trì', tone: 'info', group: 'update' },
  replace: { label: 'Thay', tone: 'info', group: 'update' },
  complete: { label: 'Hoàn tất', tone: 'success', group: 'update' },
  completed: { label: 'Hoàn tất', tone: 'success', group: 'update' },
  issue: { label: 'Phát hành', tone: 'brand', group: 'finance' },
  issued: { label: 'Phát hành', tone: 'brand', group: 'finance' },
  recorded: { label: 'Thu tiền', tone: 'success', group: 'finance' },
  settled: { label: 'Thanh lý', tone: 'warning', group: 'finance' },
  delete: { label: 'Xoá', tone: 'danger', group: 'remove' },
  deleted: { label: 'Xoá', tone: 'danger', group: 'remove' },
  session_deleted: { label: 'Đóng phiên', tone: 'neutral', group: 'other' },
  archived: { label: 'Lưu trữ', tone: 'warning', group: 'remove' },
  reversed: { label: 'Huỷ bút toán', tone: 'danger', group: 'remove' },
  voided: { label: 'Void', tone: 'danger', group: 'remove' },
  void: { label: 'Void', tone: 'danger', group: 'remove' },
  cancelled: { label: 'Huỷ', tone: 'danger', group: 'remove' },
  revoked: { label: 'Thu hồi', tone: 'warning', group: 'remove' },
  login: { label: 'Đăng nhập', tone: 'neutral', group: 'other' },
  mail_requested: { label: 'Gửi email', tone: 'neutral', group: 'other' },
  export: { label: 'Xuất', tone: 'info', group: 'other' },
  reveal_id_number: { label: 'Xem CCCD', tone: 'warning', group: 'other' },
  verification_failed: { label: 'Xác minh lỗi', tone: 'danger', group: 'other' },
  unexpected_error: { label: 'Lỗi', tone: 'danger', group: 'other' },
};

export function verbMeta(action: string): VerbMeta {
  const verb = actionVerb(action);

  return VERBS[verb] ?? { label: verb.replaceAll('_', ' '), tone: 'neutral', group: 'other' };
}

/** Vietnamese noun of a resource type, lower case to sit inside a sentence. */
export const RESOURCE_LABELS: Record<string, string> = {
  building: 'toà',
  room: 'phòng',
  tenant: 'người thuê',
  contract: 'hợp đồng',
  invoice: 'hoá đơn',
  payment: 'khoản thu',
  service: 'dịch vụ',
  meter_reading: 'chỉ số',
  meter: 'đồng hồ',
  user: 'tài khoản',
  settings: 'cài đặt',
  expense: 'chi phí',
  expense_category: 'danh mục chi phí',
  deposit: 'bút toán cọc',
  maintenance_request: 'báo hỏng',
  tenant_request: 'yêu cầu',
  payment_claim: 'báo chuyển khoản',
  tenant_portal_link: 'link cổng người thuê',
  tenant_portal: 'cổng người thuê',
  announcement: 'thông báo',
  residents: 'danh sách tạm trú',
  automation: 'tự động hoá',
  upload: 'tệp',
};

export function resourceLabel(type: string): string {
  return RESOURCE_LABELS[type] ?? type.replaceAll('_', ' ');
}

/** Option label of an action code: "Phát hành hoá đơn". */
export function actionLabel(action: string, resourceType: string): string {
  return `${verbMeta(action).label} ${resourceLabel(resourceType)}`;
}

const RECORD_ROUTES: Record<string, (id: string) => string> = {
  building: (id) => `/buildings/${id}/edit`,
  room: (id) => `/rooms/${id}`,
  tenant: (id) => `/tenants/${id}`,
  contract: (id) => `/contracts/${id}`,
  invoice: (id) => `/invoices/${id}`,
  service: () => '/settings/services',
  settings: () => '/settings/billing',
  expense: () => '/expenses',
  maintenance_request: () => '/requests',
  tenant_request: () => '/requests',
  payment_claim: () => '/requests',
  announcement: () => '/announcements',
};

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value && value !== '[REDACTED]' ? value : null;
}

function periodLabel(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)
    ? `${value.slice(5)}/${value.slice(0, 4)}`
    : null;
}

/** Field of the change payload, from its `after` / `before` snapshot or the flat payload. */
function field(changes: JsonRecord | null, key: string): unknown {
  return asRecord(changes?.after)?.[key] ?? changes?.[key] ?? asRecord(changes?.before)?.[key];
}

export type AuditTarget = {
  /** Visible name of the record ("A-202611-001", "Phí chung"); the id when nothing better. */
  name: string;
  /** In-app link to the record, when the screen exists. */
  href: string | null;
  /** Short context after the name ("Kỳ 11/2026 · 5.107.000 ₫"). */
  context: string | null;
};

/** The record an entry is about, described for people rather than by id. */
export function auditTarget(entry: AuditEntry): AuditTarget {
  const changes = asRecord(entry.changes);
  const route = RECORD_ROUTES[entry.resourceType];
  const period = periodLabel(field(changes, 'period'));
  const amount = field(changes, 'amount') ?? field(changes, 'total');
  const money = typeof amount === 'number' ? formatVnd(amount) : null;
  const context = (parts: (string | null)[]) => parts.filter(Boolean).join(' · ') || null;

  if (entry.resourceType === 'payment') {
    const invoiceId = text(field(changes, 'invoiceId'));

    return {
      name: money ?? entry.resourceId,
      href: invoiceId ? `/invoices/${invoiceId}` : null,
      context: context([
        text(field(changes, 'paidOn')) ? displayDate(String(field(changes, 'paidOn'))) : null,
      ]),
    };
  }
  if (entry.resourceType === 'invoice') {
    const code = text(field(changes, 'code'));

    return {
      name: code ?? (period ? `nháp kỳ ${period}` : entry.resourceId),
      href: route ? route(entry.resourceId) : null,
      context: context([code && period ? `Kỳ ${period}` : null, money]),
    };
  }
  if (entry.resourceType === 'meter_reading') {
    const reading = field(changes, 'reading');

    return {
      name: period ? `kỳ ${period}` : entry.resourceId,
      href: null,
      context: typeof reading === 'number' ? `Chỉ số ${reading.toLocaleString('vi-VN')}` : null,
    };
  }
  if (entry.resourceType === 'user' || entry.resourceType === 'settings')
    return { name: '', href: route ? route(entry.resourceId) : null, context: null };

  const name =
    text(field(changes, 'name')) ??
    text(field(changes, 'code')) ??
    text(field(changes, 'fullName')) ??
    text(field(changes, 'title'));

  return {
    name: name ?? entry.resourceId,
    href: route ? route(entry.resourceId) : null,
    context: context([period ? `Kỳ ${period}` : null, money]),
  };
}

/** Bookkeeping keys that are not business changes. */
const META_KEYS = new Set(['source', 'correlationId', 'version', 'updatedAt', 'createdAt', 'id']);

const isMetaKey = (key: string) => META_KEYS.has(key) || (key.endsWith('Id') && key !== 'id');

export type FieldChange = { key: string; before?: unknown; after: unknown };

/**
 * Changed fields: `before`/`after` snapshots give a diff; other payloads list their business
 * fields (ids and request metadata are left to the raw JSON).
 */
export function fieldChanges(changes: unknown): FieldChange[] {
  const record = asRecord(changes);

  if (!record) return [];
  const before = asRecord(record.before);
  const after = asRecord(record.after);

  if (before || after) {
    const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);

    return [...keys]
      .filter((key) => !isMetaKey(key))
      .filter((key) => JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]))
      .map((key) => ({ key, before: before?.[key] ?? null, after: after?.[key] ?? null }));
  }
  return Object.entries(record)
    .filter(([key]) => !isMetaKey(key))
    .map(([key, value]) => ({ key, after: value }));
}

const FIELD_LABELS: Record<string, string> = {
  action: 'Thao tác',
  active: 'Đang bật',
  address: 'Địa chỉ',
  amount: 'Số tiền',
  bankAccount: 'Số tài khoản',
  bankAccountName: 'Chủ tài khoản',
  bankBin: 'Ngân hàng',
  code: 'Mã',
  confirmed: 'Đã xác nhận',
  contactPhone: 'SĐT liên hệ',
  defaultPrice: 'Đơn giá mặc định',
  dueDay: 'Hạn thanh toán',
  dueOn: 'Hạn',
  expiresAt: 'Hết hạn',
  issueDay: 'Ngày phát hành',
  kind: 'Loại',
  method: 'Phương thức',
  name: 'Tên',
  paidOn: 'Ngày thu',
  paidTotalAfter: 'Đã thu sau',
  paidTotalBefore: 'Đã thu trước',
  password: 'Mật khẩu',
  period: 'Kỳ',
  price: 'Đơn giá',
  reading: 'Chỉ số',
  readingDay: 'Ngày chốt số',
  reason: 'Lý do',
  refundUnusedRent: 'Hoàn tiền phòng',
  replacedActiveLink: 'Thay link đang dùng',
  roundingUnit: 'Làm tròn',
  rulesText: 'Nội quy',
  sortOrder: 'Thứ tự',
  status: 'Trạng thái',
  statusAfter: 'Trạng thái sau',
  statusBefore: 'Trạng thái trước',
  total: 'Tổng',
  unit: 'Đơn vị',
};

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

const MONEY_KEY = /amount|total|price|deposit|remaining|subtotal|rent/i;

/** A change value as people read it: money, dates, yes/no, "—" for empty. */
export function formatFieldValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (typeof value === 'number') {
    if (MONEY_KEY.test(key)) return formatVnd(value);
    return value.toLocaleString('vi-VN');
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return displayDate(value);
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
    if (key === 'period' || key.endsWith('Period')) return periodLabel(value) ?? value;
    return value;
  }
  return JSON.stringify(value);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: AUDIT_TIME_ZONE,
  }).format(new Date(iso));
}

/** `YYYY-MM-DD` of an instant in the audit time zone. */
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: AUDIT_TIME_ZONE }).format(date);
}

/** "Hôm nay", "Hôm qua" or the date. */
export function dayLabel(key: string, now = new Date()): string {
  if (key === dayKey(now)) return 'Hôm nay';
  if (key === dayKey(new Date(now.getTime() - 86_400_000))) return 'Hôm qua';
  return displayDate(key);
}

/** "vừa xong", "5 phút trước", "3 giờ trước", else the time of day (the group gives the date). */
export function relativeTime(iso: string, now = new Date()): string {
  const seconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  const format = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

  if (seconds < 60) return 'vừa xong';
  if (seconds < 3600) return format.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 6 * 3600) return format.format(-Math.floor(seconds / 3600), 'hour');
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: AUDIT_TIME_ZONE,
  }).format(new Date(iso));
}

/** Request metadata kept in the payload. */
export function requestMeta(changes: unknown): {
  correlationId: string | null;
  source: string | null;
} {
  const record = asRecord(changes);

  return {
    correlationId: text(record?.correlationId),
    source: text(record?.source),
  };
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  return (
    words.length > 1 ? `${words[0]?.[0]}${words.at(-1)?.[0]}` : (words[0]?.slice(0, 2) ?? '?')
  ).toUpperCase();
}
