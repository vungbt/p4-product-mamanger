import type {
  MaintenanceCategory,
  MaintenanceSeverity,
  MaintenanceStatus,
  PaymentClaimStatus,
  TenantRequestPayload,
  TenantRequestStatus,
  TenantRequestType,
  VehicleType,
} from '@stay/shared';
import { displayDate } from '@/libraries/format';

export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  electricity: 'Điện',
  water: 'Nước',
  appliance: 'Thiết bị',
  other: 'Khác',
};

export const MAINTENANCE_SEVERITY_LABELS: Record<MaintenanceSeverity, string> = {
  normal: 'Bình thường',
  urgent: 'Gấp',
};

/** Status as the tenant reads it (T-08). */
export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  new: 'Đã gửi',
  open: 'Đang xử lý',
  in_progress: 'Đang xử lý',
  done: 'Đã xong',
  rejected: 'Từ chối',
  cancelled: 'Đã huỷ',
};

export const REQUEST_TYPE_LABELS: Record<TenantRequestType, string> = {
  move_out: 'Báo trả phòng',
  add_occupant: 'Thêm người ở',
  remove_occupant: 'Bớt người ở',
  add_vehicle: 'Thêm xe',
  remove_vehicle: 'Bớt xe',
  other: 'Khác',
};

export const REQUEST_STATUS_LABELS: Record<TenantRequestStatus, string> = {
  new: 'Chờ chủ trọ duyệt',
  accepted: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã huỷ',
};

export const CLAIM_STATUS_LABELS: Record<PaymentClaimStatus, string> = {
  pending: 'Đang chờ xác nhận',
  confirmed: 'Đã xác nhận',
  rejected: 'Bị từ chối',
  cancelled: 'Đã huỷ',
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  motorbike: 'Xe máy',
  electric_bike: 'Xe điện',
  bicycle: 'Xe đạp',
  car: 'Ô tô',
  other: 'Xe khác',
};

export type StatusTone = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

export function statusTone(status: string): StatusTone {
  if (['done', 'accepted', 'confirmed'].includes(status)) return 'success';
  if (['rejected'].includes(status)) return 'danger';
  if (['cancelled'].includes(status)) return 'neutral';
  if (['open', 'in_progress'].includes(status)) return 'warning';
  return 'info';
}

/** One line describing a request payload ("Từ 01/05/2042: Trần Thị Bình · 0912…"). */
export function requestSummary(payload: TenantRequestPayload): string {
  if ('expectedMoveOutDate' in payload)
    return `Dự kiến trả phòng ${displayDate(payload.expectedMoveOutDate)}${payload.reason ? ` · ${payload.reason}` : ''}`;
  if ('phone' in payload)
    return `${payload.fullName} · ${payload.phone} · từ ${displayDate(payload.fromDate)}`;
  if ('vehicleType' in payload)
    return `${VEHICLE_TYPE_LABELS[payload.vehicleType]} ${payload.plate} · từ ${displayDate(payload.fromDate)}`;
  if ('plate' in payload) return `Xe ${payload.plate} · từ ${displayDate(payload.toDate)}`;
  if ('toDate' in payload) return `${payload.fullName} · rời đi ${displayDate(payload.toDate)}`;
  return payload.message;
}
