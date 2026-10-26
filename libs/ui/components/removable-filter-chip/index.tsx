import { cn } from '../../helpers/utils';
import { Button } from '../button';
import { RenderIcon } from '../icons';

export type RemovableFilterChipProps = {
  label: string;
  className?: string;
  onRemove: () => void;
};

export function RemovableFilterChip({ label, onRemove, className }: RemovableFilterChipProps) {
  return (
    <div
      className={cn(
        'flex items-center rounded-full overflow-hidden border border-neutral bg-neutral-bg text-neutral-text-primary font-semibold',
        className,
      )}
    >
      <span className="text-12 px-2 py-1">{label}</span>
      <Button
        variant="ghost"
        className="hover:bg-transparent text-neutral-disable h-5 pl-1 pr-2"
        onClick={onRemove}
      >
        <RenderIcon name="close" className="!w-3.5 !h-3.5" />
      </Button>
    </div>
  );
}
