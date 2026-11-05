import { cn, Progress, type ProgressTone } from '@itclabs/react-ui';
export type StatusBreakdownListProps = {
  className?: string;
  rows: {
    label: string;
    color: string;
    order: string;
    progress?: number;
    total?: number;
    remaining?: number;
  }[];
};
const tones: Record<string, ProgressTone> = {
  primary: 'brand',
  success: 'success',
  info: 'info',
  pending: 'warning',
  error: 'danger',
};
export function StatusBreakdownList({ className, rows }: StatusBreakdownListProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-4 p-4', className)}>
      {rows.map((row) => {
        const percent =
          row.total && row.total > 0
            ? Math.min(100, Math.max(0, ((row.progress ?? 0) / row.total) * 100))
            : 0;
        const count = Math.max(0, (row.total ?? 0) - (row.remaining ?? row.total ?? 0));
        return (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-ui-sm text-muted">
              <span>{row.label}</span>
              <span>
                {count} {row.order} · {Math.floor(percent)}%
              </span>
            </div>
            <Progress
              value={percent}
              tone={tones[row.color] ?? 'brand'}
              size="sm"
              aria-label={row.label}
            />
          </div>
        );
      })}
    </div>
  );
}
