import type { IconName } from '../../components/icons';

export type BaseDatePickerProps = {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'middle' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';
  variant?: 'solid' | 'outline' | 'subtle' | 'ghost';
  icon?: IconName;
  error?: string;
  isClearable?: boolean;
  customClasses?: {
    root?: string;
    input?: string;
    icon?: string;
    error?: string;
    calendar?: string;
  };
};

export const sizeClasses = {
  small: 'px-2 py-1 text-14',
  middle: 'min-h-10 px-4 py-2 text-16',
  large: 'px-6 py-3 text-16',
};

// Per docs/design/p4-product-manager-design.html (Form controls · Focus) — same formula
// as Input: default `neutral-border` border, focus switches to `border-primary` + a
// `shadow-focus-ring` ring (only neutral gets a ring, other colors just change border color, matching Input).
// Uses `focus-within:` (not `focus:`) because DatePicker/TimePicker apply this class to the div wrapping
// the real input (the input itself never receives :focus) — DateRangePicker applies it directly to the
// input, so `focus-within:` is still correct there too.
export const colorClasses = {
  primary: {
    solid: 'bg-primary-background border-primary text-primary-base focus-within:border-primary',
    outline: 'bg-transparent border-primary text-primary-base focus-within:border-primary-base',
    subtle:
      'bg-primary-background border-primary-background text-primary-base focus-within:border-primary',
    ghost:
      'text-primary bg-transparent border border-dashed border-primary hover:bg-primary-background',
  },
  secondary: {
    solid:
      'bg-secondary-background border-secondary text-secondary-base focus-within:border-secondary',
    outline:
      'bg-transparent border-secondary text-secondary-base focus-within:border-secondary-base',
    subtle:
      'bg-secondary-background border-secondary-background text-secondary-base focus-within:border-secondary',
    ghost:
      'text-secondary bg-transparent border border-dashed border-secondary hover:bg-secondary-background',
  },
  success: {
    solid: 'bg-success-bg border-success text-success focus-within:border-success-base',
    outline: 'bg-transparent border-success text-success focus-within:border-success-base',
    subtle: 'bg-success-bg border-success-bg text-success focus-within:border-success',
    ghost: 'text-success bg-transparent border border-dashed border-success hover:bg-success-bg',
  },
  error: {
    solid: 'bg-error-bg border-error focus-within:border-error-base',
    outline: 'bg-transparent border-error focus-within:border-error-base',
    subtle: 'bg-error-bg border-error-bg focus-within:border-error',
    ghost: 'bg-transparent border border-dashed border-error hover:bg-error-bg',
  },
  pending: {
    solid: 'bg-pending-bg border-pending text-pending focus-within:border-pending-base',
    outline: 'bg-transparent border-pending text-pending focus-within:border-pending-base',
    subtle: 'bg-pending-bg border-pending-bg text-pending focus-within:border-pending',
    ghost: 'text-pending bg-transparent border border-dashed border-pending hover:bg-pending-bg',
  },
  neutral: {
    solid:
      'bg-neutral-bg border-neutral-border text-neutral-text-primary focus-within:border-primary focus-within:shadow-focus-ring',
    outline:
      'bg-transparent border-neutral-border text-neutral-text-primary focus-within:border-primary focus-within:shadow-focus-ring',
    subtle:
      'bg-neutral-bg border-neutral-bg text-neutral-text-primary focus-within:border-primary focus-within:shadow-focus-ring',
    ghost:
      'text-neutral-text-primary bg-transparent border border-dashed border-neutral-border hover:bg-neutral-bg',
  },
};
