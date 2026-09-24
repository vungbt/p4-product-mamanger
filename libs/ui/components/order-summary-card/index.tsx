import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
import { Button } from '../button';

export type OrderSummaryItem = {
  label: string;
  value?: number;
  highlight?: boolean;
};

export type OrderSummaryCardProps = {
  className?: string;
  items: OrderSummaryItem[];
  ctaLabel?: string;
  onSubmit: () => void;
};

export function OrderSummaryCard({ className, items, ctaLabel, onSubmit }: OrderSummaryCardProps) {
  const { t } = useTranslation();

  const total = items.reduce((acc, item) => {
    const value = item.value || 0;
    return item.highlight ? acc - value : acc + value;
  }, 0);

  return (
    <div className={cn(' min-w-80 h-full p-2 px-3 py-2.5 gap-3 bg-neutral-white', className)}>
      <div>
        <div className="font-extrabold text-15 mb-4">{t('orderSummaryCard.label')}</div>
        <div className="flex flex-col text-13.5 gap-3 text-neutral-text-secondary">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>{item.label}</span>
              <span
                className={cn(
                  'font-bold',
                  item.highlight ? 'text-success' : 'text-neutral-text-primary',
                )}
              >
                {item.highlight && t('orderSummaryCard.sale')}
                {formatCurrency(item?.value || 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        <div className="bg-neutral-divider h-px my-4"></div>
        <div className="flex justify-between items-center">
          <span className="text-13.5 font-bold">{t('orderSummaryCard.title')}</span>
          <span className="text-24 font-extrabold text-primary tracking-[-0.02em]">
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
