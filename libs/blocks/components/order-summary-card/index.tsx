import { Button, cn } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../helpers';

export type OrderSummaryItem = {
  label: string;
  value: number;
  highlight?: boolean;
};

export type OrderSummaryCardProps = {
  className?: string;
  items: OrderSummaryItem[];
  ctaLabel?: string;
  onSubmit: () => void;
};

export function OrderSummaryCard({ className, items, ctaLabel, onSubmit }: OrderSummaryCardProps) {
  const { t } = useTranslation('blocks');

  const total = items.reduce((acc, item) => item?.value + acc, 0);

  return (
    <div className={cn(' min-w-80 h-full p-2 px-3 py-2.5 gap-3 bg-surface', className)}>
      <div>
        <div className="font-extrabold text-body mb-4">{t('orderSummaryCard.label')}</div>
        <div className="flex flex-col text-control gap-3 text-muted">
          {items.map((item) => (
            <div key={item.label} className="flex justify-between">
              <span>{item.label}</span>
              <span className={cn('font-bold', item.highlight ? 'text-success-700' : 'text-ink')}>
                {formatCurrency(item?.value || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        <div className="bg-line h-px my-4"></div>
        <div className="flex justify-between items-center">
          <span className="text-control font-bold">{t('orderSummaryCard.title')}</span>
          <span className="text-heading font-extrabold text-accent tracking-[-0.02em]">
            {formatCurrency(total)}
          </span>
        </div>
        {onSubmit && (
          <Button className="w-full h-12 mt-4.5" onClick={onSubmit}>
            {ctaLabel || t('orderSummaryCard.checkout')}
          </Button>
        )}
      </div>
    </div>
  );
}
