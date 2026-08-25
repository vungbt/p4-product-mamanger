import type { ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '../../helpers/utils';
import { RenderIcon } from '../icons';
import { Menu, type MenuEntry } from '../menu';

export type UserChipProps = {
  name: string;
  /** Secondary line under the name, e.g. a job title ("Administrator"). Omit = single-line chip (default). */
  subtitle?: ReactNode;
  avatarUrl?: string | null;
  className?: string;
  customClasses?: {
    root?: string;
    avatar?: string;
    name?: string;
    subtitle?: string;
  };
  /** When provided, the chip becomes a dropdown trigger (click opens a menu). Omit = static chip (default). */
  dropdownItems?: MenuEntry[];
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Per docs/design/p4-product-manager-design.html: a pill with a `neutral-border` border, a 28px tinted
// avatar (bg `primary-background` + border `primary-border` + `primary-clicked` text) — different from
// the current `Avatar` (solid `bg-primary` + white text), so the circle is written separately here.
function UserChipContent({
  name,
  subtitle,
  avatarUrl,
  customClasses,
  trailing,
}: Pick<UserChipProps, 'name' | 'subtitle' | 'avatarUrl' | 'customClasses'> & {
  trailing?: ReactNode;
}) {
  return (
    <>
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary-border bg-primary-background text-[11px] font-bold text-primary-clicked',
          customClasses?.avatar,
        )}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </span>
      {subtitle ? (
        <span className="min-w-0 text-left">
          <span
            className={cn(
              'block truncate text-[13px] font-bold leading-tight text-neutral-text-primary',
              customClasses?.name,
            )}
          >
            {name}
          </span>
          <span
            className={cn(
              'block truncate text-[11px] leading-tight text-neutral-text-secondary',
              customClasses?.subtitle,
            )}
          >
            {subtitle}
          </span>
        </span>
      ) : (
        <span
          className={cn('text-[13px] font-semibold text-neutral-text-primary', customClasses?.name)}
        >
          {name}
        </span>
      )}
      {trailing}
    </>
  );
}

export function UserChip({
  name,
  subtitle,
  avatarUrl,
  className,
  customClasses,
  dropdownItems,
}: UserChipProps) {
  const [open, setOpen] = useState(false);

  const rootClass = cn(
    'inline-flex items-center gap-2 rounded-full border border-neutral-border py-1 pl-1 pr-2.5',
    customClasses?.root,
    className,
  );

  if (!dropdownItems || dropdownItems.length === 0) {
    return (
      <div className={rootClass}>
        <UserChipContent
          name={name}
          subtitle={subtitle}
          avatarUrl={avatarUrl}
          customClasses={customClasses}
        />
      </div>
    );
  }

  return (
    <Menu
      trigger={
        <button
          type="button"
          className={cn(rootClass, 'cursor-pointer transition-colors hover:bg-neutral-bg')}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <UserChipContent
            name={name}
            subtitle={subtitle}
            avatarUrl={avatarUrl}
            customClasses={customClasses}
            trailing={
              <RenderIcon
                name="chevron-down"
                className={cn(
                  '!h-3 !w-3 text-neutral-text-secondary transition-transform',
                  open && 'rotate-180',
                )}
              />
            }
          />
        </button>
      }
      items={dropdownItems}
      onMenuChange={(e) => setOpen(e.open)}
    />
  );
}
