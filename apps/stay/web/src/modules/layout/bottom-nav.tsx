import { cn, Drawer, Icon, type IconName } from '@itclabs/react-ui';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import type { StayRoute } from '@/routing/route-configs';
import { useMenuRoutes } from '@/routing/use-routes';

const itemClass =
  'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-control px-1 text-eyebrow font-medium';

function ItemContent({ icon, label }: { icon: IconName; label: ReactNode }) {
  return (
    <>
      <Icon name={icon} className="size-6" aria-hidden />
      <span className="max-w-full truncate">{label}</span>
    </>
  );
}

/** Mobile navigation (below lg): Tổng quan · Phòng · Chốt số · Hoá đơn · Thêm. */
export default function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const routes = useMenuRoutes();
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = routes.filter((route) => route.bottomNav);
  const others = routes.filter((route) => !route.bottomNav);
  const moreActive = others.some(({ path }) => pathname.startsWith(path));

  const renderLink = (route: StayRoute, className: (active: boolean) => string) => (
    <NavLink
      key={route.name}
      to={route.path}
      end={route.exact}
      className={({ isActive }) => className(isActive)}
      onClick={() => setMoreOpen(false)}
    >
      <ItemContent icon={route.icon} label={t(`nav.${route.name}`)} />
    </NavLink>
  );

  return (
    <nav
      aria-label={t('nav.mobile')}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-safe shadow-floating lg:hidden"
      data-testid="bottom-nav"
    >
      <div className="mx-auto flex max-w-xl items-stretch gap-1 px-2 py-1">
        {primary.map((route) =>
          renderLink(route, (active) =>
            cn(itemClass, active ? 'text-accent' : 'text-muted hover:text-ink'),
          ),
        )}
        {others.length > 0 ? (
          <Drawer
            side="bottom"
            open={moreOpen}
            onOpenChange={setMoreOpen}
            title={t('nav.moreTitle')}
            triggerAsChild
            trigger={
              <button
                type="button"
                className={cn(itemClass, moreActive ? 'text-accent' : 'text-muted hover:text-ink')}
              >
                <ItemContent icon="menu" label={t('nav.more')} />
              </button>
            }
          >
            <ul className="grid grid-cols-3 gap-2 pb-safe">
              {others.map((route) => (
                <li key={route.name}>
                  {renderLink(route, (active) =>
                    cn(
                      itemClass,
                      'min-h-20 w-full border border-line text-ui-sm',
                      active ? 'bg-selected text-selected-ink' : 'text-ink hover:bg-hover',
                    ),
                  )}
                </li>
              ))}
            </ul>
          </Drawer>
        ) : null}
      </div>
    </nav>
  );
}
