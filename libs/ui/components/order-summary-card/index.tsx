import { useTranslation } from 'react-i18next';
import { cn } from '../../helpers';
import { Button } from '../button';

export type OrderSummaryCardProps = {
  className?: string;
  subtotal: string;
  discount?: string;
  shipping: string;
  total: string;
  ctaLabel: string;
  onSubmit: () => void;
};

export function OrderSummaryCard({
  className,
  subtotal,
  discount,
  shipping,
  total,
  ctaLabel,
  onSubmit,
}: OrderSummaryCardProps) {
  const { t } = useTranslation();
  return (
    <div className={cn(' min-w-80 h-full p-2 px-3 py-2.5 gap-3 bg-neutral-white', className)}>
      <div>
        <div className="font-extrabold text-15 mb-4">{t('orderSummaryCard.label')}</div>
        <div className="flex flex-col text-13.5 gap-3 text-neutral-text-secondary">
          <div className="flex justify-between">
            <span>{t('orderSummaryCard.provisional calculation')}</span>
            <span className="font-bold text-neutral-text-primary">{subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('orderSummaryCard.discount')}</span>
            <span className="font-bold text-success">
              {t('flashSaleCard.sale')}
              {discount}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t('orderSummaryCard.transport')}</span>
            <span className="font-bold text-neutral-text-primary">{shipping}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="bg-neutral-divider h-px my-4"></div>
        <div className="flex justify-between items-center">
          <span className="text-13.5 font-bold">{t('mobileStickyActionBar.title')}</span>
          <span className="text-24 font-extrabold text-primary tracking-[-0.02em]">{total}</span>
        </div>
        <Button className="w-full h-12 mt-4.5" onClick={onSubmit}>
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
