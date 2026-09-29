import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';

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
  default: 'text-neutral-black',
  primary: 'text-primary',
  pending: 'text-pending',
};

function getTrendClass(trend: number): string {
  if (trend > 0) return 'text-success';
  if (trend < 0) return 'text-error';
  return 'text-neutral-text-secondary';
}

export function StatCard({ className, label, value, tone = 'default', trend, sub }: StatCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'flex flex-col border border-neutral-disable rounded-2xl border-solid h-full p-6',
        className,
      )}
    >
      <span className="text-ui-body text-neutral-text-secondary">{label}</span>

      <span className={cn('text-ui-stat leading-48', TONE_CLASSES[tone])}>
        {tone === 'primary' ? formatCurrency(Number(value)) : value}
      </span>

      <span className="text-neutral-text-secondary text-ui-caption leading-5 mt-auto">
        {tone === 'primary' && trend !== undefined && (
          <>
            <span className={getTrendClass(trend)}>
              {trend > 0 ? t('statCard.sum') : t('statCard.sale')} {Math.abs(trend)}
              {t('statCard.percent')}
            </span>
            <span className="font-medium text-12 ml-1">{sub}</span>
          </>
        )}

        {tone === 'default' && Number(trend) >= 0 && (
          <>
            <span className="mr-1">{trend}</span>
            <span className="font-medium text-12">{sub}</span>
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
