import type { ReactNode } from 'react';
import { cn } from '../../helpers';

export type GridLayoutProps = {
  columns?: 1 | 2 | 3 | 4 | 5;
  gap?: number;
  children?: ReactNode;
  className?: string;
};

const colMap: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
};

const gapMap: Record<number, string> = {
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  3.5: 'gap-3.5',
  4: 'gap-4',
};

export function GridLayout({ columns = 4, gap = 4, children, className }: GridLayoutProps) {
  return (
    <div
      className={cn(
        'grid w-full',
        colMap[columns] ?? 'grid-cols-4',
        gapMap[gap] ?? 'gap-3.5',
        className,
      )}
    >
      {children}
    </div>
  );
}
