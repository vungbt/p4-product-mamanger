import { Button, cn, RenderIcon } from '@p4/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import BrandLogo from '@/libraries/brand-logo';
import LanguageSwitcher from '@/libraries/language-switcher';
import UserAccountMenu from '@/libraries/user-account-menu';
import RouteConfigs from '@/routing/config.route';
import { buildMenuItems, getPortalMenuRoutes } from '@/routing/route.types';

function StoreSearch({ className, onSubmit }: { className?: string; onSubmit?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  return (
    <form
      className={cn('relative', className)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(
          q ? `${ROUTES.storefront.shop}?q=${encodeURIComponent(q)}` : ROUTES.storefront.shop,
        );
        onSubmit?.();
      }}
    >
      <div className="flex items-center gap-2 rounded-full border border-neutral-border bg-neutral-bg px-4 py-2 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
        <RenderIcon name="search" className="!h-4 !w-4 shrink-0 text-neutral-placeholder" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('storefront.searchPlaceholder')}
          className="w-full bg-transparent text-14 outline-none placeholder:text-neutral-placeholder"
        />
      </div>
    </form>
  );
}

export default function StorefrontHeader() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = buildMenuItems(getPortalMenuRoutes(RouteConfigs, 'storefront-portal')).filter(
    (item) => item.type === 'item',
  );

  const translateLabel = (key: string, fallback: string) =>
    t(`menu.${key}`, { defaultValue: fallback });

  const linkClass =
    'flex items-center gap-1 px-2 py-2 text-14 font-semibold text-neutral-text-secondary transition-colors hover:text-primary';

  return (
    <header className="relative sticky top-0 z-50 border-b border-neutral-border bg-neutral-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link to={ROUTES.storefront.shop} className="flex shrink-0 items-center">
          <BrandLogo variant="header" height={36} className="hidden sm:block" />
          <BrandLogo variant="mark" height={36} className="sm:hidden" />
        </Link>

        {navItems.length > 0 ? (
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {navItems.map((item) =>
              item.type === 'item' ? (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => cn(linkClass, isActive && 'text-primary')}
                >
                  {translateLabel(item.name, item.label)}
                </NavLink>
              ) : null,
            )}
          </nav>
        ) : (
          <div className="hidden flex-1 md:block" />
        )}

        <div className="flex-1 md:hidden" />

        <StoreSearch className="hidden w-56 shrink-0 md:block lg:w-72" />

        <div className="flex items-center gap-2">
          <Link
            to={ROUTES.storefront.cart}
            className="hidden items-center justify-center rounded-lg p-2 text-neutral-text-secondary transition-colors hover:bg-primary-background hover:text-primary md:inline-flex"
            aria-label={t('storefront.cart')}
          >
            <RenderIcon name="briefcase" className="!h-5 !w-5" />
          </Link>

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

          <button
            type="button"
            className="rounded-md p-2 text-neutral-text-secondary hover:bg-primary-background md:hidden"
            aria-label={t('common.toggleMenu')}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <RenderIcon name={mobileOpen ? 'x-mark' : 'menu'} className="!h-5 !w-5" />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="absolute left-0 right-0 top-16 z-50 border-t border-neutral-border bg-neutral-white shadow-lg md:hidden">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-3 sm:px-6">
            <StoreSearch className="w-full" onSubmit={() => setMobileOpen(false)} />

            <nav className="flex flex-col">
              {navItems.map((item) =>
                item.type === 'item' ? (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'py-2.5 text-14 font-medium text-neutral-text-secondary transition-colors hover:text-primary',
                        isActive && 'text-primary',
                      )
                    }
                  >
                    {translateLabel(item.name, item.label)}
                  </NavLink>
                ) : null,
              )}
              <Link
                to={ROUTES.storefront.cart}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-14 font-medium text-neutral-text-secondary hover:text-primary"
              >
                {t('menu.cart')}
              </Link>
            </nav>

            <div className="flex items-center justify-between border-t border-neutral-border pt-3">
              <LanguageSwitcher />
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
    </header>
  );
}
