import { Menu as MenuComponent, MenuItem } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../lib/utils';

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
  align?: 'start' | 'center' | 'end';
  portal?: boolean;
  customClasses?: {
    menu?: string;
    item?: string;
    dangerItem?: string;
  };
};

export function Menu({ trigger, items, align = 'start', portal = true, customClasses }: MenuProps) {
  const menuClassName =
    customClasses?.menu ??
    'min-w-max bg-white border border-neutral-border rounded-lg shadow-2xl overflow-hidden';
  const itemClassName =
    customClasses?.item ?? 'text-xs px-3 py-2 cursor-pointer hover:bg-neutral-bg transition-colors';
  const dangerItemClassName =
    customClasses?.dangerItem ??
    'text-xs px-3 py-2 cursor-pointer text-error hover:bg-error-bg transition-colors';

  return (
    <MenuComponent menuButton={trigger} align={align} menuClassName={menuClassName} portal={portal}>
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
