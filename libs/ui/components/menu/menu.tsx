import type { MenuChangeEvent } from '@szhsin/react-menu';
import { Menu as MenuComponent, MenuHeader, MenuItem } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../helpers/utils';

export type MenuEntry = {
  key: string;
  label: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
};

export type MenuProps = {
  trigger: ReactElement;
  items: MenuEntry[];
  /** Non-interactive block above the items (e.g. a name/email summary) — renders via the underlying
   * library's `MenuHeader`, not a disabled `MenuItem`, so it never picks up hover/click/disabled styling. */
  header?: ReactNode;
  align?: 'start' | 'center' | 'end';
  portal?: boolean;
  /** Fires when the menu opens/closes — used to sync the trigger's UI (e.g. rotating a chevron icon). */
  onMenuChange?: (event: MenuChangeEvent) => void;
  customClasses?: {
    menu?: string;
    header?: string;
    item?: string;
    dangerItem?: string;
  };
};

export function Menu({
  trigger,
  items,
  header,
  align = 'start',
  portal = true,
  onMenuChange,
  customClasses,
}: MenuProps) {
  const menuClassName =
    customClasses?.menu ??
    'min-w-max bg-neutral-white border border-neutral-border rounded-lg shadow-2xl overflow-hidden';
  const itemClassName =
    customClasses?.item ?? 'text-xs px-3 py-2 cursor-pointer hover:bg-neutral-bg transition-colors';
  const dangerItemClassName =
    customClasses?.dangerItem ??
    'text-xs px-3 py-2 cursor-pointer text-error hover:bg-error-bg transition-colors';

  return (
    <MenuComponent
      menuButton={trigger}
      align={align}
      menuClassName={menuClassName}
      portal={portal}
      onMenuChange={onMenuChange}
    >
      {header && (
        <MenuHeader
          className={cn('border-b border-neutral-border px-3 py-2.5', customClasses?.header)}
        >
          {header}
        </MenuHeader>
      )}
      {items.map((item) => (
        <MenuItem
          key={item.key}
          disabled={item.disabled}
          className={cn(
            itemClassName,
            item.danger ? dangerItemClassName : undefined,
            item.className,
          )}
          onClick={(_e) => {
            if (item.disabled) return;
            item.onClick?.();
          }}
        >
          {item.label}
        </MenuItem>
      ))}
    </MenuComponent>
  );
}
