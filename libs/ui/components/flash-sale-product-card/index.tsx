import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
import { ProgressBar } from '../progress-bar';
import { Tag } from '../tag';

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

  return (
    <div
      className={cn(
        'rounded-xl w-60 border border-neutral-border p-[14px] flex flex-col gap-[5px]',
        className,
      )}
    >
      <div className="relative  rounded-xl w-full h-48">
        {sale && sale > 0 ? (
          <span className="absolute p-2">
            <Tag
              type="sold"
              content={`${t('flashSaleCard.sale')} ${sale} ${t('flashSaleCard.percent')}`}
            />
          </span>
        ) : null}
        {imageUrl && (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-xl" />
        )}
      </div>
      <div>
        <span className="text-neutral-black font-medium text-[13.5px] line-clamp-2">{name}</span>
        <span className="text-neutral-text-secondary text-12 line-clamp-1">{description}</span>
        <div className="flex mt-2 ">
          <div className="flex items-center gap-2">
            <span className="text-error text-16 font-bold">{formatCurrency(salePrice)}</span>
            {originalPrice && (
              <span className="line-through text-neutral-text-secondary text-12">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="w-full">
        <ProgressBar sold={sold} total={totalQuantity} />
        <div className="mt-2 text-[11px] text-neutral-text-secondary">
          <span>{t('flashSaleCard.sold')}</span>
          <span>
            {sold}/{totalQuantity}
          </span>
        </div>
      </div>
    </div>
  );
}
