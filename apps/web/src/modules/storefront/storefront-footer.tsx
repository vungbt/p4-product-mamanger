import { cn } from '@p4/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import BrandLogo from '@/libraries/brand-logo';

type FooterLinkGroup = {
  id: string;
  titleKey: string;
  links: Array<{ labelKey: string; to?: string; href?: string }>;
};

const SOCIAL_LINKS = [
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
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
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
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
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <title>X</title>
        <path d="M3 3h4.2l5 6.8L17.8 3H21l-7.1 8.3L21 21h-4.2l-5.3-7.2L6.2 21H3l7.4-8.7L3 3z" />
      </svg>
    ),
  },
] as const;

function FooterBrand() {
  const { t } = useTranslation();

  return (
    <div className="max-w-md space-y-4">
      <Link to={ROUTES.storefront.shop} className="inline-flex items-center">
        <BrandLogo variant="header-white" height={44} className="hidden sm:block" />
        <BrandLogo variant="mark-white" height={48} className="sm:hidden" />
      </Link>

      <p className="text-14 opacity-90 lg:text-15">{t('storefront.footerTagline')}</p>

      <div className="space-y-2 text-14 lg:text-15">
        <p>
          <span className="font-bold">{t('storefront.footerAddressLabel')}: </span>
          <span className="opacity-90">{t('storefront.footerAddress')}</span>
        </p>
        <p>
          <span className="font-bold">{t('storefront.footerPhoneLabel')}: </span>
          <a href="tel:+84901234567" className="opacity-90 transition-opacity hover:opacity-100">
            {t('storefront.footerPhone')}
          </a>
        </p>
        <p>
          <span className="font-bold">{t('storefront.footerEmailLabel')}: </span>
          <a
            href="mailto:support@p4.demo"
            className="opacity-90 transition-opacity hover:opacity-100"
          >
            support@p4.demo
          </a>
        </p>
      </div>

      <div>
        <p className="mb-3 font-bold">{t('storefront.footerFollow')}</p>
        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.id}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
            >
              {social.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function FooterLinkGroups({
  groups,
  className,
}: {
  groups: FooterLinkGroup[];
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className={cn('grid grid-cols-2 gap-8', className)}>
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-6 text-16 font-bold lg:mb-8 lg:text-18">{t(group.titleKey)}</p>
          <ul className="space-y-3 lg:space-y-4">
            {group.links.map((link) => (
              <li key={link.labelKey} className="text-14 lg:text-15">
                {link.to ? (
                  <Link
                    to={link.to}
                    className="opacity-90 transition-all hover:opacity-100 hover:underline"
                  >
                    {t(link.labelKey)}
                  </Link>
                ) : (
                  <a
                    href={link.href ?? '#'}
                    className="opacity-90 transition-all hover:opacity-100 hover:underline"
                  >
                    {t(link.labelKey)}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FooterMobileAccordion({ groups }: { groups: FooterLinkGroup[] }) {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const open = expandedSection === group.id;
        return (
          <div key={group.id} className="border-b border-white/20 pb-4">
            <button
              type="button"
              onClick={() => setExpandedSection(open ? null : group.id)}
              className="flex w-full items-center justify-between py-2 text-left font-bold"
              aria-expanded={open}
            >
              <span>{t(group.titleKey)}</span>
              <span className="text-18">{open ? '−' : '+'}</span>
            </button>
            <div
              className={cn(
                'overflow-hidden transition-all duration-300',
                open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
              )}
            >
              <ul className="space-y-3 pt-3">
                {group.links.map((link) => (
                  <li key={link.labelKey} className="text-14">
                    {link.to ? (
                      <Link to={link.to} className="opacity-90 hover:opacity-100 hover:underline">
                        {t(link.labelKey)}
                      </Link>
                    ) : (
                      <a
                        href={link.href ?? '#'}
                        className="opacity-90 hover:opacity-100 hover:underline"
                      >
                        {t(link.labelKey)}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StorefrontFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const groups: FooterLinkGroup[] = [
    {
      id: 'shop',
      titleKey: 'storefront.footerShop',
      links: [
        { labelKey: 'menu.shop', to: ROUTES.storefront.shop },
        { labelKey: 'menu.cart', to: ROUTES.storefront.cart },
      ],
    },
    {
      id: 'support',
      titleKey: 'storefront.footerSupport',
      links: [
        { labelKey: 'storefront.footerContact', href: 'mailto:support@p4.demo' },
        { labelKey: 'storefront.footerFaq', href: '#' },
      ],
    },
  ];

  return (
    <footer className="mt-auto bg-primary text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-b border-white/20 py-6 lg:py-8">
          {/* Desktop */}
          <div className="hidden gap-8 lg:grid lg:grid-cols-2">
            <FooterBrand />
            <FooterLinkGroups groups={groups} />
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            <div className="mb-6">
              <FooterBrand />
            </div>
            <FooterMobileAccordion groups={groups} />
          </div>
        </div>

        <div className="py-6 text-14 opacity-70">
          <p>{t('storefront.footerRights', { year })}</p>
        </div>
      </div>
    </footer>
  );
}
