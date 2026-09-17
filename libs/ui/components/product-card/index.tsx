import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { RenderIcon } from '../icons';

export type ProductCartProps = {
  type?: 'best-seller' | 'new-arrival' | 'featured';
  className?: string;
  favorited?: boolean;
  onFavorite?: () => void;

  imageUrl?: string;

  category?: string;
  rating?: number;
  sold?: number;

  name: string;
  description?: string;

  price: number;
  stock: number;

  onBuy?: () => void;
};
export function ProductCart({
  type,
  className = '',
  favorited = false,
  onFavorite,
  imageUrl,
  category,
  rating,
  sold,
  name,
  description,
  price,
  stock,
  onBuy,
}: ProductCartProps) {
  const { t } = useTranslation('ui');

  return (
    <div
      className={cn(
        'w-[260px] max-h-full border border-neutral-divider bg-neutral-white rounded-xl p-4',
        className,
      )}
    >
      <div className="relative h-48 mb-2">
        <div className="w-full h-full bg-neutral-divider rounded-xl p-4">
          {imageUrl ? (
            <img className="w-full h-full rounded-xl" src={imageUrl} alt="" />
          ) : (
            <div className="w-full h-full rounded-xl bg-gray-200 flex items-center justify-center">
              <RenderIcon
                name="keyboard"
                style={{ width: 70, height: 70 }}
                strokeWidth={1.5}
                className="text-neutral-disable"
              />
            </div>
          )}
        </div>
        {type && (
          <div className="absolute top-[10px] left-[10px] bg-error-bg text-error-base px-[10px] py-[3px] rounded-full border border-error-border">
            <span className="font-bold text-[11.5px]">
              {type === 'best-seller' && t('productCard.best-seller')}
              {type === 'new-arrival' && t('productCard.new-arrival')}
              {type === 'featured' && t('productCard.featured')}
            </span>
          </div>
        )}
        <div className="flex items-center justify-center w-8 h-8 absolute top-[8px] right-[8px] rounded-full bg-neutral-white">
          <IconButton
            icon="heart"
            style={{ width: 15, height: 15 }}
            iconClassName={favorited ? 'text-primary fill-current' : 'text-neutral-disable'}
            onClick={onFavorite}
          />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-neutral-disable font-bold text-[11px]">{category}</span>
        <div className="flex gap-2 items-center">
          <RenderIcon
            name="star"
            style={{ width: 12, height: 12 }}
            className="text-primary-base fill-current"
          />
          <span className="text-neutral-text-secondary font-bold text-[11.5px] tracking-[0.04em]">
            {rating}
          </span>
          <span className="text-neutral-disable text-[11px]">.{sold}</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-bold line-clamp-2 text-sm">{name}</span>
        <span className="text-neutral-disable line-clamp-2 text-xs">{description}</span>
      </div>
      <div className="justify-between flex items-center mb-2 h-10">
        <span className="text-primary-base font-extrabold text-base">{formatCurrency(price)}</span>
        <span className="bg-success-bg text-success border border-success-border rounded-2xl px-[10px] py-[3px] font-bold flex items-center text-[11px]">
          {t('productCard.stock')}: {stock}
        </span>
      </div>
      <Button
        className="w-full text-primary-clicked hover:text-neutral-white bg-primary-bg hover:bg-primary-hover flex items-center border-primary-border"
        onClick={onBuy}
      >
        <RenderIcon className="mr-2" name="cart" />
        <span>{t('productCard.add-to-cart')}</span>
      </Button>
    </div>
  );
}
