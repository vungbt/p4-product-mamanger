import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../helpers/utils';
import { useDarkMode } from '../../theme/use-dark-mode';
import { RenderIcon } from '../icons';

export type ThemeToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  className?: string;
};

/** Dark mode toggle button — shared by the Admin & Storefront headers. */
export function ThemeToggle({ className, ...props }: ThemeToggleProps) {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-text-secondary transition-colors hover:bg-primary-background hover:text-primary',
        className,
      )}
      {...props}
    >
      <RenderIcon name={isDark ? 'sun' : 'moon'} className="!h-5 !w-5" />
    </button>
  );
}
