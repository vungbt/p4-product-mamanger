type BrandLogoVariant = 'header' | 'header-white' | 'mark' | 'mark-white';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
  height?: number;
};

const SRC: Record<BrandLogoVariant, string> = {
  header: '/brand/logo-header-compact.png',
  'header-white': '/brand/logo-header-compact-white.png',
  mark: '/brand/logo-mark.png',
  'mark-white': '/brand/logo-mark-white.png',
};

// "header"/"mark" sit on a background that flips with the app's light/dark theme (top header,
// login/register cards, admin sidebar), so they should auto-swap to the white logo once dark
// mode is active — otherwise the dark logo text renders on a now-dark background and disappears.
// The swap is pure CSS (Tailwind's `dark:` class variant), not a `useDarkMode()` hook: `.dark` on
// <html> is set by a FOUC-prevention script before React even mounts, so a class-based toggle
// never flashes and needs no re-render. "header-white"/"mark-white" stay forced-white regardless
// of theme, for surfaces that are always dark on their own (e.g. the footer).
const AUTO_DARK_PAIR: Partial<Record<BrandLogoVariant, BrandLogoVariant>> = {
  header: 'header-white',
  mark: 'mark-white',
};

export default function BrandLogo({ variant = 'header', className, height = 36 }: BrandLogoProps) {
  const isMark = variant === 'mark' || variant === 'mark-white';
  const width = isMark ? height : Math.round(height * (300 / 64));
  const imgClassName = 'block h-auto w-auto max-w-full shrink-0 object-contain';

  const darkVariant = AUTO_DARK_PAIR[variant];

  if (darkVariant) {
    return (
      <span className={['shrink-0', className].filter(Boolean).join(' ')}>
        <img
          src={SRC[variant]}
          alt="P4 Store"
          height={height}
          width={width}
          className={`${imgClassName} dark:hidden`}
          style={{ height, width: 'auto' }}
          decoding="async"
        />
        <img
          src={SRC[darkVariant]}
          alt="P4 Store"
          height={height}
          width={width}
          className={`${imgClassName} hidden dark:block`}
          style={{ height, width: 'auto' }}
          decoding="async"
        />
      </span>
    );
  }

  return (
    <img
      src={SRC[variant]}
      alt="P4 Store"
      height={height}
      width={width}
      className={[imgClassName, className].filter(Boolean).join(' ')}
      style={{ height, width: 'auto' }}
      decoding="async"
    />
  );
}
