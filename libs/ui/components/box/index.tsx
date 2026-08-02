import type React from 'react';
import { cn } from '../../lib/utils';

export type BoxProps = React.HTMLAttributes<HTMLDivElement>;

export function Box({ className, children, ...rest }: BoxProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-primary-background shadow-sm bg-neutral-white p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
