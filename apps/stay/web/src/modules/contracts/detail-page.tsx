import { AlertDialog, Button, DropdownMenu, EmptyState, Skeleton } from '@itclabs/react-ui';
import { useCancelContract, useContract } from '@stay/sdk/react';
import type { ContractChangeKind } from '@stay/sdk/shared';
import { ApiSdkError, getErrorMessage } from '@stay/sdk/shared';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { displayDate, formatVnd } from '@/libraries/format';
import { DepositLedger } from '@/modules/deposits/ledger';
import { ContractInvoices } from '@/modules/invoices/contract-invoices';
import { useRoomBuilding } from '@/modules/rooms/use-room-building';
import { CHANGE_LABELS, ContractChangeDialog } from './change-dialog';
import { CONTRACT_LABELS, LoadError } from './contract-ui';

const TABS = ['Tổng quan', 'Hoá đơn', 'Cọc', 'Yêu cầu', 'Lịch sử'];
const EVENT_LABELS: Record<string, string> = {
  ...CHANGE_LABELS,
  created: 'Tạo bản nháp',
  updated: 'Cập nhật bản nháp',
  activated: 'Kích hoạt',
  cancelled: 'Huỷ bản nháp',
};

export default function ContractDetailPage() {
  const { id = '' } = useParams();
  const query = useContract(id);
  const cancel = useCancelContract();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [change, setChange] = useState<ContractChangeKind | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const data = query.data;
  const canUpdate = useCanOn('update', 'Contract', { buildingId: data?.buildingId });
  const tab = TABS.includes(params.get('tab') ?? '') ? params.get('tab') : 'Tổng quan';

  useRoomBuilding(data?.buildingId);

  if (query.isPending) return <Skeleton className="h-64" />;
  if (!data)
    return query.error instanceof ApiSdkError && query.error.status === 404 ? (
      <EmptyState title="Không tìm thấy hợp đồng" />
    ) : (
      <LoadError error={query.error} retry={() => void query.refetch()} />
    );

  return (
    <div className="grid min-w-0 gap-5">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-heading font-bold">{data.code}</h1>
          <p>
            {CONTRACT_LABELS[data.status]} · Phòng {data.roomCode}
          </p>
        </div>
        {data.status === 'draft' && canUpdate && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate(`/contracts/new?draftId=${data.id}`)}>
              Tiếp tục bản nháp
            </Button>
            <Button variant="danger" onClick={() => setConfirm(true)}>
              Huỷ bản nháp
            </Button>
          </div>
        )}
        {canUpdate && ['active', 'ending'].includes(data.status) && (
          <DropdownMenu
            trigger={<Button variant="secondary">Thay đổi</Button>}
            triggerAsChild
            items={(Object.entries(CHANGE_LABELS) as [ContractChangeKind, string][]).map(
              ([value, label]) => ({ id: value, label, onSelect: () => setChange(value) }),
            )}
          />
        )}
      </header>
      {error && (
        <p role="alert" className="text-danger-700">
          {error}
        </p>
      )}
      <div role="tablist" aria-label="Chi tiết hợp đồng" className="flex flex-wrap gap-2">
        {TABS.map((label) => (
          <Button
            role="tab"
            aria-selected={tab === label}
            key={label}
            variant={tab === label ? 'primary' : 'secondary'}
            onClick={() => setParams({ tab: label }, { replace: true })}
          >
            {label}
          </Button>
        ))}
      </div>
      <section
        role="tabpanel"
        aria-label={tab ?? 'Tổng quan'}
        className="grid gap-4 rounded-panel border border-line bg-surface p-4 sm:p-5"
      >
        {tab === 'Tổng quan' ? (
          <>
            <h2 className="text-section font-semibold">Thông tin hợp đồng</h2>
            <Link to={`/rooms/${data.roomId}`} className="text-accent">
              Phòng {data.roomCode}
            </Link>
            <p>
              {displayDate(data.startDate)} –{' '}
              {data.endDate ? displayDate(data.endDate) : 'Không xác định'}
            </p>
            <p>
              Giá thuê: {formatVnd(data.rent)} · Cọc đang giữ: {formatVnd(data.depositHeld)}
            </p>
            <h3 className="font-semibold">Người ở</h3>
            <ul className="grid gap-2">
              {data.occupants.map((o) => (
                <li key={`${o.tenantId}-${o.fromDate}`}>
                  <Link className="text-accent" to={`/tenants/${o.tenantId}`}>
                    {o.fullName}
                  </Link>
                  {o.isPrimary ? ' · Đại diện' : ''} · {displayDate(o.fromDate)} –{' '}
                  {o.toDate ? displayDate(o.toDate) : 'Hiện tại'}
                </li>
              ))}
            </ul>
            <h3 className="font-semibold">Dịch vụ</h3>
            <ul>
              {data.services.map((s) => (
                <li key={`${s.serviceId}-${s.fromDate}`}>
                  {s.name} · {displayDate(s.fromDate)} –{' '}
                  {s.toDate ? displayDate(s.toDate) : 'Hiện tại'}
                </li>
              ))}
            </ul>
            <h3 className="font-semibold">Xe</h3>
            <ul>
              {data.vehicles.map((v) => (
                <li key={`${v.vehicleId}-${v.fromDate}`}>
                  {v.plate} · {displayDate(v.fromDate)}
                </li>
              ))}
            </ul>
            <p>
              Điện nhận phòng: {data.initialElectric} · Nước nhận phòng: {data.initialWater}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.initialElectricPhotoUrl && (
                <img
                  src={data.initialElectricPhotoUrl}
                  alt="Đồng hồ điện lúc nhận phòng"
                  className="max-w-full rounded-control"
                />
              )}
              {data.initialWaterPhotoUrl && (
                <img
                  src={data.initialWaterPhotoUrl}
                  alt="Đồng hồ nước lúc nhận phòng"
                  className="max-w-full rounded-control"
                />
              )}
            </div>
            {data.note && <p className="whitespace-pre-wrap">{data.note}</p>}
          </>
        ) : tab === 'Hoá đơn' ? (
          <ContractInvoices contract={data} />
        ) : tab === 'Cọc' ? (
          <DepositLedger contractId={data.id} buildingId={data.buildingId} status={data.status} />
        ) : tab === 'Lịch sử' ? (
          <>
            <h2 className="text-section font-semibold">Lịch sử</h2>
            <ol className="grid gap-3">
              {data.events.map((e) => (
                <li key={e.id}>
                  {EVENT_LABELS[e.type] ?? e.type} · {e.actorName} ·{' '}
                  {new Intl.DateTimeFormat('vi-VN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                    timeZone: 'Asia/Ho_Chi_Minh',
                  }).format(new Date(e.createdAt))}
                  {typeof e.payload.effectiveDate === 'string' && (
                    <> · Hiệu lực {displayDate(e.payload.effectiveDate)}</>
                  )}
                  {typeof e.payload.rent === 'number' && <> · {formatVnd(e.payload.rent)}</>}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <>
            <h2 className="text-section font-semibold">{tab}</h2>
            <p className="text-muted">Sắp có</p>
          </>
        )}
      </section>
      <Link to="/contracts" className="font-semibold text-accent">
        Về danh sách hợp đồng
      </Link>
      {change && (
        <ContractChangeDialog contract={data} kind={change} onClose={() => setChange(null)} />
      )}
      <AlertDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Huỷ bản nháp?"
        description="Bản nháp chưa ghi nhận cọc hay hoá đơn."
        confirmLabel="Huỷ bản nháp"
        cancelLabel="Quay lại"
        confirmVariant="danger"
        onConfirm={async () => {
          try {
            await cancel.mutateAsync(id);
          } catch (e) {
            setError(getErrorMessage(e, 'Không thể huỷ bản nháp.'));
          }
        }}
      />
    </div>
  );
}
