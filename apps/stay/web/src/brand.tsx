import { cn } from '@itclabs/react-ui';

/**
 * Brand identity of the web. Colours live in `styles/stay-theme.css`; the logo and app icons are
 * in `public/icons` (logo.svg, favicon.svg for small sizes, PNGs for iOS/Android/push).
 */
export const BRAND = {
  name: 'Stay',
  /** Full logo (house, bed and checklist on the teal square), also the large app icons. */
  logo: '/icons/logo.svg',
} as const;

type BrandMarkProps = {
  className?: string;
  /** Decorative next to a visible brand name; otherwise announce the brand. */
  decorative?: boolean;
};

/** Square logo mark; sized by `className` (defaults to 2rem). */
export function BrandMark({ className, decorative = false }: BrandMarkProps) {
  return (
    <img
      src={BRAND.logo}
      alt={decorative ? '' : BRAND.name}
      className={cn('size-8 shrink-0', className)}
      draggable={false}
    />
  );
}

/** Mark and name, used in the sidebar and on the login page. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandMark decorative />
      <span className="text-section font-bold text-ink">{BRAND.name}</span>
    </span>
  );
}

/** Sets the browser theme colour from the theme tokens (call once at startup). Icons are static
 * files in `public/icons` declared in `index.html` and `manifest.webmanifest`. */
export function applyBrandToDocument() {
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-accent')
    .trim();
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (themeColor && accent) themeColor.content = accent;
  document.title = BRAND.name;
}
