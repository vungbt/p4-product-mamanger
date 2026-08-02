export type Size = 'small' | 'middle' | 'large';

/** Placeholder font size matches typed text (`sizeClasses`) so it is not smaller than 13px. */
export const getPlaceholderTextClass = (size: Size): string => {
  if (size === 'large') return 'placeholder:text-16';
  return 'placeholder:text-14';
};

/** Same scale as {@link getPlaceholderTextClass}, for react-select `styles.placeholder`. */
export const getPlaceholderFontSizeVar = (size: Size): string => {
  if (size === 'large') return 'var(--size-16)';
  return 'var(--size-14)';
};

export const getIconSize = (size: Size): string => {
  switch (size) {
    case 'small':
      return '!h-4 !w-4';
    case 'large':
      return '!h-6 !w-6';
    default:
      return '!h-5 !w-5';
  }
};
