import {
  Button,
  cn,
  Icon,
  IconButton,
  Tag,
  type TagTone,
  UiImage,
  UiLink,
} from '@itclabs/react-ui';
import { HeartIcon as FilledHeartIcon, StarIcon } from '@itclabs/react-ui/icons/bold';
import { CartIcon, HeartIcon } from '@itclabs/react-ui/icons/outline';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../helpers';

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
): { content: string; color: TagTone } {
  if (stock <= 0) {
    return { content: outOfStockLabel, color: 'danger' };
  }
  return {
    content: inStockLabel,
    color: stock <= LOW_STOCK_THRESHOLD ? 'warning' : 'success',
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
  const { t } = useTranslation('blocks');
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
    'block min-w-0 w-full text-control font-bold text-ink leading-snug line-clamp-2',
    customClasses?.name,
  );

  return (
    <div
      className={cn(
        'flex h-full min-w-60 flex-col gap-2.5 rounded-2xl border border-line bg-surface p-3.5 transition-shadow hover:shadow-floating',
        className,
        customClasses?.root,
      )}
    >
      <div
        className={cn(
          'relative aspect-4/3 w-full overflow-hidden rounded-xl bg-canvas',
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
            <Tag tone={hasSale ? 'brand' : 'danger'}>
              {hasSale ? t('productCard.sale', { percent: sale }) : badge}
            </Tag>
          </span>
        ) : null}

        <IconButton
          type="button"
          icon={isFavorite ? FilledHeartIcon : HeartIcon}
          variant="secondary"
          aria-pressed={isFavorite}
          label={t(isFavorite ? 'productCard.favoriteRemove' : 'productCard.favoriteAdd')}
          className="absolute right-2 top-2 z-10 h-8 w-8 bg-surface"
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
        <span className={cn('truncate text-eyebrow uppercase text-muted', !category && 'hidden')}>
          {category}
        </span>
        <div className={cn('flex shrink-0 items-center gap-1', !rating && !sold && 'hidden')}>
          <Icon glyph={StarIcon} className={cn('!h-3 !w-3 text-accent', !rating && 'hidden')} />
          <span className={cn('text-xs font-bold text-muted', !rating && 'hidden')}>{rating}</span>
          <span className={cn('text-xs text-muted', !sold && 'hidden')}>
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
          <span className={cn('text-body font-extrabold text-accent', customClasses?.price)}>
            {formatCurrency(price)}
          </span>
          {showOriginalPrice ? (
            <span className="truncate text-xs text-muted line-through">
              {formatCurrency(originalPrice)}
            </span>
          ) : null}
        </div>
        <Tag tone={stockTag.color}>{stockTag.content}</Tag>
      </div>

      <Button
        type="button"
        variant="secondary"
        disabled={isOutOfStock}
        className={cn('h-9.5 w-full text-ui-sm font-bold', isOutOfStock && 'opacity-100')}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onAddToCart?.();
        }}
      >
        <Icon glyph={CartIcon} />
        {isOutOfStock ? t('productCard.outOfStock') : t('productCard.addToCart')}
      </Button>
    </div>
  );
}
