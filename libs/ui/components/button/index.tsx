import type React from 'react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../helpers/utils';
import { getIconSize, type Size } from '../common';
import { type IconName, RenderIcon } from '../icons';

export type ButtonProps = {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: Size;
  shape?: 'default' | 'circle' | 'round';
  danger?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';
  variant?: 'solid' | 'outline' | 'subtle' | 'link' | 'text' | 'ghost';
  icon?: IconName;
  iconRight?: IconName;
  customClasses?: {
    root?: string;
    icon?: string;
    iconRight?: string;
  };
} & ButtonHTMLAttributes<HTMLButtonElement>;

// Per docs/design/p4-product-manager-design.html (Section A · Button): sm 32/md 40/lg 44,
// font ui-label/ui-body-strong (fontWeight/lineHeight already in the token) — lg uses text-14 + font-bold because
// the design doesn't define a dedicated size token for 14/700.
const sizeClasses: Record<Size, string> = {
  small: 'h-8 px-3 text-ui-label',
  middle: 'h-10 px-4 text-ui-body-strong',
  large: 'h-11 px-5 text-14 font-bold',
};

const shapeClasses = {
  default: 'rounded-lg',
  circle: 'rounded-full p-2 w-10 h-10 flex items-center justify-center',
  round: 'rounded-full',
};

// Per docs/design/p4-product-manager-design.html (Section A · Button):
// - `subtle` always has a border {color}-border (not a flat borderless background).
// - `ghost` is a plain text button: transparent background, NO border (not even dashed) — different
//   from the "dashed" style of Input/Textarea. Neutral ghost uses secondary gray text (text-secondary) per the design.
const colorClasses = {
  primary: {
    solid: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-clicked',
    outline: 'border border-primary text-primary bg-neutral-white hover:bg-primary-background',
    subtle:
      'border border-primary-border bg-primary-background text-primary-clicked hover:bg-primary-hover',
    link: 'text-primary bg-transparent hover:underline',
    text: 'text-primary bg-transparent hover:text-primary-clicked',
    ghost: 'text-primary bg-transparent hover:bg-primary-background',
  },
  secondary: {
    solid: 'bg-secondary text-white hover:bg-secondary-hover active:bg-secondary-clicked',
    outline:
      'border border-secondary text-secondary bg-neutral-white hover:bg-secondary-background',
    subtle:
      'border border-secondary-border bg-secondary-background text-secondary-base hover:bg-secondary-hover',
    link: 'text-secondary bg-transparent hover:underline',
    text: 'text-secondary bg-transparent hover:text-secondary-clicked',
    ghost: 'text-secondary bg-transparent hover:bg-secondary-background',
  },
  success: {
    solid: 'bg-success text-white hover:bg-success-hover active:bg-success-clicked',
    outline: 'border border-success text-success bg-neutral-white hover:bg-success-bg',
    subtle: 'border border-success-border bg-success-bg text-success hover:bg-success-base',
    link: 'text-success bg-transparent hover:underline',
    text: 'text-success bg-transparent hover:text-success-base',
    ghost: 'text-success bg-transparent hover:bg-success-bg',
  },
  error: {
    solid: 'bg-error text-white hover:bg-error-hover active:bg-error-clicked',
    outline: 'border border-error text-error bg-neutral-white hover:bg-error-bg',
    subtle: 'border border-error-border bg-error-bg text-error hover:bg-error-base',
    link: 'text-error bg-transparent hover:underline',
    text: 'text-error bg-transparent hover:text-error-base',
    ghost: 'text-error bg-transparent hover:bg-error-bg',
  },
  pending: {
    solid: 'bg-pending text-white hover:bg-pending-hover active:bg-pending-clicked',
    outline: 'border border-pending text-pending bg-neutral-white hover:bg-pending-bg',
    subtle: 'border border-pending-border bg-pending-bg text-pending hover:bg-pending-base',
    link: 'text-pending bg-transparent hover:underline',
    text: 'text-pending bg-transparent hover:text-pending-base',
    ghost: 'text-pending bg-transparent hover:bg-pending-bg',
  },
  neutral: {
    solid: 'bg-neutral-black text-white hover:bg-neutral-text-primary',
    outline:
      'border border-neutral-border text-neutral-text-primary bg-neutral-white hover:bg-neutral-bg',
    subtle:
      'border border-neutral-border bg-neutral-bg text-neutral-text-primary hover:bg-neutral-border',
    link: 'text-neutral-text-primary bg-transparent hover:underline',
    text: 'text-neutral-text-primary bg-transparent hover:text-neutral-black',
    ghost:
      'text-neutral-text-secondary bg-transparent hover:bg-neutral-bg hover:text-neutral-black',
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      loading,
      size = 'middle',
      shape = 'default',
      danger,
      color = 'primary',
      variant = 'solid',
      icon,
      iconRight,
      customClasses,
      ...rest
    },
    ref,
  ) => {
    const colorClass = danger ? colorClasses.error[variant] : colorClasses[color][variant];
    const iconSizeClass = getIconSize(size);

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center border border-transparent box-border transition-colors focus:outline-none',
          sizeClasses[size],
          shapeClasses[shape],
          colorClass,
          // Design: a `disabled` button fades to opacity 0.4 (not 0.5); a `loading` button (e.g. "Saving…")
          // keeps its normal full/solid color, only interaction is locked — it must not fade like disabled.
          disabled && 'opacity-40 cursor-not-allowed',
          loading && !disabled && 'cursor-not-allowed',
          className,
          customClasses?.root,
        )}
        disabled={disabled || loading}
        {...rest}
      >
        <RenderIcon
          name={loading ? 'loading' : icon}
          className={cn(
            iconSizeClass,
            children ? 'mr-2' : '',
            loading && 'animate-spin',
            customClasses?.icon,
          )}
        />
        {children}
        <RenderIcon
          name={iconRight}
          className={cn(iconSizeClass, children ? 'ml-2' : '', customClasses?.iconRight)}
        />
      </button>
    );
  },
);

Button.displayName = 'Button';
