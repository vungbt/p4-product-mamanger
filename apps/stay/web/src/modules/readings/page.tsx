import { Button, Progress, Select } from '@itclabs/react-ui';
import { useBuilding, useReadings } from '@stay/sdk/react';
import {
  defaultReadingPeriod,
  defaultReadOn,
  isPeriod,
  nextPeriod,
  type ReadingGrid,
} from '@stay/shared';
import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FilterBar } from '@/libraries/filter-bar';
import { displayDate, todayIsoDate } from '@/libraries/format';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { PeriodPicker } from '@/libraries/forms/period-picker';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { useAuth } from '@/libraries/session/auth-provider';
import { billingRunPath } from '@/modules/invoices/invoice-ui';
import { ReadingRoomCard } from './room-card';

export default function ReadingsPage() {
  const { buildingId } = useActiveBuilding();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const building = useBuilding(buildingId ?? '');
  const raw = params.get('period');
  const billing = building.data?.billing;
  // Without `?period=` open the consumption month being closed (`next` mode: until its
  // reading day early next month); wait for the building cycle so the grid does not flip.
  const period = isPeriod(raw)
    ? raw
    : billing
      ? defaultReadingPeriod(todayIsoDate(), billing)
      : null;

  if (!period) {
    if (buildingId && building.isError)
      return <LoadError error={building.error} onRetry={() => void building.refetch()} />;
    return buildingId ? <LoadingRows /> : <p>Chọn toà nhà để chốt số.</p>;
  }

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
  const grid: ReadingGrid | undefined = query.data;
  const next = grid?.readingDayMonth === 'next';
  const readOn = grid
    ? defaultReadOn(
        period,
        {
          readingDayMonth: grid.readingDayMonth,
          readingDay: Number(grid.readingOn.slice(8, 10)),
        },
        todayIsoDate(),
      )
    : '';

  return (
    <div className="grid min-w-0 gap-4">
      <ScreenHeader
        title="Chốt số điện nước"
        description={
          grid
            ? `Chỉ số tiêu thụ tháng ${displayPeriod(period)}, chốt ngày ${displayDate(grid.readingOn)} (ngày đọc từ ${displayDate(grid.readOnFrom)} đến ${displayDate(grid.readOnTo)}). Tự động lưu theo phòng.`
            : 'Nhập chỉ số cuối tháng. Tự động lưu theo phòng.'
        }
      />
      {!buildingId ? (
        <p>Chọn toà nhà để chốt số.</p>
      ) : (
        <>
          <FilterBar>
            <PeriodPicker
              label={next ? 'Tháng tiêu thụ' : 'Kỳ chốt số'}
              value={period}
              onChange={(value) => {
                if (isPeriod(value)) filter('period', value);
              }}
            />
            <Select
              label="Tầng"
              aria-label="Lọc tầng"
              placeholder="Tất cả tầng"
              clearable
              value={floor || null}
              options={[...new Set(rooms.map((room) => room.floor))]
                .sort((a, b) => a - b)
                .map((value) => ({ value: String(value), label: `Tầng ${value}` }))}
              onValueChange={(value) => filter('floor', value ?? '')}
            />
          </FilterBar>
          <section
            aria-label="Tiến độ chốt số"
            className="flex min-w-0 flex-col gap-3 rounded-panel border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="grid min-w-0 flex-1 gap-2">
              <p role="status" className="font-semibold text-ink">
                Đã nhập {complete}/{rooms.length} phòng · kỳ {displayPeriod(period)}
              </p>
              <Progress
                value={complete}
                max={Math.max(rooms.length, 1)}
                size="sm"
                tone={rooms.length && complete === rooms.length ? 'success' : 'brand'}
                aria-label="Số phòng đã nhập đủ chỉ số"
                className="sm:max-w-sm"
              />
              {unsynced ? (
                <p role="status" className="text-ui-sm text-warning-700">
                  {unsynced} phòng chưa đồng bộ. Bản nhập được giữ trên máy.
                </p>
              ) : null}
              {canBill && rooms.length && complete < rooms.length ? (
                <p className="text-ui-sm text-muted">
                  Phòng chưa đủ chỉ số sẽ bị loại khỏi kỳ hoá đơn.
                </p>
              ) : null}
            </div>
            {canBill ? (
              <Button className="shrink-0" onClick={() => navigate(billingRunPath(invoicePeriod))}>
                Lập hoá đơn kỳ {displayPeriod(invoicePeriod)}
              </Button>
            ) : null}
          </section>
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
                    readOn={readOn}
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
