import { cn } from '@itclabs/react-ui';

/**
 * Brand identity of the web. Colours live in `styles/stay-theme.css`; the mark, favicon and
 * browser theme colour read `--color-accent` from there, so rebranding touches these two files.
 */
export const BRAND = {
  name: 'Stay',
  /** Temporary logo: this letter in a rounded square of the accent colour. */
  mark: 'S',
} as const;

const MARK_VIEWBOX = '0 0 32 32';

function markPaths(fill: string) {
  return `<rect width="32" height="32" rx="8" fill="${fill}"/><text x="16" y="22.5" text-anchor="middle" font-family="'Be Vietnam Pro',system-ui,sans-serif" font-size="19" font-weight="700" fill="#fff">${BRAND.mark}</text>`;
}

type BrandMarkProps = {
  className?: string;
  /** Decorative next to a visible brand name; otherwise announce the brand. */
  decorative?: boolean;
};

/** Square logo mark; sized by `className` (defaults to 2rem). */
export function BrandMark({ className, decorative = false }: BrandMarkProps) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={cn('size-8 shrink-0', className)}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : BRAND.name}
    >
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <text
        x="16"
        y="22.5"
        textAnchor="middle"
        fontSize="19"
        fontWeight="700"
        className="fill-on-brand font-sans"
      >
        {BRAND.mark}
      </text>
    </svg>
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

/** Sets the favicon and browser theme colour from the theme tokens (call once at startup). */
export function applyBrandToDocument() {
  const accent =
    getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() ||
    'currentColor';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}">${markPaths(accent)}</svg>`;
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (icon) icon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  if (themeColor) themeColor.content = accent;
  document.title = BRAND.name;
}
