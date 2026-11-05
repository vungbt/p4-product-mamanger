import { Icon } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import BrandLogo from '@/libraries/brand-logo';

const SOCIAL_LINKS = [
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <title>Facebook</title>
        <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6l.4-3H14V9z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <title>Instagram</title>
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.5 6.8a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
      </svg>
    ),
  },
  {
    id: 'x',
    label: 'X',
    href: 'https://x.com',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <title>X</title>
        <path d="M3 3h4.2l5 6.8L17.8 3H21l-7.1 8.3L21 21h-4.2l-5.3-7.2L6.2 21H3l7.4-8.7L3 3z" />
      </svg>
    ),
  },
] as const;

export default function StorefrontFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-line bg-surface text-ink">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo variant="header" height={40} />
          <p className="mt-4 text-control text-muted">{t('storefront.footerTagline')}</p>
        </div>
        <address className="space-y-3 text-control not-italic">
          <p className="flex items-start gap-2">
            <Icon name="store" className="mt-1 shrink-0" />
            <span>
              <strong className="block">{t('storefront.footerAddressLabel')}</strong>
              {t('storefront.footerAddress')}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <Icon name="phone" />
            <a href="tel:+84901234567">{t('storefront.footerPhone')}</a>
          </p>
          <p className="flex items-center gap-2">
            <Icon name="mail" />
            <a href="mailto:support@p4.demo">support@p4.demo</a>
          </p>
        </address>
        <nav aria-label={t('storefront.footerShop')} className="space-y-3 text-control">
          <h2 className="font-semibold">{t('storefront.footerShop')}</h2>
          <Link className="block hover:text-accent" to={ROUTES.storefront.shop}>
            {t('menu.shop')}
          </Link>
          <Link className="block hover:text-accent" to={ROUTES.storefront.cart}>
            {t('menu.cart')}
          </Link>
        </nav>
        <div className="space-y-3 text-control">
          <h2 className="font-semibold">{t('storefront.footerSupport')}</h2>
          <a className="block hover:text-accent" href="mailto:support@p4.demo">
            {t('storefront.footerContact')}
          </a>
          <a className="block hover:text-accent" href="mailto:support@p4.demo?subject=FAQ">
            {t('storefront.footerFaq')}
          </a>
          <div className="flex gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.id}
                href={social.href}
                aria-label={social.label}
                className="rounded-control p-2 hover:bg-hover"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
      <p className="border-t border-line px-6 py-4 text-center text-xs text-muted">
        {t('storefront.footerRights', { year })}
      </p>
    </footer>
  );
}
