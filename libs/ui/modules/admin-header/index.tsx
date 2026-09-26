import type { MouseEventHandler, ReactNode } from 'react';
import { RenderIcon } from '../../components/icons';
import { UiLink } from '../../components/link-image-provider';
import { cn } from '../../helpers/utils';

export type AdminHeaderCrumb = {
  key?: string | number;
  label: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export type AdminHeaderProps = {
  /**
   * Left area, before the breadcrumb — e.g. a sidebar collapse/expand button. Omit = nothing there
   * (breadcrumb sits flush against the left edge, matching the original design with no sidebar toggle).
   */
  leading?: ReactNode;
  /** Left breadcrumb — the last item is always the current page (bold), matching the design. */
  breadcrumbs: AdminHeaderCrumb[];
  /**
   * Right area — freely composable (date range filter, a notification-bell IconButton with a badge,
   * UserChip...). AdminHeader only handles the frame, it doesn't hardcode specific business logic.
   */
  actions?: ReactNode;
  className?: string;
  customClasses?: {
    root?: string;
    leading?: string;
    breadcrumbs?: string;
    actions?: string;
  };
};

// Per docs/design/p4-product-manager-design.html: the admin header is 64px tall, 26px horizontal padding,
// breadcrumb style "Admin › Dashboard" (chevron-right, not "/"), the last item is bold
// `neutral-text-primary`, earlier items are the lighter `neutral-text-secondary`.
export function AdminHeader({
  leading,
  breadcrumbs,
  actions,
  className,
  customClasses,
}: AdminHeaderProps) {
  return (
    <header
      className={cn(
        'flex h-16 shrink-0 items-center justify-between gap-4 border-b border-neutral-border bg-neutral-white px-[26px]',
        customClasses?.root,
        className,
      )}
    >
      <div className="flex h-full min-w-0 items-center gap-3">
        {leading && (
          <div className={cn('flex shrink-0 self-center items-center', customClasses?.leading)}>
            {leading}
          </div>
        )}
        <div
          className={cn(
            'flex self-center items-center gap-2 text-ui-label text-neutral-text-secondary',
            customClasses?.breadcrumbs,
          )}
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const content =
              item.href && !isLast ? (
                <UiLink
                  href={item.href}
                  onClick={item.onClick}
                  className="no-underline transition-colors hover:text-primary"
                >
                  {item.label}
                </UiLink>
              ) : (
                <span className={isLast ? 'font-bold text-neutral-text-primary' : undefined}>
                  {item.label}
                </span>
              );

            return (
              <span key={item.key ?? index} className="flex items-center gap-2">
                {index > 0 && (
                  <RenderIcon
                    name="chevron-right"
                    strokeWidth={2}
                    className="!h-3.5 !w-3.5 text-neutral"
                  />
                )}
                {content}
              </span>
            );
          })}
        </div>
      </div>

      {actions && (
        <div className={cn('flex shrink-0 items-center gap-3', customClasses?.actions)}>
          {actions}
        </div>
      )}
    </header>
  );
}
