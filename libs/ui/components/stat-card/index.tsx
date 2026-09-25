import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
export type StatCardProps = {
  className?: string;

  value: ReactNode;

  tone?: StatCardProps;

  trend?: number[];

  sub?: ReactNode;
};
export function StatCard({ className, value, tone, trend, sub }: StatCardProps) {
  const { t } = useTranslation('ui');

  const valueRevenue = Array.isArray(value) ? value[0] : value;
  const valueOrder = Array.isArray(value) ? value[1] : value;
  const valueTraffic = Array.isArray(value) ? value[2] : value;

  const trendRevenue = Array.isArray(trend) ? trend[0] : trend;
  const trendOrder = Array.isArray(trend) ? trend[1] : trend;
  const trendTraffic = Array.isArray(trend) ? trend[2] : trend;

  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      <div className="flex flex-col border border-neutral-disable rounded-2xl border-solid h-full p-6">
        <span className="text-ui-body text-neutral-text-secondary">{t('statCard.revenue')}</span>
        <span className="text-primary text-ui-stat leading-48">{formatCurrency(valueRevenue)}</span>
        <span className="text-neutral-text-secondary  text-ui-caption leading-5">
          {trendRevenue && trendRevenue > 0 ? (
            <>
              <span className="text-success">
                {t('statCard.sum')} {trendRevenue} {t('statCard.percent')}
              </span>
              <span className="font-medium text-12">{t('statCard.type-revenue')}</span>
            </>
          ) : (
            <>
              <span className="text-error">
                {Number(trendRevenue)} {t('statCard.percent')}
              </span>
              <span className="font-medium text-12">{t('statCard.type-revenue')}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex flex-col border border-neutral-disable rounded-2xl border-solid  h-full p-5">
        <span className="text-ui-body text-neutral-text-secondary">{t('statCard.order')}</span>
        <span className="text-neutral-black text-ui-stat leading-48">{valueOrder}</span>
        <span className="text-neutral-text-secondary  text-ui-caption leading-5">
          {Number(trendOrder) >= 0 ? (
            <>
              <span className="mr-1">{trendOrder}</span>
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
        <span className="text-pending text-ui-stat leading-48">{valueTraffic}</span>
        <span className="text-neutral-text-secondary  text-ui-caption leading-5">
          {Number(trendTraffic) > 0 ? (
            <>
              <span>
                {t('statCard.type-traffic')} {trendTraffic}
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
