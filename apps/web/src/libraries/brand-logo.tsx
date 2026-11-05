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

export default function BrandLogo({ variant = 'header', className, height = 36 }: BrandLogoProps) {
  const isMark = variant === 'mark' || variant === 'mark-white';
  const width = isMark ? height : Math.round(height * (300 / 64));
  const imgClassName = 'block h-auto w-auto max-w-full shrink-0 object-contain';

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
