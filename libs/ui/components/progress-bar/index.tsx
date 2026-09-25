import { cn } from '../../helpers/utils';

export type ProgressBarProps = {
  currentValue: number;
  total: number;
  className?: string;
};

export function ProgressBar({ currentValue, total, className }: ProgressBarProps) {
  const soldPercent = total > 0 ? (currentValue / total) * 100 : 0;
  return (
    <div className={cn('w-full h-2 rounded-full bg-neutral-border overflow-hidden', className)}>
      <div className="h-full bg-primary-base rounded-l-full" style={{ width: `${soldPercent}%` }} />
    </div>
  );
}
