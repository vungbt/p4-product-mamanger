import type React from 'react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
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

const sizeClasses: Record<Size, string> = {
  small: 'px-2 py-1 text-sm',
  middle: 'px-4 py-2 text-base',
  large: 'px-6 py-3 text-lg',
};

const shapeClasses = {
  default: 'rounded-lg',
  circle: 'rounded-full p-2 w-10 h-10 flex items-center justify-center',
  round: 'rounded-full',
};

const colorClasses = {
  primary: {
    solid: 'bg-primary text-white hover:bg-primary-base',
    outline: 'border border-primary text-primary bg-white hover:bg-primary-background',
    subtle: 'bg-primary-background text-primary-base hover:bg-primary-hover',
    link: 'text-primary bg-transparent hover:underline',
    text: 'text-primary bg-transparent hover:text-primary-clicked',
    ghost:
      'text-primary bg-transparent border border-dashed border-primary hover:bg-primary-background',
  },
  secondary: {
    solid: 'bg-secondary text-white hover:bg-secondary-base',
    outline: 'border border-secondary text-secondary bg-white hover:bg-secondary-background',
    subtle: 'bg-secondary-background text-secondary-base hover:bg-secondary-hover',
    link: 'text-secondary bg-transparent hover:underline',
    text: 'text-secondary bg-transparent hover:text-secondary-clicked',
    ghost:
      'text-secondary bg-transparent border border-dashed border-secondary hover:bg-secondary-background',
  },
  success: {
    solid: 'bg-success text-white hover:bg-success-base',
    outline: 'border border-success text-success bg-white hover:bg-success-bg',
    subtle: 'bg-success-bg text-success hover:bg-success-base',
    link: 'text-success bg-transparent hover:underline',
    text: 'text-success bg-transparent hover:text-success-base',
    ghost: 'text-success bg-transparent border border-dashed border-success hover:bg-success-bg',
  },
  error: {
    solid: 'bg-error text-white hover:bg-error-base',
    outline: 'border border-error text-error bg-white hover:bg-error-bg',
    subtle: 'bg-error-bg text-error hover:bg-error-base',
    link: 'text-error bg-transparent hover:underline',
    text: 'text-error bg-transparent hover:text-error-base',
    ghost: 'text-error bg-transparent border border-dashed border-error hover:bg-error-bg',
  },
  pending: {
    solid: 'bg-pending text-white hover:bg-pending-base',
    outline: 'border border-pending text-pending bg-white hover:bg-pending-bg',
    subtle: 'bg-pending-bg text-pending hover:bg-pending-base',
    link: 'text-pending bg-transparent hover:underline',
    text: 'text-pending bg-transparent hover:text-pending-base',
    ghost: 'text-pending bg-transparent border border-dashed border-pending hover:bg-pending-bg',
  },
  neutral: {
    solid: 'bg-neutral-black text-white hover:bg-neutral-text-primary',
    outline: 'border border-neutral-border text-neutral-text-primary bg-white hover:bg-neutral-bg',
    subtle: 'bg-neutral-bg text-neutral-text-primary hover:bg-neutral-border',
    link: 'text-neutral-text-primary bg-transparent hover:underline',
    text: 'text-neutral-text-primary bg-transparent hover:text-neutral-black',
    ghost:
      'text-neutral-text-primary bg-transparent border border-dashed border-neutral-border hover:bg-neutral-bg',
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
          disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
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
