import { EmptyState } from '@itclabs/react-ui';
import { usePortalContract } from '@stay/sdk/react';
import type { ContractStatus, VehicleType } from '@stay/shared';
import type { ReactNode } from 'react';
import { displayDate, formatVnd } from '@/libraries/format';
import { PortalQuery, PortalSection } from './portal-ui';

const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Nháp',
  active: 'Đang hiệu lực',
  ending: 'Đã báo trả phòng',
  ended: 'Đã kết thúc',
  cancelled: 'Đã huỷ',
};

const VEHICLE_LABELS: Record<VehicleType, string> = {
  motorbike: 'Xe máy',
  electric_bike: 'Xe điện',
  bicycle: 'Xe đạp',
  car: 'Ô tô',
  other: 'Xe khác',
};

const dayLabel = (day: number) => (day === 31 ? 'cuối tháng' : `ngày ${day}`);

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}

/** T-06 `/p/contract` (read-only). Other occupants appear by abbreviated name only. */
export default function PortalContractPage() {
  const contract = usePortalContract();

  return (
    <>
      <h1 className="text-heading font-bold">Hợp đồng của tôi</h1>
      <PortalQuery query={contract}>
        {(data) => (
          <>
            <PortalSection title="Thông tin hợp đồng" testId="portal-contract">
              <dl className="grid gap-2">
                <Row label="Mã hợp đồng">{data.code}</Row>
                <Row label="Trạng thái">{STATUS_LABELS[data.status]}</Row>
                <Row label="Phòng">
                  {data.roomCode} · {data.buildingName}
                </Row>
                <Row label="Thời hạn">
                  {displayDate(data.startDate)} –{' '}
                  {data.endDate ? displayDate(data.endDate) : 'Không xác định'}
                </Row>
                {data.noticeDate ? (
                  <Row label="Dự kiến trả phòng">{displayDate(data.noticeDate)}</Row>
                ) : null}
                {data.movedOutAt ? (
                  <Row label="Đã trả phòng">{displayDate(data.movedOutAt)}</Row>
                ) : null}
                <Row label="Giá thuê">{formatVnd(data.rent)}/tháng</Row>
                <Row label="Tiền cọc đang giữ">{formatVnd(data.depositHeld)}</Row>
                <Row label="Phát hành hoá đơn">{dayLabel(data.issueDay)} hằng tháng</Row>
                <Row label="Hạn thanh toán">{dayLabel(data.dueDay)} hằng tháng</Row>
              </dl>
            </PortalSection>
            <PortalSection title="Dịch vụ">
              {data.services.length === 0 ? (
                <p className="text-muted">Không đăng ký dịch vụ.</p>
              ) : (
                <dl className="grid gap-2">
                  {data.services.map((service) => (
                    <Row
                      key={service.name}
                      label={
                        service.description
                          ? `${service.name} (${service.description})`
                          : service.name
                      }
                    >
                      {formatVnd(service.price)}/{service.unit}
                    </Row>
                  ))}
                </dl>
              )}
            </PortalSection>
            <PortalSection title="Người ở cùng">
              <ul className="grid gap-1">
                {data.occupants.map((occupant, index) => (
                  // Abbreviated names may repeat and carry no id: the API order is stable.
                  <li key={`${occupant.name}-${index}`}>
                    {occupant.name}
                    {occupant.isSelf ? ' (bạn)' : ''}
                    {occupant.isPrimary ? ' · Đại diện' : ''}
                  </li>
                ))}
              </ul>
            </PortalSection>
            <PortalSection title="Xe đăng ký">
              {data.vehicles.length === 0 ? (
                <EmptyState size="compact" appearance="plain" title={<>Không có xe đăng ký.</>} />
              ) : (
                <ul className="grid gap-1">
                  {data.vehicles.map((vehicle, index) => (
                    <li key={`${vehicle.plate}-${index}`}>
                      {VEHICLE_LABELS[vehicle.type]} · {vehicle.plate}
                      {vehicle.isOwn ? ' (của bạn)' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </PortalSection>
          </>
        )}
      </PortalQuery>
    </>
  );
}
