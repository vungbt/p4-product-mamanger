import { cn } from '@itclabs/react-ui';
import { periodChange, type StayOverview } from '@stay/shared';
import { Link } from 'react-router-dom';
import { formatVnd } from '@/libraries/format';

const percent = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 });

type Tone = 'warning' | 'danger';

const TONES: Record<Tone, string> = {
  warning: 'text-warning-700',
  danger: 'text-danger-700',
};

/** "▲ 12,5% so với kỳ 10/2026"; money compares amounts, rates compare percentage points. */
function ChangeNote({ text, delta }: { text: string; delta: number }) {
  return (
    <span
      className={cn(
        'text-ui-sm',
        delta > 0 ? 'text-success-700' : delta < 0 ? 'text-danger-700' : 'text-muted',
      )}
    >
      <span aria-hidden>{delta > 0 ? '▲ ' : delta < 0 ? '▼ ' : ''}</span>
      {text}
    </span>
  );
}

function moneyChange(value: number, previous: number, previousLabel: string) {
  const { delta, ratio } = periodChange(value, previous);

  if (delta === 0) return { delta, text: `Bằng kỳ ${previousLabel}` };
  const direction = delta > 0 ? 'Tăng' : 'Giảm';
  const amount = ratio === null ? formatVnd(Math.abs(delta)) : percent.format(Math.abs(ratio));

  return { delta, text: `${direction} ${amount} so với kỳ ${previousLabel}` };
}

type StatCardProps = {
  id: string;
  label: string;
  value: number;
  /** Same figure of M−1; omitted when the card has no comparison. */
  previous?: number;
  previousLabel?: string;
  note: string;
  href: string;
  tone?: Tone;
};

/** A figure of the period that opens its list (screens.md O-01 "Mỗi thẻ bấm được"). */
export function StatCard({
  id,
  label,
  value,
  previous,
  previousLabel,
  note,
  href,
  tone,
}: StatCardProps) {
  const change =
    previous === undefined ? null : moneyChange(value, previous, previousLabel ?? 'trước');

  return (
    <li className="min-w-0">
      <Link
        to={href}
        className="grid h-full min-w-0 gap-1 rounded-panel border border-line bg-surface p-4 transition-colors hover:bg-hover"
        data-testid={`overview-card-${id}`}
      >
        <span className="text-ui-sm text-muted">{label}</span>
        <span
          className={cn('text-section font-bold break-all text-ink', tone && TONES[tone])}
          data-testid={`overview-value-${id}`}
          data-value={value}
        >
          {formatVnd(value)}
        </span>
        {change ? <ChangeNote text={change.text} delta={change.delta} /> : null}
        <span className="text-ui-sm text-muted">{note}</span>
      </Link>
    </li>
  );
}

/** Rooms by status today and the occupancy rate of M against M−1. */
export function OccupancyCard({
  data,
  previousLabel,
}: {
  data: StayOverview;
  previousLabel: string;
}) {
  const { rooms, occupancy, previousOccupancy } = data;
  const rate = occupancy.rate;
  const before = previousOccupancy.rate;
  const points = rate !== null && before !== null ? Math.round((rate - before) * 1000) / 10 : null;

  return (
    <li className="min-w-0">
      <Link
        to="/rooms"
        className="grid h-full min-w-0 gap-1 rounded-panel border border-line bg-surface p-4 transition-colors hover:bg-hover"
        data-testid="overview-card-rooms"
      >
        <span className="text-ui-sm text-muted">Phòng trống / đang thuê</span>
        <span className="text-section font-bold text-ink" data-testid="overview-value-rooms">
          {rooms.vacant} trống · {rooms.occupied} đang thuê
        </span>
        <span className="text-ui-sm text-muted">
          {rooms.reserved} đã cọc · {rooms.maintenance} bảo trì · {rooms.total} phòng
        </span>
        <span className="text-ui-sm text-ink" data-testid="overview-occupancy">
          Tỷ lệ lấp đầy: {rate === null ? '—' : percent.format(rate)}
        </span>
        {points === null ? null : (
          <ChangeNote
            delta={points}
            text={
              points === 0
                ? `Bằng kỳ ${previousLabel}`
                : `${points > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(points).toLocaleString('vi-VN')} điểm % so với kỳ ${previousLabel}`
            }
          />
        )}
      </Link>
    </li>
  );
}
