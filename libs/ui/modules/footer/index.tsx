import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';
import { UiLink } from '../../components/link-image-provider';
import { cn } from '../../helpers/utils';

export type FooterContactItem = {
  key?: string | number;
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
};

export type FooterLinkItem = {
  key?: string | number;
  label: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export type FooterLinkGroup = {
  key?: string | number;
  title: ReactNode;
  links: FooterLinkItem[];
};

export type FooterBadge = {
  key?: string | number;
  label: ReactNode;
};

export type FooterSocialLink = {
  key?: string | number;
  icon: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  label?: string;
};

export type FooterBottomLink = {
  key?: string | number;
  label: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export type FooterProps = {
  /** Logo/brand — like `Header`, always received from the outside, not hardcoded to one project's brand. */
  logo: ReactNode;
  tagline?: ReactNode;
  contacts?: FooterContactItem[];
  linkGroups?: FooterLinkGroup[];
  paymentBadges?: FooterBadge[];
  socialLinks?: FooterSocialLink[];
  copyright?: ReactNode;
  bottomLinks?: FooterBottomLink[];
  className?: string;
  customClasses?: {
    root?: string;
    grid?: string;
    brand?: string;
    bottomBar?: string;
    copyrightBar?: string;
  };
};

// Per docs/design/p4-product-manager-design.html: footer has a dark gradient background, 3 stacked blocks —
// (1) brand+contact grid / link groups, (2) payment + social bar, (3) copyright +
// policy links. Grid column count scales with the number of `linkGroups` passed in (the first column is
// always wider for the brand block, 1.35fr : 1fr ratio matching the design).
// NOTE: this footer is intentionally ALWAYS dark, independent of the app's light/dark mode — so its
// background and foreground colors below use fixed literal hex values rather than the semantic
// --color-neutral-* design tokens (those flip meaning between light/dark mode and would break
// contrast, or even invert the gradient to white, if reused here).
export function Footer({
  logo,
  tagline,
  contacts,
  linkGroups,
  paymentBadges,
  socialLinks,
  copyright,
  bottomLinks,
  className,
  customClasses,
}: FooterProps) {
  const hasContacts = !!contacts?.length;
  const hasLinkGroups = !!linkGroups?.length;
  const hasPayment = !!paymentBadges?.length;
  const hasSocial = !!socialLinks?.length;
  const hasBottomLinks = !!bottomLinks?.length;

  return (
    <footer
      className={cn(customClasses?.root, className)}
      style={{
        // Fixed literal stops (not theme tokens): this footer is always-dark by design
        // regardless of light/dark mode, but --color-neutral-text-primary/--color-neutral-black
        // flip to near-white in dark mode, which used to invert this gradient to white.
        background: 'linear-gradient(135deg, #24344d 0%, #1e293b 48%, #0f172a 100%)',
      }}
    >
      <div
        className={cn(
          'grid grid-cols-1 gap-10 px-10 pb-[30px] pt-[38px] lg:[grid-template-columns:var(--footer-cols)]',
          customClasses?.grid,
        )}
        style={
          {
            '--footer-cols': `1.35fr repeat(${Math.max(linkGroups?.length ?? 0, 1)}, 1fr)`,
          } as CSSProperties
        }
      >
        <div className={customClasses?.brand}>
          <div className="flex items-center gap-2.5">{logo}</div>

          {tagline && (
            <div className="mt-3 max-w-[280px] text-14 leading-[1.65] text-neutral-placeholder">
              {tagline}
            </div>
          )}

          {hasContacts && (
            <div className="mt-[18px] flex flex-col gap-[11px]">
              {contacts.map((item, index) => (
                <div key={item.key ?? index} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] text-[#fdba74]">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-12 font-bold uppercase tracking-[0.06em] text-[#94a3b8]">
                      {item.label}
                    </div>
                    <div className="mt-0.5 text-14 font-bold text-[#e2e8f0]">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasLinkGroups &&
          linkGroups.map((group, groupIndex) => (
            <div key={group.key ?? groupIndex}>
              <div className="mb-3.5 text-12 font-bold uppercase tracking-[0.06em] text-[#fdba74]">
                {group.title}
              </div>
              <div className="flex flex-col gap-2.5">
                {group.links.map((link, linkIndex) => (
                  <UiLink
                    key={link.key ?? linkIndex}
                    href={link.href ?? '#'}
                    onClick={link.onClick}
                    className="text-14 text-[#94a3b8] no-underline transition-colors hover:text-white"
                  >
                    {link.label}
                  </UiLink>
                ))}
              </div>
            </div>
          ))}
      </div>

      {(hasPayment || hasSocial) && (
        <div
          className={cn(
            'flex items-center justify-between gap-6 border-t border-[rgba(255,255,255,0.1)] px-10 py-[18px]',
            customClasses?.bottomBar,
          )}
        >
          {hasPayment ? (
            <div className="flex items-center gap-2.5">
              <span className="text-12 font-bold uppercase tracking-[0.06em] text-[#94a3b8]">
                Thanh toán
              </span>
              <div className="flex gap-[7px]">
                {paymentBadges.map((badge, index) => (
                  <div
                    key={badge.key ?? index}
                    className="flex h-[26px] items-center rounded-md border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.07)] px-2.5 text-12 font-extrabold tracking-[0.02em] text-[#cbd5e1]"
                  >
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <span />
          )}

          {hasSocial && (
            <div className="flex items-center gap-2.5">
              <span className="text-12 font-bold uppercase tracking-[0.06em] text-[#94a3b8]">
                Theo dõi
              </span>
              <div className="flex gap-2">
                {socialLinks.map((social, index) => (
                  // Always a real <a>, not UiLink: external (target="_blank"/rel), so it must never go
                  // through the app's client-side router — react-router's <Link> isn't for off-site URLs.
                  <a
                    key={social.key ?? index}
                    href={social.href ?? '#'}
                    onClick={social.onClick}
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.07)] text-[#e2e8f0] transition-colors hover:bg-[rgba(255,255,255,0.14)]"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(copyright || hasBottomLinks) && (
        <div
          className={cn(
            'flex items-center justify-between gap-6 px-10 py-3.5',
            customClasses?.copyrightBar,
          )}
          style={{ background: 'rgba(0,0,0,0.22)' }}
        >
          {copyright && <div className="text-13 text-[#94a3b8]">{copyright}</div>}
          {hasBottomLinks && (
            <div className="flex gap-[18px] text-13 text-[#94a3b8]">
              {bottomLinks.map((link, index) => (
                <UiLink
                  key={link.key ?? index}
                  href={link.href ?? '#'}
                  onClick={link.onClick}
                  className="no-underline transition-colors hover:text-white"
                >
                  {link.label}
                </UiLink>
              ))}
            </div>
          )}
        </div>
      )}
    </footer>
  );
}
