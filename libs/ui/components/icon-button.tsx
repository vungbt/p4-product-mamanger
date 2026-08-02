import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/utils';
import { type IconName, RenderIcon } from './icons';

type Color = 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';
type Variant = 'solid' | 'outline' | 'subtle' | 'ghost' | 'text' | 'default';

const colorClasses: Record<Color, Record<Variant, string>> = {
  primary: {
    solid: 'bg-primary text-white hover:bg-primary-base',
    outline: 'border border-primary text-primary bg-white hover:bg-primary-background',
    subtle: 'bg-primary-background text-primary hover:bg-primary-hover',
    ghost: 'text-primary hover:bg-primary-background',
    text: 'text-primary hover:text-primary-clicked',
    default: 'text-neutral-text-secondary hover:bg-primary-background hover:text-primary',
  },
  secondary: {
    solid: 'bg-secondary text-white hover:bg-secondary-base',
    outline: 'border border-secondary text-secondary bg-white hover:bg-secondary-background',
    subtle: 'bg-secondary-background text-secondary hover:bg-secondary-hover',
    ghost: 'text-secondary hover:bg-secondary-background',
    text: 'text-secondary hover:text-secondary-clicked',
    default: 'text-neutral-text-secondary hover:bg-secondary-background hover:text-secondary',
  },
  success: {
    solid: 'bg-success text-white hover:bg-success-base',
    outline: 'border border-success text-success bg-white hover:bg-success-bg',
    subtle: 'bg-success-bg text-success hover:bg-success-base',
    ghost: 'text-success hover:bg-success-bg',
    text: 'text-success hover:text-success-base',
    default: 'text-neutral-text-secondary hover:bg-success-bg hover:text-success',
  },
  error: {
    solid: 'bg-error text-white hover:bg-error-base',
    outline: 'border border-error text-error bg-white hover:bg-error-bg',
    subtle: 'bg-error-bg text-error hover:bg-error-base',
    ghost: 'text-error hover:bg-error-bg',
    text: 'text-error hover:text-error-base',
    default: 'text-neutral-text-secondary hover:bg-error-bg hover:text-error',
  },
  pending: {
    solid: 'bg-pending text-white hover:bg-pending-base',
    outline: 'border border-pending text-pending bg-white hover:bg-pending-bg',
    subtle: 'bg-pending-bg text-pending hover:bg-pending-base',
    ghost: 'text-pending hover:bg-pending-bg',
    text: 'text-pending hover:text-pending-base',
    default: 'text-neutral-text-secondary hover:bg-pending-bg hover:text-pending',
  },
  neutral: {
    solid: 'bg-neutral-black text-white hover:bg-neutral-text-primary',
    outline: 'border border-neutral-border text-neutral-text-primary bg-white hover:bg-neutral',
    subtle: 'bg-neutral-bg text-neutral-text-primary hover:bg-neutral-border',
    ghost: 'text-neutral-text-secondary hover:bg-neutral-bg hover:text-neutral-black',
    text: 'text-neutral-text-primary hover:text-neutral-black',
    default: 'text-neutral-text-secondary hover:bg-neutral-bg hover:text-neutral-black',
  },
};

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  color?: Color;
  variant?: Variant;
  iconClassName?: string;
};

export function IconButton({
  icon,
  color = 'primary',
  variant = 'ghost',
  className,
  iconClassName,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border border-transparent box-border transition-colors focus:outline-none',
        colorClasses[color][variant],
        className,
      )}
    >
      <RenderIcon name={icon} className={cn('h-5 w-5', iconClassName)} />
    </button>
  );
}
