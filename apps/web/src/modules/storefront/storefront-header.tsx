import { Button, RenderIcon } from '@p4/ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useAuth from '@/hooks/use-auth';
import LanguageSwitcher from '@/libraries/language-switcher';
import MenuLayout from '@/libraries/menu/menu.layout';

export default function StorefrontHeader() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-border bg-neutral-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to={ROUTES.storefront.shop} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <RenderIcon name="package" style={{ width: 20, height: 20 }} />
          </span>
          <span className="text-16 font-semibold text-neutral-black">{t('app.brand')}</span>
        </Link>

        <nav className="hidden md:block">
          <MenuLayout portalName="storefront-portal" variant="horizontal" />
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to={ROUTES.storefront.cart}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-14 text-neutral-text-primary hover:bg-primary-background hover:text-primary"
            aria-label={t('storefront.cart')}
          >
            <RenderIcon name="briefcase" />
            <span className="hidden sm:inline">{t('menu.cart')}</span>
          </Link>

          <LanguageSwitcher />

          {isAuthenticated ? (
            <>
              <span className="hidden max-w-[140px] truncate text-13 text-neutral-text-secondary lg:inline">
                {user?.email}
              </span>
              <Button type="button" size="small" variant="outline" color="neutral" onClick={logout}>
                {t('common.logout')}
              </Button>
            </>
          ) : (
            <Link to={ROUTES.storefront.login}>
              <Button type="button" size="small" color="primary">
                {t('common.login')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-border px-4 py-2 md:hidden">
        <MenuLayout portalName="storefront-portal" variant="horizontal" />
      </div>
    </header>
  );
}
