import type { ReactNode } from 'react';
import { cn } from '../../helpers/utils';

export type SaleTagProps = {
  content: ReactNode;
  className?: string;
};

export function SaleTag({ content, className }: SaleTagProps) {
  const SALE_COLOR = 'var(--color-error)';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-solid px-2.5 py-[3px] text-[11px] font-bold text-neutral-white',
        className,
      )}
      style={{
        backgroundColor: SALE_COLOR,
        borderColor: SALE_COLOR,
      }}
    >
      {content}
    </span>
  );
}
