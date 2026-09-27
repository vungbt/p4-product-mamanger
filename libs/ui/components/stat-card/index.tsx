import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';

export type Stat = {
  value: ReactNode;
  trend?: number;
  sub?: ReactNode;
};

export type StatCardProps = {
  className?: string;
  stats: Stat[];
};
export function StatCard({ className, stats }: StatCardProps) {
  const { t } = useTranslation('ui');
  const revenue = stats?.[0];
  const order = stats?.[1];
  const traffic = stats?.[2];
  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      <div className="flex flex-col border border-neutral-disable rounded-2xl border-solid h-full p-6">
        <span className="text-ui-body text-neutral-text-secondary">{t('statCard.revenue')}</span>
        <span className="text-primary text-ui-stat leading-48">
          {formatCurrency(Number(revenue.value))}
        </span>
        <span className="text-neutral-text-secondary  text-ui-caption leading-5">
          {revenue.trend && revenue.trend > 0 ? (
            <>
              <span className="text-success">
                {t('statCard.sum')} {revenue.trend} {t('statCard.percent')}
              </span>
              <span className="font-medium text-12">{t('statCard.type-revenue')}</span>
            </>
          ) : (
            <>
              <span className="text-error">
                {Number(revenue.trend)} {t('statCard.percent')}
              </span>
              <span className="font-medium text-12">{t('statCard.type-revenue')}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex flex-col border border-neutral-disable rounded-2xl border-solid  h-full p-5">
        <span className="text-ui-body text-neutral-text-secondary">{t('statCard.order')}</span>
        <span className="text-neutral-black text-ui-stat leading-48">{order?.value}</span>
        <span className="text-neutral-text-secondary  text-ui-caption leading-5">
          {Number(order?.trend) >= 0 ? (
            <>
              <span className="mr-1">{order.trend}</span>
              <span className="font-medium text-12">{t('statCard.type-order')}</span>
            </>
          ) : (
            <>
              <span>{null}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex flex-col border border-neutral-disable rounded-2xl border-solid  h-full p-5">
        <span className="text-ui-body text-neutral-text-secondary">{t('statCard.traffic')}</span>
        <span className="text-pending text-ui-stat leading-48">{traffic?.value}</span>
        <span className="text-neutral-text-secondary  text-ui-caption leading-5">
          {Number(traffic?.trend) >= 0 ? (
            <>
              <span>
                {t('statCard.type-traffic')} {traffic.trend}
              </span>
            </>
          ) : (
            <>
              <span>{null}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
