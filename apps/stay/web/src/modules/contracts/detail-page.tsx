import { Alert, AlertDialog, Button, DropdownMenu, EmptyState, Skeleton } from '@itclabs/react-ui';
import { useCancelContract, useCancelNotice, useContract } from '@stay/sdk/react';
import type { ContractChangeKind } from '@stay/sdk/shared';
import { ApiSdkError, getErrorMessage } from '@stay/sdk/shared';
import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCanAccess, useCanOn } from '@/libraries/ability';
import { displayDate, formatVnd } from '@/libraries/format';
import { DepositLedger } from '@/modules/deposits/ledger';
import { ContractInvoices } from '@/modules/invoices/contract-invoices';
import { ContractRequests } from '@/modules/requests/contract-requests';
import { useRoomBuilding } from '@/modules/rooms/use-room-building';
import { CHANGE_LABELS, ContractChangeDialog } from './change-dialog';
import { CONTRACT_LABELS, LoadError } from './contract-ui';
import { NoticeDialog } from './notice-dialog';
import { PortalLinksPanel } from './portal-links';

const TABS = ['Tổng quan', 'Hoá đơn', 'Cọc', 'Yêu cầu', 'Cổng người thuê', 'Lịch sử'];
const EVENT_LABELS: Record<string, string> = {
  ...CHANGE_LABELS,
  created: 'Tạo bản nháp',
  updated: 'Cập nhật bản nháp',
  activated: 'Kích hoạt',
  cancelled: 'Huỷ bản nháp',
  notice: 'Báo trả phòng',
  notice_cancelled: 'Huỷ báo trả phòng',
  ended: 'Thanh lý',
};

type MenuAction = ContractChangeKind | 'notice' | 'cancel-notice' | 'settle';

export default function ContractDetailPage() {
  const { id = '' } = useParams();
  const query = useContract(id);
  const cancel = useCancelContract();
  const cancelNotice = useCancelNotice();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [change, setChange] = useState<ContractChangeKind | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [confirmCancelNotice, setConfirmCancelNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const data = query.data;
  const canUpdate = useCanOn('update', 'Contract', { buildingId: data?.buildingId });
  const canSettle = useCanAccess('settle', 'Contract');
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
            items={[
              ...(Object.entries(CHANGE_LABELS) as [ContractChangeKind, string][]).map(
                ([value, label]) => ({ id: value, label, onSelect: () => setChange(value) }),
              ),
              {
                id: 'notice' satisfies MenuAction,
                label: data.status === 'ending' ? 'Đổi ngày trả phòng' : 'Báo trả phòng',
                onSelect: () => setNoticeOpen(true),
              },
              ...(data.status === 'ending'
                ? [
                    {
                      id: 'cancel-notice' satisfies MenuAction,
                      label: 'Huỷ báo trả phòng',
                      onSelect: () => setConfirmCancelNotice(true),
                    },
                  ]
                : []),
              ...(canSettle
                ? [
                    {
                      id: 'settle' satisfies MenuAction,
                      label: 'Thanh lý',
                      onSelect: () => navigate(`/contracts/${data.id}/settle`),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </header>
      {error && (
        <p role="alert" className="text-danger-700">
          {error}
        </p>
      )}
      {data.status === 'ending' && data.noticeDate ? (
        <Alert tone="warning" data-testid="contract-notice">
          Đã báo trả phòng, dự kiến trả ngày {displayDate(data.noticeDate)}.
          {canSettle ? (
            <>
              {' '}
              <Link className="font-semibold text-accent" to={`/contracts/${data.id}/settle`}>
                Thanh lý
              </Link>
            </>
          ) : null}
        </Alert>
      ) : null}
      {data.status === 'ended' ? (
        <Alert tone="info" data-testid="contract-ended">
          Đã kết thúc
          {data.movedOutAt ? `, trả phòng ngày ${displayDate(data.movedOutAt)}` : ''}.
          {data.settlementInvoiceId ? (
            <>
              {' '}
              <Link
                className="font-semibold text-accent"
                to={`/invoices/${data.settlementInvoiceId}`}
              >
                Xem hoá đơn thanh lý
              </Link>
            </>
          ) : null}
        </Alert>
      ) : null}
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
        ) : tab === 'Yêu cầu' ? (
          <ContractRequests contractId={data.id} />
        ) : tab === 'Cổng người thuê' ? (
          <PortalLinksPanel contract={data} />
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
                  {typeof e.payload.expectedMoveOutDate === 'string' && (
                    <> · Dự kiến trả {displayDate(e.payload.expectedMoveOutDate)}</>
                  )}
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
      {noticeOpen && (
        <NoticeDialog
          contract={data}
          onClose={() => setNoticeOpen(false)}
          onReload={() => void query.refetch()}
        />
      )}
      <AlertDialog
        open={confirmCancelNotice}
        onOpenChange={setConfirmCancelNotice}
        title="Huỷ báo trả phòng?"
        description="Hợp đồng trở lại trạng thái hiệu lực."
        confirmLabel="Huỷ báo trả"
        cancelLabel="Quay lại"
        onConfirm={async () => {
          setError(null);
          try {
            await cancelNotice.mutateAsync({ id: data.id, version: data.version });
          } catch (e) {
            setError(getErrorMessage(e, 'Không thể huỷ báo trả phòng.'));
          }
        }}
      />
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
