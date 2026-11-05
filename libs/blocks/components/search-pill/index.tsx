import { cn, IconButton, Input } from '@itclabs/react-ui';
import { CloseIcon, SearchIcon } from '@itclabs/react-ui/icons/outline';
import { useTranslation } from 'react-i18next';
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
  placeholder,
  tone = 'default',
}: SearchPillProps) {
  const { t } = useTranslation('blocks');
  const label = placeholder ?? t('searchPill.placeholder');
  return (
    <Input
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={label}
      aria-label={label}
      icon={SearchIcon}
      rootClassName={className}
      classNames={{
        field: cn('rounded-full', tone === 'subtle' && 'bg-canvas border-transparent'),
      }}
      endAddon={
        value && onClear ? (
          <IconButton
            icon={CloseIcon}
            label={t('searchPill.clear')}
            variant="ghost"
            size="sm"
            onClick={onClear}
          />
        ) : undefined
      }
    />
  );
}
