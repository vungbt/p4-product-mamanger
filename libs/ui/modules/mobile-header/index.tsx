import { IconButton } from '../../components';
import { cn } from '../../helpers';

export type MobileHeaderProps = {
  lead?: 'logo' | 'back';
  label: string;
  title: string;
  time: string;
  showCart?: boolean;
  cartCount?: number;
  onBack?: () => void;
  className?: string;
};

export function MobileHeader({
  lead = 'logo',
  time,
  label,
  title,
  showCart,
  cartCount,
  onBack,
  className,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col border border-neutral-border rounded-xl px-3 py-1 bg-neutral-white',
        className,
      )}
    >
      <div className="flex items-center justify-between text-10 font-bold">
        <div className="">{time}</div>
        <div className="">{label}</div>
      </div>
      {lead === 'logo' ? (
        <div className="flex justify-between mt-2">
          <div className="text-xl font-bold text-primary">{title}</div>
          <div className="flex gap-3 text-neutral-text-secondary">
            <IconButton
              type="button"
              icon="search"
              className="text-neutral-text-secondary hover:text-primary rounded-xl "
            />
            {showCart && (
              <IconButton
                type="button"
                icon="cart"
                badge={cartCount && cartCount > 0 ? cartCount : undefined}
                className="text-neutral-text-secondary hover:text-primary rounded-xl"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex gap-3 text-neutral-text-secondary">
            <IconButton
              type="button"
              icon="chevron-left"
              className="text-neutral-text-secondary hover:text-primary rounded-xl"
              onClick={onBack}
            />
          </div>
          <div className="text-18 font-extrabold">
            <span> {title}</span>
            <span> {cartCount && cartCount > 0 ? `(${cartCount})` : null}</span>
          </div>
        </div>
      )}
    </header>
  );
}
