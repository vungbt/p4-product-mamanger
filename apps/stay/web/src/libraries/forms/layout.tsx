import { cn } from '@itclabs/react-ui';
import type { ReactNode } from 'react';

export function FormLayout({ children }: { children: ReactNode }) {
  return <div className="grid min-w-0 gap-5">{children}</div>;
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-4 rounded-panel border border-line bg-surface p-4 sm:p-5">
      <h2 className="text-section font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid min-w-0 gap-4 sm:grid-cols-2', className)}>{children}</div>;
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-2">{children}</div>;
}
