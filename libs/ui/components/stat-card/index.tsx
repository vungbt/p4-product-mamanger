import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
export type StatCardProps = {
  className?: string;
  Revenue: {
    name?: string;
    private: number;
    growth: number;
    type?: string;
  };
  Order: {
    name?: string;
    private: number;
    growth: number;
    type?: string;
  };
  Traffic: {
    type?: string;
    private: number;
    growth: number;
  };
};
export function StatCard({ className, Revenue, Order, Traffic }: StatCardProps) {
  const { t } = useTranslation('ui');
  return (
    <div className={cn('p-4 flex w-full h-44 gap-5', className)}>
      <div className="flex flex-col gap-1 border border-neutral-disable rounded-2xl w-1/3 h-full p-5">
        <span className="text-neutral-text-secondary font-medium text-lg">
          {t('stat-card.revenue')}
        </span>
        <span className="text-primary text-32 font-bold">{formatCurrency(Revenue.private)}</span>
        <span className="text-neutral-text-secondary font-medium text-lg">
          {Revenue.growth > 0 ? (
            <>
              <span className="text-success">
                {t('stat-card.sum')} {Revenue.growth} {t('stat-card.percent')}
              </span>
              <span className="font-medium text-lg">{t('stat-card.type-revenue')}</span>
            </>
          ) : (
            <>
              <span className="text-error">
                {Revenue.growth} {t('stat-card.percent')}
              </span>
              <span className="font-medium text-lg">{Revenue.type}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex flex-col gap-1 border border-neutral-disable rounded-2xl w-1/3 h-full p-5">
        <span className="text-neutral-text-secondary font-medium text-lg">
          {t('stat-card.order')}
        </span>
        <span className="text-neutral-black text-32 font-bold">{Order.private}</span>
        <span className="text-neutral-text-secondary font-medium text-lg">
          {Order.growth > 0 ? (
            <>
              <span className="mr-1">{Order.growth}</span>
              <span className="font-medium text-lg">{t('stat-card.type-order')}</span>
            </>
          ) : (
            <>
              <span>{null}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex flex-col gap-1 border border-neutral-disable rounded-2xl w-1/3 h-full p-5">
        <span className="text-neutral-text-secondary font-medium text-lg">
          {t('stat-card.traffic')}
        </span>
        <span className="text-pending text-32 font-bold">{Traffic.private}</span>
        <span className="text-neutral-text-secondary font-medium text-lg">
          {Traffic.growth > 0 ? (
            <>
              <span>
                {t('stat-card.type-traffic')} {Traffic.growth}
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
