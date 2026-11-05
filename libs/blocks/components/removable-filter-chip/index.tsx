import { Tag } from '@itclabs/react-ui';
export type RemovableFilterChipProps = { label: string; className?: string; onRemove: () => void };
export function RemovableFilterChip({ label, onRemove, className }: RemovableFilterChipProps) {
  return (
    <Tag className={className} onRemove={onRemove}>
      {label}
    </Tag>
  );
}
