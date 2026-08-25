import { Button, cn, Header, IconButton, SearchInput, ThemeToggle } from '@p4/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import BrandLogo from '@/libraries/brand-logo';
import LanguageSwitcher from '@/libraries/language-switcher';
import UserAccountMenu from '@/libraries/user-account-menu';
import RouteConfigs from '@/routing/config.route';
import { buildMenuItems, getPortalMenuRoutes, type MenuItem } from '@/routing/route.types';

const isNavItem = (item: MenuItem): item is Extract<MenuItem, { type: 'item' }> =>
  item.type === 'item';

export default function StorefrontHeader() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');

  const navItems = buildMenuItems(getPortalMenuRoutes(RouteConfigs, 'storefront-portal')).filter(
    isNavItem,
  );

  const translateLabel = (key: string, fallback: string) =>
    t(`menu.${key}`, { defaultValue: fallback });

  const goTo = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const submitSearch = (value: string) => {
    const q = value.trim();
    goTo(q ? `${ROUTES.storefront.shop}?q=${encodeURIComponent(q)}` : ROUTES.storefront.shop);
  };

  return (
    <div className="relative">
      <Header
        logo={
          <Link
            to={ROUTES.storefront.home}
            className="flex shrink-0 items-center rounded-md outline-none focus-visible:shadow-focus-ring"
          >
            <BrandLogo variant="header" height={36} className="hidden sm:block" />
            <BrandLogo variant="mark" height={36} className="sm:hidden" />
          </Link>
        }
        navItems={navItems.map((item) => ({
          key: item.name,
          label: translateLabel(item.name, item.label),
          href: item.path,
          active: location.pathname === item.path,
          onClick: (event) => {
            event.preventDefault();
            navigate(item.path);
          },
        }))}
        search={
          <SearchInput
            value={query}
            onChange={setQuery}
            onSearch={submitSearch}
            placeholder={t('storefront.searchPlaceholder')}
          />
        }
        actions={
          <>
            <Link
              to={ROUTES.storefront.cart}
              aria-label={t('storefront.cart')}
              className="hidden md:inline-flex"
            >
              <IconButton icon="shopping-cart" shape="square" variant="ghost" color="neutral" />
            </Link>

            <ThemeToggle className="hidden md:inline-flex" />

            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {isAuthenticated ? (
              <UserAccountMenu />
            ) : (
              <Link to={ROUTES.storefront.login} className="hidden md:inline-flex">
                <Button type="button" size="small" color="primary">
                  {t('common.login')}
                </Button>
              </Link>
            )}

            <IconButton
              icon={mobileOpen ? 'x-mark' : 'menu'}
              shape="square"
              variant="default"
              color="primary"
              className="md:hidden"
              aria-label={t('common.toggleMenu')}
              onClick={() => setMobileOpen((open) => !open)}
            />
          </>
        }
        customClasses={{
          nav: 'hidden md:flex',
          search: 'hidden md:flex',
        }}
      />

      {mobileOpen ? (
        <div className="absolute left-0 right-0 top-16 z-50 border-t border-neutral-border bg-neutral-white shadow-lg md:hidden">
          <div className="space-y-3 px-4 py-3 sm:px-6">
            <SearchInput
              value={query}
              onChange={setQuery}
              onSearch={submitSearch}
              placeholder={t('storefront.searchPlaceholder')}
              className="w-full"
            />

            <nav className="flex flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'py-2.5 text-14 font-medium text-neutral-text-secondary transition-colors hover:text-primary',
                    location.pathname === item.path && 'text-primary',
                  )}
                >
                  {translateLabel(item.name, item.label)}
                </Link>
              ))}
              <Link
                to={ROUTES.storefront.cart}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-14 font-medium text-neutral-text-secondary hover:text-primary"
              >
                {t('menu.cart')}
              </Link>
            </nav>

            <div className="flex items-center justify-between border-t border-neutral-border pt-3">
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              {!isAuthenticated ? (
                <Link to={ROUTES.storefront.login} onClick={() => setMobileOpen(false)}>
                  <Button type="button" size="small" color="primary">
                    {t('common.login')}
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
