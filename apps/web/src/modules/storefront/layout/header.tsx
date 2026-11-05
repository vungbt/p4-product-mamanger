import { Button, IconButton, Input, Navbar } from '@itclabs/react-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import BrandLogo from '@/libraries/brand-logo';
import LanguageSwitcher from '@/libraries/language-switcher';
import UserAccountMenu from '@/libraries/user-account-menu';
import RouteConfigs from '@/routing/config.route';
import { buildMenuItems, getPortalMenuRoutes } from '@/routing/route.types';
export default function StorefrontHeader() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const items = buildMenuItems(getPortalMenuRoutes(RouteConfigs, 'storefront-portal')).flatMap(
    (item) =>
      item.type === 'item'
        ? [
            {
              id: item.name,
              label: t(`menu.${item.name}`, { defaultValue: item.label }),
              href: item.path,
              exact: true,
            },
          ]
        : [],
  );
  return (
    <Navbar
      className="flex-none"
      data-testid="storefront-navbar"
      brand={
        <Link to={ROUTES.storefront.home} aria-label={t('app.storefront')}>
          <BrandLogo variant="header" height={36} className="hidden sm:block" />
          <BrandLogo variant="mark" height={36} className="sm:hidden" />
        </Link>
      }
      items={items}
      currentPath={pathname}
      navigationLabel={t('app.storefront')}
      actions={
        <>
          <LanguageSwitcher />
          {isAuthenticated ? (
            <UserAccountMenu />
          ) : (
            <Link to={ROUTES.storefront.login}>
              <Button size="sm">{t('common.login')}</Button>
            </Link>
          )}
        </>
      }
      secondary={
        <search>
          <form
            className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2 sm:px-6"
            onSubmit={(event) => {
              event.preventDefault();
              const q = query.trim();
              navigate(
                q ? `${ROUTES.storefront.shop}?q=${encodeURIComponent(q)}` : ROUTES.storefront.shop,
              );
            }}
          >
            <Input
              type="search"
              icon="search"
              aria-label={t('storefront.searchPlaceholder')}
              placeholder={t('storefront.searchPlaceholder')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              rootClassName="flex-1"
            />
            <IconButton
              type="submit"
              icon="arrowRight"
              variant="ghost"
              label={t('common.search')}
            />
            <Link
              to={ROUTES.storefront.cart}
              className="inline-flex items-center gap-2 rounded-control px-2 py-2 text-control font-medium hover:bg-hover"
            >
              {t('storefront.cart')}
            </Link>
          </form>
        </search>
      }
    />
  );
}
