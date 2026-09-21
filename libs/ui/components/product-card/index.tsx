import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
import { Button } from '../button';
import { IconButton } from '../icon-button';
import { RenderIcon } from '../icons';
import { UiImage, UiLink } from '../link-image-provider';
import { Tag, type TagColorName } from '../tag';

const LOW_STOCK_THRESHOLD = 10;

export type ProductCardProps = {
  className?: string;
  href?: string;

  image: {
    url: string;
    alt?: string;
  };

  name: string;
  category?: string;
  rating?: number;
  sold?: number;

  price: number;
  originalPrice?: number;

  stock: number;

  badge?: string;
  sale?: number;

  isFavorite?: boolean;
  onFavorite?: () => void;
  onAddToCart?: () => void;

  customClasses?: {
    root?: string;
    image?: string;
    name?: string;
    price?: string;
  };
};

function getStockTag(
  stock: number,
  inStockLabel: string,
  outOfStockLabel: string,
): { content: string; color: TagColorName } {
  if (stock <= 0) {
    return { content: outOfStockLabel, color: 'error' };
  }
  return {
    content: inStockLabel,
    color: stock <= LOW_STOCK_THRESHOLD ? 'pending' : 'success',
  };
}

export function ProductCard({
  className,
  href = '/',
  image,
  name,
  category,
  rating,
  sold,
  price,
  originalPrice,
  stock,
  badge,
  sale,
  isFavorite = false,
  onFavorite,
  onAddToCart,
  customClasses,
}: ProductCardProps) {
  const { t } = useTranslation('ui');
  const isOutOfStock = stock <= 0;
  const hasSale = sale != null && sale > 0;
  const showOriginalPrice = originalPrice != null && originalPrice > price;
  const stockTag = getStockTag(
    stock,
    t('productCard.inStock', { count: stock }),
    t('productCard.outOfStock'),
  );
  const imageAlt = image.alt ?? name;
  const nameClassName = cn(
    'block min-w-0 w-full text-14.5 font-bold text-neutral-text-primary leading-snug line-clamp-2',
    customClasses?.name,
  );

  return (
    <div
      className={cn(
        'flex h-full min-w-60 flex-col gap-2.5 rounded-2xl border border-neutral-border bg-neutral-white p-3.5 transition-shadow hover:shadow-raised',
        className,
        customClasses?.root,
      )}
    >
      <div
        className={cn(
          'relative aspect-4/3 w-full overflow-hidden rounded-xl bg-neutral-bg',
          customClasses?.image,
        )}
      >
        {image.url ? (
          <UiLink href={href} className="block h-full w-full">
            <UiImage src={image.url} alt={imageAlt} className="h-full w-full object-cover" />
          </UiLink>
        ) : null}

        {hasSale || badge ? (
          <span className="absolute left-2.5 top-2.5 z-10">
            <Tag
              type={hasSale ? 'solid' : 'default'}
              color={hasSale ? undefined : 'error'}
              content={hasSale ? t('productCard.sale', { percent: sale }) : badge}
            />
          </span>
        ) : null}

        <IconButton
          type="button"
          icon={isFavorite ? 'heart-solid' : 'heart-outline'}
          color={isFavorite ? 'error' : 'neutral'}
          variant="outline"
          shape="circle"
          aria-pressed={isFavorite}
          aria-label={t(isFavorite ? 'productCard.favoriteRemove' : 'productCard.favoriteAdd')}
          className="absolute right-2 top-2 z-10 h-8 w-8 bg-neutral-white"
          iconClassName="!h-4 !w-4"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onFavorite?.();
          }}
        />
      </div>

      <div
        className={cn(
          'flex items-center justify-between gap-2',
          !category && !rating && !sold && 'hidden',
        )}
      >
        <span
          className={cn(
            'truncate text-ui-overline uppercase text-neutral-text-secondary',
            !category && 'hidden',
          )}
        >
          {category}
        </span>
        <div className={cn('flex shrink-0 items-center gap-1', !rating && !sold && 'hidden')}>
          <RenderIcon
            name="star-solid"
            className={cn('!h-3 !w-3 text-primary', !rating && 'hidden')}
          />
          <span className={cn('text-11.5 font-bold text-secondary', !rating && 'hidden')}>
            {rating}
          </span>
          <span className={cn('text-11 text-neutral-placeholder', !sold && 'hidden')}>
            <span className={cn(!rating && 'hidden')}>· </span>
            {t('productCard.sold', { count: sold })}
          </span>
        </div>
      </div>

      <UiLink href={href} className={nameClassName} title={name}>
        {name}
      </UiLink>

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className={cn('text-16 font-extrabold text-primary', customClasses?.price)}>
            {formatCurrency(price)}
          </span>
          {showOriginalPrice ? (
            <span className="truncate text-12 text-neutral-text-secondary line-through">
              {formatCurrency(originalPrice)}
            </span>
          ) : null}
        </div>
        <Tag content={stockTag.content} color={stockTag.color} />
      </div>

      <Button
        type="button"
        color={isOutOfStock ? 'neutral' : 'primary'}
        variant="subtle"
        icon="cart"
        disabled={isOutOfStock}
        className={cn('h-9.5 w-full text-13 font-bold', isOutOfStock && 'opacity-100')}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onAddToCart?.();
        }}
      >
        {isOutOfStock ? t('productCard.outOfStock') : t('productCard.addToCart')}
      </Button>
    </div>
  );
}
