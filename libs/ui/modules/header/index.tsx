import type { MouseEventHandler, ReactNode } from 'react';
import { UiLink } from '../../components/link-image-provider';
import { cn } from '../../helpers/utils';

export type HeaderNavItem = {
  key?: string | number;
  label: ReactNode;
  href?: string;
  active?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export type HeaderProps = {
  /**
   * Logo/brand — Header doesn't draw any project-specific logo itself (it's shared via `@p4/ui`), always
   * received from the outside, e.g. `<BrandLogo variant="header" />` from the app using it.
   */
  logo: ReactNode;
  navItems?: HeaderNavItem[];
  /** Search bar — pass in an already-configured `<SearchInput ... />`. Leave empty if the header doesn't need search. */
  search?: ReactNode;
  /**
   * Right-hand area — freely composable (a cart/notification IconButton with a badge, UserChip,
   * ThemeToggle, LanguageSwitcher...). Header only handles the frame, it doesn't hardcode specific business logic.
   */
  actions?: ReactNode;
  className?: string;
  customClasses?: {
    root?: string;
    brand?: string;
    nav?: string;
    navItem?: string;
    search?: string;
    actions?: string;
  };
};

// Per docs/design/p4-product-manager-design.html: sticky header bar 64px tall, 24px horizontal
// padding, 18px gap between blocks, `neutral-border` border-bottom. Nav items use the exact
// "ui-body-strong" size/weight (13.5px/700) per the design — active = `primary-background` background/`primary` text,
// inactive = `secondary` text/transparent background.
export function Header({ logo, navItems, search, actions, className, customClasses }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 items-center gap-[18px] border-b border-neutral-border bg-neutral-white px-6',
        customClasses?.root,
        className,
      )}
    >
      <div className={cn('flex shrink-0 items-center gap-2.5', customClasses?.brand)}>{logo}</div>

      {navItems && navItems.length > 0 && (
        <nav className={cn('flex items-center gap-1', customClasses?.nav)}>
          {navItems.map((item, index) => (
            <UiLink
              key={item.key ?? index}
              href={item.href ?? '#'}
              onClick={item.onClick}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-2 text-ui-body-strong no-underline transition-colors',
                item.active
                  ? 'bg-primary-background text-primary'
                  : 'bg-transparent text-secondary hover:bg-neutral-bg',
                customClasses?.navItem,
              )}
            >
              {item.label}
            </UiLink>
          ))}
        </nav>
      )}

      {search && (
        <div className={cn('flex min-w-[220px] flex-1 justify-center', customClasses?.search)}>
          {search}
        </div>
      )}

      {actions && (
        <div className={cn('flex shrink-0 items-center gap-2.5', customClasses?.actions)}>
          {actions}
        </div>
      )}
    </header>
  );
}
