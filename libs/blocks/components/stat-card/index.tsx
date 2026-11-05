import { cn } from '@itclabs/react-ui';
import type { ReactNode } from 'react';
import { formatCurrency } from '../../helpers';

export type StatCardTone = 'default' | 'primary' | 'pending';

export type StatCardProps = {
  className?: string;
  label: string;
  value: ReactNode;
  tone?: StatCardTone;
  trend?: number;
  sub?: ReactNode;
};

const TONE_CLASSES: Record<StatCardTone, string> = {
  default: 'text-ink',
  primary: 'text-accent',
  pending: 'text-warning-700',
};

function getTrendClass(trend: number): string {
  if (trend > 0) return 'text-success-700';
  if (trend < 0) return 'text-danger-700';
  return 'text-muted';
}

export function StatCard({ className, label, value, tone = 'default', trend, sub }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col border border-muted rounded-2xl border-solid h-full p-6',
        className,
      )}
    >
      <span className="text-control text-muted">{label}</span>

      <span className={cn('text-title leading-tight', TONE_CLASSES[tone])}>
        {tone === 'primary' ? formatCurrency(Number(value)) : value}
      </span>

      <span className="text-muted text-xs leading-5 mt-auto">
        {tone === 'primary' && trend !== undefined && (
          <>
            <span className={getTrendClass(trend)}>
              {trend > 0 ? '+' : trend < 0 ? '−' : ''}
              {Math.abs(trend)}
              {'%'}
            </span>
            <span className="font-medium text-xs ml-1">{sub}</span>
          </>
        )}

        {tone === 'default' && Number(trend) >= 0 && (
          <>
            <span className="mr-1">{trend}</span>
            <span className="font-medium text-xs">{sub}</span>
          </>
        )}

        {tone === 'pending' && Number(trend) >= 0 && (
          <span>
            {sub} {trend}
          </span>
        )}
      </span>
    </div>
  );
}
