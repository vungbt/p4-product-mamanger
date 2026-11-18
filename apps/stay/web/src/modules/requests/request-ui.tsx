import { Tag, type TagTone } from '@itclabs/react-ui';
import type {
  InboxItem,
  InboxKind,
  InboxStatus,
  MaintenanceCategory,
  MaintenanceSeverity,
  TenantRequestPayload,
  TenantRequestType,
  VehicleType,
} from '@stay/shared';
import { displayDate, formatVnd } from '@/libraries/format';

export const KIND_LABELS: Record<InboxKind, string> = {
  maintenance: 'Báo hỏng',
  tenant_request: 'Yêu cầu',
  payment_claim: 'Chuyển khoản',
};

export const INBOX_STATUS_LABELS: Record<InboxStatus, string> = {
  pending: 'Mới',
  in_progress: 'Đang xử lý',
  done: 'Xong',
  rejected: 'Từ chối',
  cancelled: 'Đã huỷ',
};

const STATUS_TONES: Record<InboxStatus, TagTone> = {
  pending: 'info',
  in_progress: 'warning',
  done: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

export const REQUEST_TYPE_LABELS: Record<TenantRequestType, string> = {
  move_out: 'Báo trả phòng',
  add_occupant: 'Thêm người ở',
  remove_occupant: 'Bớt người ở',
  add_vehicle: 'Thêm xe',
  remove_vehicle: 'Bớt xe',
  other: 'Khác',
};

export const CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  electricity: 'Điện',
  water: 'Nước',
  appliance: 'Thiết bị',
  other: 'Khác',
};

export const SEVERITY_LABELS: Record<MaintenanceSeverity, string> = {
  normal: 'Bình thường',
  urgent: 'Gấp',
};

const VEHICLE_TYPES: Record<VehicleType, string> = {
  motorbike: 'Xe máy',
  electric_bike: 'Xe điện',
  bicycle: 'Xe đạp',
  car: 'Ô tô',
  other: 'Xe khác',
};

/** Label of an item: the request type for tenant requests, else the kind. */
export function itemTypeLabel(item: InboxItem): string {
  return item.request ? REQUEST_TYPE_LABELS[item.request.type] : KIND_LABELS[item.kind];
}

export function InboxStatusTag({ status }: { status: InboxStatus }) {
  return (
    <Tag tone={STATUS_TONES[status]} size="sm">
      {INBOX_STATUS_LABELS[status]}
    </Tag>
  );
}

/** `[label, value]` rows of a request payload, whatever its type. */
export function payloadRows(payload: TenantRequestPayload): [string, string][] {
  const rows: [string, string][] = [];

  if ('expectedMoveOutDate' in payload) {
    rows.push(['Ngày dự kiến trả phòng', displayDate(payload.expectedMoveOutDate)]);
    if (payload.reason) rows.push(['Lý do', payload.reason]);
  }
  if ('fullName' in payload) rows.push(['Họ tên', payload.fullName]);
  if ('phone' in payload) rows.push(['Số điện thoại', payload.phone]);
  if ('plate' in payload) rows.push(['Biển số', payload.plate]);
  if ('vehicleType' in payload) rows.push(['Loại xe', VEHICLE_TYPES[payload.vehicleType]]);
  if ('fromDate' in payload) rows.push(['Từ ngày', displayDate(payload.fromDate)]);
  if ('toDate' in payload) rows.push(['Đến ngày', displayDate(payload.toDate)]);
  if ('message' in payload) rows.push(['Nội dung', payload.message]);
  return rows;
}

/** One-line summary for list rows. */
export function itemSummary(item: InboxItem): string {
  if (item.maintenance) return item.maintenance.title;
  if (item.claim) return `${formatVnd(item.claim.amount)} · ${item.claim.invoiceCode ?? 'Hoá đơn'}`;
  if (item.request)
    return payloadRows(item.request.payload)
      .map(([, value]) => value)
      .join(' · ');
  return '';
}

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export const displayDateTime = (iso: string) => dateTime.format(new Date(iso));
