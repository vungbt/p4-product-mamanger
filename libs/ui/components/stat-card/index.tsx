import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
export type StatCardProps = {
  className?: string;

  Revenue: {
    private: number;
    growth: number;
  };

  Order: {
    private: number;
    growth: number;
  };
  Traffic: {
    private: number;
    growth: number;
  };
};
export function StatCard({ className, Revenue, Order, Traffic }: StatCardProps) {
  const { t } = useTranslation('ui');
  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      <div className="flex flex-col border border-neutral-disable rounded-2xl border-solid h-full p-6">
        <span className="text-ui-body text-neutral-text-secondary">{t('statCard.revenue')}</span>
        <span className="text-primary text-ui-stat leading-48">
          {formatCurrency(Revenue.private)}
        </span>
        <span className="text-neutral-text-secondary  text-ui-caption leading-5">
          {Revenue.growth > 0 ? (
            <>
              <span className="text-success">
                {t('statCard.sum')} {Revenue.growth} {t('statCard.percent')}
              </span>
              <span className="font-medium text-12">{t('statCard.type-revenue')}</span>
            </>
          ) : (
            <>
              <span className="text-error">
                {Revenue.growth} {t('statCard.percent')}
              </span>
              <span className="font-medium text-12">{t('statCard.type-revenue')}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex flex-col border border-neutral-disable rounded-2xl border-solid  h-full p-5">
        <span className="text-ui-body text-neutral-text-secondary">{t('statCard.order')}</span>
        <span className="text-neutral-black text-ui-stat leading-48">{Order.private}</span>
        <span className="text-neutral-text-secondary  text-ui-caption leading-5">
          {Order.growth >= 0 ? (
            <>
              <span className="mr-1">{Order.growth}</span>
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
        <span className="text-pending text-ui-stat leading-48">{Traffic.private}</span>
        <span className="text-neutral-text-secondary  text-ui-caption leading-5">
          {Traffic.growth > 0 ? (
            <>
              <span>
                {t('statCard.type-traffic')} {Traffic.growth}
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
