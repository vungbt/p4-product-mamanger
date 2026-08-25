import type { MouseEventHandler, ReactNode } from 'react';
import { RenderIcon } from '../../components/icons';
import { cn } from '../../helpers/utils';

export type SidebarNavItem = {
  key?: string | number;
  /** Freeform icon (RenderIcon or a custom SVG) — the admin menu often uses a different icon set than the shared components. */
  icon: ReactNode;
  label: ReactNode;
  href?: string;
  active?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** Tooltip shown when the sidebar is collapsed (icon-only) — omit for no tooltip. */
  title?: string;
  /** Nested submenu — when present, the item renders as <details>/<summary> (click to open/close) instead of a link. */
  children?: SidebarNavItem[];
};

export type SidebarSection = {
  key?: string | number;
  /** Omit = first group (no title). */
  title?: ReactNode;
  items: SidebarNavItem[];
};

export type SidebarProps = {
  /** Logo/brand — like `Header`/`Footer`, always received from the outside, brand is never hardcoded. */
  logo: ReactNode;
  sections: SidebarSection[];
  /** Bottom area of the sidebar — usually a `UserChip` (drop border/padding via customClasses) or other actions. */
  footer?: ReactNode;
  /** Collapse to icon-only (hides label, group title, submenu arrow) — e.g. when the user clicks the collapse-sidebar button. */
  collapsed?: boolean;
  className?: string;
  customClasses?: {
    root?: string;
    brand?: string;
    nav?: string;
    navItem?: string;
    sectionTitle?: string;
    footer?: string;
  };
};

const navItemBaseClass =
  'flex items-center gap-2.5 whitespace-nowrap rounded-[10px] border border-transparent px-3 py-[9px] text-ui-body-strong no-underline transition-colors cursor-pointer';
const navItemActiveClass = 'border-primary-border bg-primary-background text-primary-clicked';
const navItemInactiveClass = 'text-secondary hover:bg-neutral-bg';

function NavItemIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">{children}</span>
  );
}

// Recursive render — supports nesting submenus multiple levels deep (though the current design only
// needs one level), using the native <details>/<summary> mechanism (open by default, the user can
// open/close it themselves, no external state needed).
function SidebarNavLink({
  item,
  collapsed,
  navItemClassName,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
  navItemClassName?: string;
}) {
  const tooltip = collapsed
    ? (item.title ?? (typeof item.label === 'string' ? item.label : undefined))
    : undefined;

  if (item.children && item.children.length > 0) {
    return (
      <details className="group grid gap-0.5" open>
        <summary
          title={tooltip}
          className={cn(
            navItemBaseClass,
            navItemInactiveClass,
            '[&::-webkit-details-marker]:hidden list-none',
            collapsed && 'justify-center px-2',
            navItemClassName,
          )}
        >
          <NavItemIcon>{item.icon}</NavItemIcon>
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              <RenderIcon
                name="chevron-down"
                strokeWidth={2}
                className="!h-3.5 !w-3.5 shrink-0 text-neutral-placeholder transition-transform group-open:rotate-180"
              />
            </>
          )}
        </summary>
        <div className={cn('grid gap-0.5', !collapsed && 'pl-4')}>
          {item.children.map((child, index) => (
            <SidebarNavLink
              key={child.key ?? index}
              item={child}
              collapsed={collapsed}
              navItemClassName={navItemClassName}
            />
          ))}
        </div>
      </details>
    );
  }

  return (
    <a
      href={item.href ?? '#'}
      onClick={item.onClick}
      title={tooltip}
      className={cn(
        navItemBaseClass,
        item.active ? navItemActiveClass : navItemInactiveClass,
        collapsed && 'justify-center px-2',
        navItemClassName,
      )}
    >
      <NavItemIcon>{item.icon}</NavItemIcon>
      {!collapsed && <span>{item.label}</span>}
    </a>
  );
}

// Per docs/design/p4-product-manager-design.html: the admin sidebar has a fixed width of 224px (w-56), menu
// items rounded 10px — active = `primary-border` border + `primary-background` background + `primary-clicked` text,
// inactive = transparent border + `secondary` text. Section title is an uppercase overline, letter-spaced.
// `collapsed` (added after the original design) shrinks the sidebar to w-20, icon-only — needed for
// the real admin layout, which already has a sidebar collapse/expand button.
export function Sidebar({
  logo,
  sections,
  footer,
  collapsed = false,
  className,
  customClasses,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex min-h-screen shrink-0 flex-col border-r border-neutral-border bg-neutral-white px-3 pb-2 pt-4 transition-all ease-linear',
        collapsed ? 'w-20' : 'w-56',
        customClasses?.root,
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2.5 px-2 pb-[18px] pt-1.5',
          collapsed && 'justify-center',
          customClasses?.brand,
        )}
      >
        {logo}
      </div>

      <nav className={cn('flex flex-col gap-0.5', customClasses?.nav)}>
        {sections.map((section, sectionIndex) => (
          <div key={section.key ?? sectionIndex} className="flex flex-col gap-0.5">
            {section.title && !collapsed && (
              <div
                className={cn(
                  'px-3 pb-1.5 pt-4 text-ui-overline text-neutral-placeholder',
                  customClasses?.sectionTitle,
                )}
              >
                {section.title}
              </div>
            )}
            {section.items.map((item, itemIndex) => (
              <SidebarNavLink
                key={item.key ?? itemIndex}
                item={item}
                collapsed={collapsed}
                navItemClassName={customClasses?.navItem}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="flex-1" />

      {footer && (
        <div
          className={cn(
            'flex items-center gap-2.5 border-t border-neutral-border px-2 py-2.5',
            collapsed && 'justify-center',
            customClasses?.footer,
          )}
        >
          {footer}
        </div>
      )}
    </aside>
  );
}
