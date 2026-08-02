import { cn, RenderIcon } from '@p4/ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import RouteConfigs from '@/routing/config.route';
import { buildMenuItems, getPortalMenuRoutes, renderMenuItems } from '@/routing/route.types';

type MenuLayoutProps = {
  portalName: 'admin-portal' | 'storefront-portal';
  variant?: 'vertical' | 'horizontal';
  collapsed?: boolean;
  /** soft = smart-connection style (primary tint active); solid = filled primary */
  appearance?: 'soft' | 'solid';
};

function MenuLabel({
  icon,
  label,
  collapsed,
}: {
  icon?: ReactNode;
  label: string;
  collapsed?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', collapsed && 'justify-center')}>
      {icon}
      {!collapsed ? <span>{label}</span> : null}
    </span>
  );
}

function linkClassName(soft: boolean, collapsed: boolean) {
  return ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 rounded-xl px-3 py-3 text-15 font-medium transition-all ease-linear',
      soft
        ? isActive
          ? 'bg-primary-background text-primary'
          : 'text-neutral-text-primary hover:bg-primary-background hover:text-primary'
        : isActive
          ? 'bg-primary text-white'
          : 'text-neutral-text-primary hover:bg-primary-background hover:text-primary',
      collapsed && 'justify-center px-2',
    );
}

export default function MenuLayout({
  portalName,
  variant = 'vertical',
  collapsed = false,
  appearance = 'solid',
}: MenuLayoutProps) {
  const { t } = useTranslation();
  const menuRoutes = getPortalMenuRoutes(RouteConfigs, portalName);
  const items = buildMenuItems(menuRoutes);
  const isVertical = variant === 'vertical';
  const soft = appearance === 'soft';

  const translateLabel = (key: string, fallback: string) =>
    t(`menu.${key}`, { defaultValue: fallback });

  return (
    <nav
      className={cn(
        'flex gap-1',
        isVertical ? 'w-full flex-col' : 'flex-row flex-wrap items-center gap-1',
      )}
    >
      {renderMenuItems(
        items,
        (path, label, key, icon) => (
          <NavLink
            key={key}
            to={path}
            title={collapsed ? translateLabel(key, label) : undefined}
            className={linkClassName(soft, collapsed)}
          >
            <MenuLabel icon={icon} label={translateLabel(key, label)} collapsed={collapsed} />
          </NavLink>
        ),
        (label, key, icon, children) => (
          <details key={key} className="group grid gap-1" open>
            <summary
              className={cn(
                'flex cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-3 text-15 font-medium text-neutral-text-primary transition-all ease-linear hover:bg-primary-background hover:text-primary [&::-webkit-details-marker]:hidden',
                collapsed && 'justify-center px-2',
              )}
            >
              {icon}
              {!collapsed ? (
                <>
                  <span className="flex-1">{translateLabel(key, label)}</span>
                  <RenderIcon
                    name="chevron-down"
                    className="!h-4 !w-4 text-neutral-text-secondary transition-transform group-open:rotate-180"
                  />
                </>
              ) : null}
            </summary>
            <div className={cn('grid gap-1', !collapsed && 'pl-3')}>{children}</div>
          </details>
        ),
      )}
    </nav>
  );
}
