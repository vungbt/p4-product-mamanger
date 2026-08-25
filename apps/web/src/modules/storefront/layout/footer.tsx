import { Footer, RenderIcon } from '@p4/ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const goTo = (path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(path);
  };

  return (
    <Footer
      className="mt-auto"
      logo={
        <>
          <BrandLogo variant="header-white" height={40} className="hidden sm:block" />
          <BrandLogo variant="mark-white" height={40} className="sm:hidden" />
        </>
      }
      tagline={t('storefront.footerTagline')}
      contacts={[
        {
          key: 'address',
          icon: <RenderIcon name="building-storefront" className="!h-4 !w-4" />,
          label: t('storefront.footerAddressLabel'),
          value: t('storefront.footerAddress'),
        },
        {
          key: 'phone',
          icon: <RenderIcon name="phone" className="!h-4 !w-4" />,
          label: t('storefront.footerPhoneLabel'),
          value: <a href="tel:+84901234567">{t('storefront.footerPhone')}</a>,
        },
        {
          key: 'email',
          icon: <RenderIcon name="envelope" className="!h-4 !w-4" />,
          label: t('storefront.footerEmailLabel'),
          value: <a href="mailto:support@p4.demo">support@p4.demo</a>,
        },
      ]}
      linkGroups={[
        {
          key: 'shop',
          title: t('storefront.footerShop'),
          links: [
            {
              key: 'shop',
              label: t('menu.shop'),
              href: ROUTES.storefront.shop,
              onClick: goTo(ROUTES.storefront.shop),
            },
            {
              key: 'cart',
              label: t('menu.cart'),
              href: ROUTES.storefront.cart,
              onClick: goTo(ROUTES.storefront.cart),
            },
          ],
        },
        {
          key: 'support',
          title: t('storefront.footerSupport'),
          links: [
            {
              key: 'contact',
              label: t('storefront.footerContact'),
              href: 'mailto:support@p4.demo',
            },
            { key: 'faq', label: t('storefront.footerFaq'), href: '#' },
          ],
        },
      ]}
      socialLinks={SOCIAL_LINKS.map((social) => ({
        key: social.id,
        icon: social.icon,
        href: social.href,
        label: social.label,
      }))}
      copyright={t('storefront.footerRights', { year })}
    />
  );
}
