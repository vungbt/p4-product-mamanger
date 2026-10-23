import { cn } from '../../helpers';
import { Button } from '../button';
import { RenderIcon } from '../icons';
import { Input } from '../input';

export type SearchPillProps = {
  value?: string;
  placeholder?: string;
  tone?: 'default' | 'subtle';
  onChange?: (value: string) => void;
  onClear?: () => void;
  className?: string;
};

export function SearchPill({
  value = '',
  onChange,
  onClear,
  className,
  placeholder = 'Tìm kiếm theo tên sản phẩm...',
  tone = 'default',
}: SearchPillProps) {
  const hasValue = Boolean(value);
  const toneClasses: Record<'default' | 'subtle', string> = {
    default: 'bg-neutral-white border-neutral-border',
    subtle: 'bg-neutral-bg border-transparent',
  };
  return (
    <div
      className={cn(
        'border rounded-full overflow-hidden h-10 w-full',
        toneClasses[tone],
        className,
      )}
    >
      <div className="px-3.5 flex items-center justify-between">
        <RenderIcon
          name="search"
          className={cn(
            'w-4 h-4 flex-shrink-0 transition-colors',
            hasValue ? 'text-neutral-text-secondary' : 'text-neutral-placeholder',
          )}
        />
        <Input
          variant="ghost"
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder || 'Tìm kiếm theo sản phẩm...'}
          className="overflow-hidden border-none hover:bg-transparent"
        />
        {hasValue && onClear && (
          <Button
            variant="ghost"
            type="button"
            onClick={onClear}
            className="flex-shrink-0 flex items-center justify-center text-neutral-placeholder hover:bg-transparent bg-transparent border-none"
          >
            <RenderIcon name="close" className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
