import { type IconName, KpiCard, type KpiCardTone, type KpiCardTrend } from '@itclabs/react-ui';
import { periodChange } from '@stay/shared';
import { formatVnd } from '@/libraries/format';

const percent = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 });

/**
 * Change of a money figure against M−1: a percentage, or the amount when M−1 was 0.
 * `upIsGood`: more is good (billed, collected) or bad (overdue).
 */
function moneyTrend(
  value: number,
  previous: number,
  previousLabel: string,
  upIsGood: boolean,
): KpiCardTrend {
  const { delta, ratio } = periodChange(value, previous);
  const label = `so với kỳ ${previousLabel}`;

  if (delta === 0) return { value: 0, children: `Bằng kỳ ${previousLabel}` };
  return {
    value: delta,
    intent: delta > 0 === upIsGood ? 'positive' : 'negative',
    valueFormatter: () =>
      ratio === null ? formatVnd(Math.abs(delta)) : percent.format(Math.abs(ratio)),
    label,
  };
}

type StatCardProps = {
  id: string;
  label: string;
  value: number;
  icon: IconName;
  /** Same figure of M−1; omitted when the card has no comparison. */
  previous?: number;
  /** Whether an increase against M−1 is good news (default) or bad news. */
  upIsGood?: boolean;
  previousLabel?: string;
  note: string;
  href: string;
  tone?: KpiCardTone;
};

/** A money figure of the period that opens its list (screens.md O-01 "Mỗi thẻ bấm được"). */
export function StatCard({
  id,
  label,
  value,
  icon,
  previous,
  upIsGood = true,
  previousLabel,
  note,
  href,
  tone = 'brand',
}: StatCardProps) {
  return (
    <KpiCard
      label={label}
      value={
        <span data-testid={`overview-value-${id}`} data-value={value}>
          {formatVnd(value)}
        </span>
      }
      icon={icon}
      tone={tone}
      density="dashboard"
      trend={
        previous === undefined
          ? undefined
          : moneyTrend(value, previous, previousLabel ?? 'trước', upIsGood)
      }
      hint={note}
      href={href}
      data-testid={`overview-card-${id}`}
    />
  );
}
