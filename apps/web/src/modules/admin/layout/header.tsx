import { Avatar, Menu, RenderIcon } from '@p4/ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import useAuth from '@/hooks/use-auth';
import LanguageSwitcher from '@/libraries/language-switcher';
import RouteConfigs from '@/routing/config.route';
import { getPortalMenuRoutes } from '@/routing/route.types';
import { useAdminShell } from './use-admin-shell';

export default function AdminHeader() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const { collapsed, toggleCollapsed } = useAdminShell();

  const title = useMemo(() => {
    const portal = getPortalMenuRoutes(RouteConfigs, 'admin-portal');
    const flat: Array<{ path: string; name: string; label?: string }> = [];

    for (const route of portal) {
      if (route.existSubMenu && route.routes?.length) {
        for (const child of route.routes) {
          flat.push(child);
        }
      } else {
        flat.push(route);
      }
    }

    const match = flat
      .filter((r) => {
        if (r.path.includes(':')) {
          const pattern = new RegExp(`^${r.path.replace(/:[^/]+/g, '[^/]+')}$`);
          return pattern.test(location.pathname);
        }
        return location.pathname === r.path || location.pathname.startsWith(`${r.path}/`);
      })
      .sort((a, b) => b.path.length - a.path.length)[0];

    if (!match) return t('menu.admin-dashboard');
    return t(`menu.${match.name}`, { defaultValue: match.label ?? match.name });
  }, [location.pathname, t]);

  return (
    <header className="sticky top-0 z-[1000] flex min-h-16 w-full items-center justify-between bg-neutral-white px-8 py-3 shadow-border">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-neutral-text-secondary transition-colors hover:bg-primary-background hover:text-primary"
          aria-label={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
        >
          <RenderIcon
            name={collapsed ? 'collapse-right' : 'collapse-left'}
            className="!h-5 !w-5 text-neutral-border"
          />
        </button>
        <h1 className="text-16 font-semibold text-neutral-black">{title}</h1>
      </div>

      <div className="flex w-fit items-center gap-2">
        <LanguageSwitcher />

        <button
          type="button"
          className="relative inline-flex items-center justify-center rounded-lg p-2 text-neutral-text-secondary hover:bg-primary-background hover:text-primary"
          aria-label={t('common.notifications')}
        >
          <RenderIcon name="bell" className="!h-5 !w-5" />
        </button>

        <Menu
          align="end"
          trigger={
            <button
              type="button"
              className="ml-2 flex cursor-pointer items-center gap-2 rounded-lg bg-primary-background px-3 py-2 text-15 transition-colors hover:bg-primary-border/30"
            >
              <Avatar
                name={user?.email}
                src={user?.avatarUrl}
                size="md"
                className="border border-dashed border-primary-border"
              />
              <div className="hidden text-left sm:block">
                <p className="text-14 font-medium leading-tight text-neutral-black">
                  {user?.email ?? t('app.admin')}
                </p>
                <p className="text-12 capitalize leading-tight text-neutral-text-secondary">
                  {user?.role ?? 'admin'}
                </p>
              </div>
              <RenderIcon name="chevron-down" className="!h-4 !w-4 text-neutral-text-secondary" />
            </button>
          }
          items={[
            {
              key: 'email',
              disabled: true,
              label: <span className="text-neutral-text-secondary">{user?.email ?? ''}</span>,
            },
            {
              key: 'logout',
              label: t('common.logout'),
              danger: true,
              onClick: logout,
            },
          ]}
        />
      </div>
    </header>
  );
}
