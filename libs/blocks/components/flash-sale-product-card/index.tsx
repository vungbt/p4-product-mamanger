import { cn, Progress, Tag, UiImage } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../helpers';

export type FlashSaleProductCardProps = {
  className?: string;

  sale: number;

  image: {
    url: string;
    /** Omit to fall back to `name`. */
    alt?: string;
  };

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
  image,
  name,
  description,
  originalPrice,
  salePrice,
  sold,
  stock,
  customClasses,
}: FlashSaleProductCardProps) {
  const { t } = useTranslation('blocks');
  const totalQuantity = stock + sold;

  return (
    <div
      className={cn(
        // Intrinsic floor only — actual rendered width comes from whatever layout (grid/flex) the
        // consumer places this in, not a hardcoded width here.
        'rounded-xl min-w-60 border border-line p-3.5 flex flex-col gap-1.25',
        className,
        customClasses?.root,
      )}
    >
      <div className={cn('relative rounded-xl w-full h-48', customClasses?.image)}>
        {sale && sale > 0 ? (
          <span className="absolute p-2">
            <Tag tone="brand">{`${t('flashSaleCard.sale')} ${sale} ${t('flashSaleCard.percent')}`}</Tag>
          </span>
        ) : null}
        {image?.url && (
          <UiImage
            src={image.url}
            alt={image.alt ?? name}
            className="w-full h-full object-cover rounded-xl"
          />
        )}
      </div>
      <div>
        <span className={cn('text-ink font-medium text-control line-clamp-2', customClasses?.name)}>
          {name}
        </span>
        <span className="text-muted text-xs line-clamp-1">{description}</span>
        <div className="flex mt-2 ">
          <div className="flex items-center gap-2">
            <span className={cn('text-danger-700 text-body font-bold', customClasses?.price)}>
              {formatCurrency(salePrice)}
            </span>
            {originalPrice && (
              <span className="line-through text-muted text-xs">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="w-full">
        <Progress
          value={totalQuantity > 0 ? (sold / totalQuantity) * 100 : 0}
          size="sm"
          aria-label={t('flashSaleCard.sold')}
        />
        <div className="mt-2 text-xs text-muted">
          <span>{t('flashSaleCard.sold')}</span>
          <span>
            {sold}/{totalQuantity}
          </span>
        </div>
      </div>
    </div>
  );
}
