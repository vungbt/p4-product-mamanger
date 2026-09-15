import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
import { Button } from '../button';
import { IconButton } from '../icon-button';

type MobileStickyActionBarProps = {
  favorited?: boolean;
  onFavorite?: () => void;

  addCart?: {
    label?: string;
    onClick?: () => void;
  };
  buy?: {
    label?: string;
    price?: number;
    onClick?: () => void;
  };

  checkout?: {
    title?: string;
    price?: number;
    label?: string;
    onClick?: () => void;
  };
  className?: string;
};

export function MobileStickyActionBar({
  onFavorite,
  favorited,
  addCart,
  buy,
  checkout,
  className,
}: MobileStickyActionBarProps) {
  const { t } = useTranslation('ui');
  return (
    <div
      className={cn('border border-neutral-divider rounded-xl p-2 absolute bottom-0', className)}
    >
      {/* variant M3 */}
      <div
        className={cn('flex items-center gap-2 w-full  h-16', {
          hidden: !!checkout,
        })}
      >
        <IconButton
          icon="heart"
          iconClassName={favorited ? 'text-primary fill-current' : 'text-neutral-disable'}
          onClick={onFavorite}
          className="border border-neutral-divider bg-neutral-white rounded-lg h-12 w-12"
        />

        <Button
          onClick={addCart?.onClick}
          className="flex-1 border-primary bg-pending-bg w-44 text-primary hover:text-neutral-white h-12"
          icon="cart"
        >
          {t('mobile-sticky-action-bar.add-to-cart')}
        </Button>
        <Button onClick={buy?.onClick} className="flex-1 w-full h-12">
          {t('mobile-sticky-action-bar.buy-now')}
        </Button>
      </div>
      {/* variant M4 */}
      <div
        className={cn('flex w-80 items-center gap-2 h-16', {
          hidden: !checkout,
        })}
      >
        <div className="flex flex-col px-2">
          <span className=" font-medium text-neutral-text-secondary uppercase text-lg">
            {t('mobile-sticky-action-bar.title')}
          </span>
          <span className=" font-bold text-primary text-xl">
            {formatCurrency(checkout?.price || 0)}
          </span>
        </div>
        <Button onClick={checkout?.onClick} className=" w-2/3 px-8 h-12">
          {t('mobile-sticky-action-bar.checkout')}
        </Button>
      </div>
    </div>
  );
}
