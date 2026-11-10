import { Button, Input, Select } from '@itclabs/react-ui';
import { useReadings } from '@stay/sdk/react';
import { isPeriod, nextPeriod } from '@stay/shared';
import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { todayIsoDate } from '@/libraries/format';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { useAuth } from '@/libraries/session/auth-provider';
import { billingRunPath } from '@/modules/invoices/invoice-ui';
import { ReadingRoomCard } from './room-card';

export default function ReadingsPage() {
  const { buildingId } = useActiveBuilding();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const raw = params.get('period');
  const period = isPeriod(raw) ? raw : todayIsoDate().slice(0, 7);

  return (
    <BuildingReadings
      key={`${user?.id}:${buildingId}:${period}`}
      buildingId={buildingId ?? ''}
      accountId={user?.id ?? ''}
      period={period}
      floor={params.get('floor') ?? ''}
      filter={(field, value) =>
        setParams(() => {
          const next = latestSearchParams();
          if (value) next.set(field, value);
          else next.delete(field);
          return next;
        })
      }
    />
  );
}

function BuildingReadings({
  buildingId,
  accountId,
  period,
  floor,
  filter,
}: {
  buildingId: string;
  accountId: string;
  period: string;
  floor: string;
  filter: (field: string, value: string) => void;
}) {
  const query = useReadings(buildingId, period);
  const navigate = useNavigate();
  const canBill = useCanOn('create', 'Invoice', { buildingId });
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const onPending = useCallback(
    (id: string, value: boolean) =>
      setPending((previous) => (previous[id] === value ? previous : { ...previous, [id]: value })),
    [],
  );
  const rooms = query.data?.rooms ?? [];
  const complete = rooms.filter(
    (room) =>
      room.meters.length === 2 &&
      room.meters.every((meter) => meter.current) &&
      !pending[room.roomId],
  ).length;
  const unsynced = Object.values(pending).filter(Boolean).length;
  const invoicePeriod = nextPeriod(period);
  const displayPeriod = (value: string) => `${value.slice(5)}/${value.slice(0, 4)}`;

  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader
        title="Chốt số điện nước"
        description="Nhập chỉ số cuối tháng. Tự động lưu theo phòng."
      />
      {!buildingId ? (
        <p>Chọn toà nhà để chốt số.</p>
      ) : (
        <>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <Input
              label="Kỳ chốt số"
              aria-label="Kỳ chốt số"
              type="month"
              value={period}
              onChange={(event) => {
                if (isPeriod(event.target.value)) filter('period', event.target.value);
              }}
            />
            <Select
              aria-label="Lọc tầng"
              placeholder="Tất cả tầng"
              clearable
              value={floor || null}
              options={[...new Set(rooms.map((room) => room.floor))]
                .sort((a, b) => a - b)
                .map((value) => ({ value: String(value), label: `Tầng ${value}` }))}
              onValueChange={(value) => filter('floor', value ?? '')}
            />
          </div>
          <p role="status">
            đã nhập {complete}/{rooms.length} phòng · kỳ {displayPeriod(period)}
          </p>
          {unsynced ? (
            <p role="status">{unsynced} phòng chưa đồng bộ. Bản nhập được giữ trên máy.</p>
          ) : null}
          {canBill ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => navigate(billingRunPath(invoicePeriod))}>
                Lập hoá đơn kỳ {displayPeriod(invoicePeriod)}
              </Button>
              {rooms.length && complete < rooms.length ? (
                <p className="text-ui-sm text-muted">
                  Phòng chưa đủ chỉ số sẽ bị loại khỏi kỳ hoá đơn.
                </p>
              ) : null}
            </div>
          ) : null}
          {query.isLoading ? (
            <LoadingRows />
          ) : query.isError ? (
            <LoadError error={query.error} onRetry={() => void query.refetch()} />
          ) : !rooms.length ? (
            <p>Chưa có phòng có hợp đồng hiệu lực trong kỳ này.</p>
          ) : (
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              {rooms.map((room) => (
                <div key={room.roomId} hidden={Boolean(floor && floor !== String(room.floor))}>
                  <ReadingRoomCard
                    room={room}
                    buildingId={buildingId}
                    period={period}
                    accountId={accountId}
                    onPending={onPending}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
