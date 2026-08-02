import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';

export default function StorefrontFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-neutral-border bg-neutral-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-2">
          <p className="text-16 font-semibold text-neutral-black">{t('app.brand')}</p>
          <p className="max-w-sm text-14 text-neutral-text-secondary">
            {t('storefront.footerTagline')}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-13 font-semibold uppercase tracking-wide text-neutral-text-secondary">
            {t('storefront.footerShop')}
          </p>
          <div className="flex flex-col gap-1.5 text-14">
            <Link to={ROUTES.storefront.shop} className="hover:text-primary">
              {t('menu.shop')}
            </Link>
            <Link to={ROUTES.storefront.cart} className="hover:text-primary">
              {t('menu.cart')}
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-13 font-semibold uppercase tracking-wide text-neutral-text-secondary">
            {t('storefront.footerSupport')}
          </p>
          <p className="text-14 text-neutral-text-secondary">{t('storefront.footerContact')}</p>
          <a className="text-14 text-primary hover:underline" href="mailto:support@p4.demo">
            support@p4.demo
          </a>
        </div>
      </div>

      <div className="border-t border-neutral-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-13 text-neutral-text-secondary sm:px-6">
          {t('storefront.footerRights', { year })}
        </p>
      </div>
    </footer>
  );
}
