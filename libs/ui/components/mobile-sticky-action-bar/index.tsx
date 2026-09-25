import { useTranslation } from 'react-i18next';
import { cn, formatCurrency } from '../../helpers';
import { Button } from '../button';
import { IconButton } from '../icon-button';

type MobileStickyActionBarProps = {
  favorited?: boolean;
  onFavorite?: () => void;

  onAddCart?: () => void;
  onBuy?: () => void;

  /** Switches from the add-to-cart/buy row (variant M3) to the price/checkout row (variant M4). */
  showCheckout?: boolean;
  checkoutPrice?: number;
  onCheckout?: () => void;
  className?: string;
};

export function MobileStickyActionBar({
  onFavorite,
  favorited,
  onAddCart,
  onBuy,
  showCheckout,
  checkoutPrice,
  onCheckout,
  className,
}: MobileStickyActionBarProps) {
  const { t } = useTranslation('ui');
  return (
    <div
      className={cn(
        'w-full max-w-80 border border-neutral-divider rounded-xl p-2 px-3 py-2.5 gap-3',
        className,
      )}
    >
      {/* variant M3 */}
      <div
        className={cn('flex items-center gap-2 w-full  h-11', {
          hidden: showCheckout,
        })}
      >
        <IconButton
          icon={favorited ? 'heart-solid' : 'heart-outline'}
          iconClassName={favorited ? 'text-primary fill-current' : 'text-neutral-disable'}
          onClick={onFavorite}
          className="border border-neutral-divider bg-neutral-white rounded-lg h-11 w-11"
        />

        <Button
          icon="cart"
          onClick={onAddCart}
          className="flex border-primary bg-pending-bg text-primary hover:text-neutral-white h-11"
        >
          {t('mobileStickyActionBar.add-to-cart')}
        </Button>
        <Button onClick={onBuy} className="flex-1 w-full h-11">
          {t('mobileStickyActionBar.buy-now')}
        </Button>
      </div>
      {/* variant M4 */}
      <div
        className={cn('flex items-center justify-between gap-3 h-11 w-full px-3 py-2.5', {
          hidden: !showCheckout,
        })}
      >
        <div className="flex flex-col">
          <span className=" font-medium text-neutral-text-secondary uppercase text-10.5 tracking-wide">
            {t('mobileStickyActionBar.title')}
          </span>
          <span className=" font-extrabold text-primary text-lg tracking-[-0.02em]">
            {formatCurrency(checkoutPrice || 0)}
          </span>
        </div>
        <Button onClick={onCheckout} className=" px-10 h-11">
          {t('mobileStickyActionBar.checkout')}
        </Button>
      </div>
    </div>
  );
}
