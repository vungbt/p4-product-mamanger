import { Sidebar, type SidebarEntry } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import BrandLogo from '@/libraries/brand-logo';
import UserAccountMenu from '@/libraries/user-account-menu';
import RouteConfigs from '@/routing/config.route';
import { getPortalMenuRoutes, type IRoute } from '@/routing/route.types';
export default function AdminSidebar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const toItems = (routes: IRoute[]): SidebarEntry[] =>
    routes
      .filter((route) => !route.hideInMenu)
      .map((route) => {
        const base = {
          id: route.name,
          label: t(`menu.${route.name}`, { defaultValue: route.label ?? route.name }),
          icon: route.iconName,
          exact: route.exact,
        };
        if (route.existSubMenu && route.routes?.length)
          return { ...base, type: 'submenu', items: toItems(route.routes) };
        return { ...base, href: route.path };
      });
  return (
    <Sidebar
      data-testid="admin-sidebar"
      itemVariant="bar"
      header={{
        logo: <BrandLogo variant="mark-white" height={36} />,
        title: t('app.admin'),
        subtitle: t('app.adminSubtitle'),
        href: ROUTES.admin.dashboard,
      }}
      items={[
        {
          id: 'main',
          type: 'group',
          label: t('common.navigation'),
          items: toItems(getPortalMenuRoutes(RouteConfigs, 'admin-portal')),
        },
      ]}
      currentPath={pathname}
      navigationLabel={t('app.admin')}
      footer={<UserAccountMenu portal="admin" placement="sidebar" />}
    />
  );
}
