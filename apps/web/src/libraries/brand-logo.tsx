type BrandLogoProps = {
  variant?: 'header' | 'header-white' | 'mark' | 'mark-white';
  className?: string;
  height?: number;
};

const SRC: Record<NonNullable<BrandLogoProps['variant']>, string> = {
  header: '/brand/logo-header-compact.png',
  'header-white': '/brand/logo-header-compact-white.png',
  mark: '/brand/logo-mark.png',
  'mark-white': '/brand/logo-mark-white.png',
};

export default function BrandLogo({ variant = 'header', className, height = 36 }: BrandLogoProps) {
  const src = SRC[variant];
  const isMark = variant === 'mark' || variant === 'mark-white';

  return (
    <img
      src={src}
      alt="P4 Store"
      height={height}
      width={isMark ? height : Math.round(height * (300 / 64))}
      className={['block h-auto w-auto max-w-full shrink-0 object-contain', className]
        .filter(Boolean)
        .join(' ')}
      style={{ height, width: 'auto' }}
      decoding="async"
    />
  );
}
