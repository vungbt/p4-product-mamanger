import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { RenderIcon } from '../icons';

export type ProductCardProps = {
  type?: 'best-seller' | 'new-arrival' | 'featured';
  className?: string;
  favored?: boolean;
  onFavorite?: () => void;

  thumbnail: {
    imageUrl?: string;
    alt?: string;
  };

  sold: {
    number?: number;
    remaining?: number;
  };

  category?: string;
  rating?: number;

  name: string;
  description?: string;

  price: number;
  stock: number;

  onBuy?: () => void;
};
export function ProductCard({
  type,
  className = '',
  favored = false,
  onFavorite,
  sold,
  thumbnail,
  category,
  rating,
  name,
  description,
  price,
  stock,
  onBuy,
}: ProductCardProps) {
  const { t } = useTranslation('ui');
  const soldCount = sold.number! - sold.remaining!;
  return (
    <div
      className={cn(
        'max-w-[260px] max-h-full border border-neutral-divider bg-neutral-white rounded-xl p-4',
        className,
      )}
    >
      <div className="relative h-48 mb-2">
        <div className="w-full h-full bg-neutral-divider rounded-xl p-4">
          {thumbnail.imageUrl ? (
            <img
              className="w-full h-full rounded-xl"
              src={thumbnail.imageUrl}
              alt={thumbnail.alt}
            />
          ) : (
            <div className="w-full h-full rounded-xl flex items-center justify-center">
              <RenderIcon
                name="keyboard"
                strokeWidth={1.5}
                className="text-neutral-disable !h-20 !w-20"
              />
            </div>
          )}
        </div>
        {type && (
          <div className="absolute  top-2.5 left-2.5 bg-error-bg text-error-base px-2.5 py-1 rounded-full border border-error-border">
            <span className="font-bold text-[11.5px]">
              {type === 'best-seller' && t('productCard.best-seller')}
              {type === 'new-arrival' && t('productCard.new-arrival')}
              {type === 'featured' && t('productCard.featured')}
            </span>
          </div>
        )}
        <div className="flex items-center justify-center w-8 h-8 absolute top-2 right-2 rounded-full bg-neutral-white">
          <IconButton
            icon="heart"
            className="!h-4 !w-4"
            iconClassName={favored ? 'text-primary fill-current' : 'text-neutral-disable'}
            onClick={onFavorite}
          />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-neutral-disable font-bold text-[11px]">{category}</span>
        <div className="flex gap-2 items-center">
          <RenderIcon name="star" className="text-primary-base fill-current !w-3 !h-3" />
          <span className="text-neutral-text-secondary font-bold text-[11.5px] tracking-[0.04em]">
            {rating}
          </span>
          {soldCount && soldCount > 0 ? (
            <span className="text-neutral-disable text-[11px]">
              {t('productCard.period')}
              {soldCount}
            </span>
          ) : null}
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
        icon="cart"
      >
        <span>{t('productCard.add-to-cart')}</span>
      </Button>
    </div>
  );
}
