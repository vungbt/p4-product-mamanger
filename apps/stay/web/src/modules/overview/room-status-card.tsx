import { Button, Card, MetricTrend, Skeleton } from '@itclabs/react-ui';
import type { StayOverview } from '@stay/shared';
import { lazy, Suspense } from 'react';

const PeriodChart = lazy(() => import('./period-chart'));

const percent = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 });

const points = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

/** Rooms by status today, the occupancy rate of M and its change in points against M−1. */
export function RoomStatusCard({
  data,
  previousLabel,
}: {
  data: StayOverview;
  previousLabel: string;
}) {
  const { rooms, occupancy, previousOccupancy } = data;
  const rate = occupancy.rate;
  const before = previousOccupancy.rate;
  const change = rate !== null && before !== null ? Math.round((rate - before) * 1000) / 10 : null;

  const slices = [
    { id: 'occupied', label: 'Đang thuê', value: rooms.occupied, color: 'var(--color-brand-700)' },
    { id: 'reserved', label: 'Đã cọc', value: rooms.reserved, color: 'var(--color-info-700)' },
    { id: 'vacant', label: 'Trống', value: rooms.vacant, color: 'var(--color-control-border)' },
    {
      id: 'maintenance',
      label: 'Bảo trì',
      value: rooms.maintenance,
      color: 'var(--color-warning-700)',
    },
  ].filter((slice) => slice.value > 0);

  return (
    <Card
      title="Tình trạng phòng"
      description={
        <>
          Lấp đầy{' '}
          <span data-testid="overview-occupancy">{rate === null ? '—' : percent.format(rate)}</span>
        </>
      }
      action={
        <Button href="/rooms" variant="ghost" size="sm">
          Xem phòng
        </Button>
      }
      className="min-w-0"
      data-testid="overview-card-rooms"
    >
      {slices.length ? (
        <Suspense fallback={<Skeleton className="h-64" />}>
          <PeriodChart
            type="donut"
            label="Số phòng theo trạng thái"
            data={slices}
            height={240}
            valueFormatter={(value) => `${value} phòng`}
          />
        </Suspense>
      ) : (
        <p className="py-6 text-center text-muted">Chưa có phòng trong toà nhà này.</p>
      )}
      <p className="mt-3 text-ui-sm text-muted" data-testid="overview-value-rooms">
        {rooms.vacant} trống · {rooms.occupied} đang thuê · {rooms.reserved} đã cọc ·{' '}
        {rooms.maintenance} bảo trì · {rooms.total} phòng
      </p>
      {change === null ? null : change === 0 ? (
        <p className="mt-1 text-ui-sm text-muted">Bằng kỳ {previousLabel}</p>
      ) : (
        <MetricTrend
          className="mt-1"
          value={change}
          valueFormatter={(value) => `${points.format(value)} điểm %`}
          label={`so với kỳ ${previousLabel}`}
        />
      )}
    </Card>
  );
}
