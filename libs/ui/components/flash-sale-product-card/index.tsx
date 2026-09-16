import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
export type FlashSaleProductCardProps = {
  className?: string;

  sale: number;

  imageUrl: string;

  name: string;
  description?: string;

  originalPrice: number;
  salePrice: number;

  sold: number;
  stock: number;

  customClasses?: {
    root?: string;
    image?: string;
    name?: string;
    price?: string;
  };
};

export function FlashSaleProductCard({
  className,
  sale,
  imageUrl,
  name,
  description,
  originalPrice,
  salePrice,
  sold,
  stock,
}: FlashSaleProductCardProps) {
  const { t } = useTranslation('ui');
  const totalQuantity = stock + sold;
  const soldPercent = totalQuantity > 0 ? (sold / totalQuantity) * 100 : 0;
  const displayPrice = formatCurrency(salePrice);
  const displayOriginalPrice = originalPrice ? formatCurrency(originalPrice) : null;
  return (
    <div className={cn('rounded-xl w-80 max-h-full border border-neutral-divider p-4', className)}>
      <div className="relative  rounded-xl w-full h-48">
        {sale > 0 && (
          <span className="absolute left-2 top-2 bg-error px-4 py-1 rounded-full text-neutral-white font-bold text-base">
            -{sale}
            {t('flash-Sale-Card.percent')}
          </span>
        )}
        {imageUrl && (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-xl" />
        )}
      </div>
      <div className="mt-2">
        <span className="text-neutral-black font-medium text-md line-clamp-2">{name}</span>
        <span className="text-neutral-text-secondary text-xs line-clamp-1">{description}</span>
        <div className="flex mt-2 ">
          <div className="flex items-center gap-4 ">
            <span className="text-primary text-xl font-bold">{displayPrice}</span>
            {originalPrice && (
              <span className="line-through text-neutral-text-secondary text-base">
                {displayOriginalPrice}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="w-full mt-2">
        <div className="w-full bg-neutral-border rounded-full h-2">
          <div className="bg-primary-base h-2 rounded-full" style={{ width: `${soldPercent}%` }} />
        </div>
        <div className="mt-2 text-sm text-[var(--color-neutral-text-secondary)]">
          <span>{t('flash-Sale-Card.sold')}</span>
          <span>
            {sold}/{totalQuantity}
          </span>
        </div>
      </div>
    </div>
  );
}
