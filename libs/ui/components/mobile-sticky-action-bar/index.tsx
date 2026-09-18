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
      className={cn(
        'w-80 border border-neutral-divider rounded-xl p-2 absolute bottom-0 px-3 py-[10px] gap-3',
        className,
      )}
    >
      {/* variant M3 */}
      <div
        className={cn('flex items-center gap-2 w-full  h-11', {
          hidden: !!checkout,
        })}
      >
        <IconButton
          icon="heart"
          iconClassName={favorited ? 'text-primary fill-current' : 'text-neutral-disable'}
          onClick={onFavorite}
          className="border border-neutral-divider bg-neutral-white rounded-lg h-11 w-11"
        />

        <Button
          icon="cart"
          onClick={addCart?.onClick}
          className="flex border-primary bg-pending-bg text-primary hover:text-neutral-white h-11"
        >
          {t('mobileStickyActionBar.add-to-cart')}
        </Button>
        <Button onClick={buy?.onClick} className="flex-1 w-full h-11">
          {t('mobileStickyActionBar.buy-now')}
        </Button>
      </div>
      {/* variant M4 */}
      <div
        className={cn('flex items-center justify-between gap-3 h-11 w-full px-3 py-[10px]', {
          hidden: !checkout,
        })}
      >
        <div className="flex flex-col">
          <span className=" font-medium text-neutral-text-secondary uppercase text-[10.5px] tracking-wide">
            {t('mobileStickyActionBar.title')}
          </span>
          <span className=" font-extrabold text-primary text-lg tracking-[-0.02em]">
            {formatCurrency(checkout?.price || 0)}
          </span>
        </div>
        <Button onClick={checkout?.onClick} className=" px-10 h-11">
          {t('mobileStickyActionBar.checkout')}
        </Button>
      </div>
    </div>
  );
}
