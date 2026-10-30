import { IconButton } from '../../components/icon-button';
import { Input } from '../../components/input';
import { UiImage, UiLink } from '../../components/link-image-provider';
import { UserChip } from '../../components/user-chip';
import { cn } from '../../helpers/utils';

export type NavItem = {
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
};

export type StorefrontHeaderProps = {
  navItems?: NavItem[];
  logo?: string;
  brandName?: string;
  cartCount?: number;
  user: {
    name: string;
    avatar?: string;
  };
  className?: string;
  onSearch?: (value: string) => void;
  onCartClick?: () => void;
};

export const StorefrontHeader = ({
  logo,
  navItems,
  cartCount,
  brandName,
  user,
  className,
  onSearch,
  onCartClick,
}: StorefrontHeaderProps) => {
  return (
    <header
      className={cn(
        'flex items-center justify-between w-full px-6 py-3 bg-neutral-white rounded-xl border border-neutral-border gap-5 ',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-6">
        {logo ? (
          <UiImage src={logo} alt="logo" className="w-16 h-16" />
        ) : (
          <div className="text-primary font-extrabold text-xl">{brandName}</div>
        )}
        <div className="flex items-center justify-center text-13.5 gap-2">
          {navItems?.map((item) => (
            <UiLink
              key={item.label}
              href={item.href}
              onClick={item.onClick}
              className={cn(
                'cursor-pointer text-13.5 font-medium transition-colors hover:text-primary',
                item.active ? 'text-primary font-semibold' : 'text-neutral-text-secondary',
              )}
            >
              {item.label}
            </UiLink>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 flex-1">
        <Input
          onChange={(e) => onSearch?.(e.target.value)}
          className="text-13.5 px-4"
          placeholder="Tìm bàn phím cơ, tai nghe, SSD,... "
        />
        <div className="flex items-center justify-between shrink-0 gap-1.5">
          <IconButton
            icon="shopping-cart"
            variant="outline"
            color="neutral"
            shape="square"
            className="relative rounded-lg p-2"
            badge={cartCount && cartCount > 0 ? cartCount : undefined}
            badgeColor="primary"
            onClick={onCartClick}
          />
          <UserChip
            name={user.name}
            avatarUrl={user.avatar}
            className="rounded-none border-none shadow-none "
          />
        </div>
      </div>
    </header>
  );
};
