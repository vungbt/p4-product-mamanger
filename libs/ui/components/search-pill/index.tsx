import { cn } from '../../helpers';
import { RenderIcon } from '../icons';

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
        'flex items-center rounded-full border px-3.5 h-10 gap-2',
        toneClasses[tone],
        className,
      )}
    >
      <RenderIcon
        name="search"
        className={cn(
          'w-4 h-4 flex-shrink-0 transition-colors',
          hasValue ? 'text-neutral-text-secondary' : 'text-neutral-placeholder',
        )}
      />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder || 'Tìm kiếm theo sản phẩm...'}
        className={cn(
          'flex-1 text-13 bg-transparent border-none outline-none',
          hasValue && 'font-semibold text-neutral-text-primary',
        )}
      />
      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="flex-shrink-0 flex items-center justify-center text-neutral-placeholder hover:bg-transparent bg-transparent border-none "
        >
          <RenderIcon name="close" className="!h-4 !w-4" />
        </button>
      )}
    </div>
  );
}
