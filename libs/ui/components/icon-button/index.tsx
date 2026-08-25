import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../helpers/utils';
import { type IconName, RenderIcon } from '../icons';

type Color = 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';
type Variant = 'solid' | 'outline' | 'subtle' | 'ghost' | 'text' | 'default';
type Shape = 'circle' | 'square';

// Per docs/design/p4-product-manager-design.html (Section A · Button):
// A `subtle` icon-button (e.g. the delete-row button in a Table) always comes with a border {color}-border,
// not a flat borderless background.
// `neutral.outline`/`neutral.subtle` are gray-bordered icon-buttons shared by actions with no business
// color attached (Edit in a table, a notification bell...) — text uses `secondary` (#475569), not
// `neutral-text-primary` (darker than the design), matching the Edit-icon and Notification-bell samples in the design exactly.
const colorClasses: Record<Color, Record<Variant, string>> = {
  primary: {
    solid: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-clicked',
    outline: 'border border-primary text-primary bg-neutral-white hover:bg-primary-background',
    subtle:
      'border border-primary-border bg-primary-background text-primary hover:bg-primary-hover',
    ghost: 'text-primary hover:bg-primary-background',
    text: 'text-primary hover:text-primary-clicked',
    default: 'text-neutral-text-secondary hover:bg-primary-background hover:text-primary',
  },
  secondary: {
    solid: 'bg-secondary text-white hover:bg-secondary-hover active:bg-secondary-clicked',
    outline:
      'border border-secondary text-secondary bg-neutral-white hover:bg-secondary-background',
    subtle:
      'border border-secondary-border bg-secondary-background text-secondary hover:bg-secondary-hover',
    ghost: 'text-secondary hover:bg-secondary-background',
    text: 'text-secondary hover:text-secondary-clicked',
    default: 'text-neutral-text-secondary hover:bg-secondary-background hover:text-secondary',
  },
  success: {
    solid: 'bg-success text-white hover:bg-success-hover active:bg-success-clicked',
    outline: 'border border-success text-success bg-neutral-white hover:bg-success-bg',
    subtle: 'border border-success-border bg-success-bg text-success hover:bg-success-base',
    ghost: 'text-success hover:bg-success-bg',
    text: 'text-success hover:text-success-base',
    default: 'text-neutral-text-secondary hover:bg-success-bg hover:text-success',
  },
  error: {
    solid: 'bg-error text-white hover:bg-error-hover active:bg-error-clicked',
    outline: 'border border-error text-error bg-neutral-white hover:bg-error-bg',
    subtle: 'border border-error-border bg-error-bg text-error hover:bg-error-base',
    ghost: 'text-error hover:bg-error-bg',
    text: 'text-error hover:text-error-base',
    default: 'text-neutral-text-secondary hover:bg-error-bg hover:text-error',
  },
  pending: {
    solid: 'bg-pending text-white hover:bg-pending-hover active:bg-pending-clicked',
    outline: 'border border-pending text-pending bg-neutral-white hover:bg-pending-bg',
    subtle: 'border border-pending-border bg-pending-bg text-pending hover:bg-pending-base',
    ghost: 'text-pending hover:bg-pending-bg',
    text: 'text-pending hover:text-pending-base',
    default: 'text-neutral-text-secondary hover:bg-pending-bg hover:text-pending',
  },
  neutral: {
    solid: 'bg-neutral-black text-white hover:bg-neutral-text-primary',
    outline: 'border border-neutral-border text-secondary bg-neutral-white hover:bg-neutral-bg',
    subtle: 'border border-neutral-border bg-neutral-bg text-secondary hover:bg-neutral-border',
    ghost: 'text-neutral-text-secondary hover:bg-neutral-bg hover:text-neutral-black',
    text: 'text-neutral-text-primary hover:text-neutral-black',
    default: 'text-neutral-text-secondary hover:bg-neutral-bg hover:text-neutral-black',
  },
};

const shapeClasses: Record<Shape, string> = {
  circle: 'rounded-full',
  // Design: action icon-buttons in a table row (Edit/Delete) and icons with a badge (notification bell)
  // are both a square rounded ~8-10px, not a circle — sharing one rounded-lg value for both.
  square: 'rounded-lg',
};

// Per docs/design/p4-product-manager-design.html (Section A · Icon button · badge):
// the count dot (e.g. unread notifications) is anchored to the top-right corner, overlapping the icon-button.
const badgeColorClasses: Record<Color, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  error: 'bg-error',
  pending: 'bg-pending',
  neutral: 'bg-neutral-black',
};

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  color?: Color;
  variant?: Variant;
  shape?: Shape;
  iconClassName?: string;
  /** Number/content shown in the badge dot in the top-right corner. Omit = no badge. */
  badge?: ReactNode;
  /** Badge background color — defaults to `primary` per the design sample (notification bell). */
  badgeColor?: Color;
  badgeClassName?: string;
};

export function IconButton({
  icon,
  color = 'primary',
  variant = 'ghost',
  shape = 'circle',
  className,
  iconClassName,
  badge,
  badgeColor = 'primary',
  badgeClassName,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center border border-transparent box-border transition-colors focus:outline-none',
        shapeClasses[shape],
        colorClasses[color][variant],
        className,
      )}
    >
      <RenderIcon name={icon} className={cn('h-5 w-5', iconClassName)} />
      {badge !== undefined && badge !== null && badge !== false && (
        <span
          className={cn(
            'absolute -top-[5px] -right-[5px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold text-white',
            badgeColorClasses[badgeColor],
            badgeClassName,
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
