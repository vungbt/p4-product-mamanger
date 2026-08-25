import { type ChangeEvent, type ReactNode, useState } from 'react';
import { RenderIcon } from '../../components/icons';
import { Menu, type MenuEntry } from '../../components/menu';
import { cn } from '../../helpers/utils';

export type SearchInputCategory = {
  label: ReactNode;
  value: string;
};

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string, category?: string) => void;
  placeholder?: string;
  /** Omit = hide the category filter dropdown entirely, leaving just the input + search button. */
  categories?: SearchInputCategory[];
  category?: string;
  onCategoryChange?: (value: string) => void;
  /** Label shown when no category is selected (equivalent to "all"). */
  allLabel?: ReactNode;
  searchLabel?: ReactNode;
  className?: string;
  customClasses?: {
    root?: string;
    category?: string;
    input?: string;
    submit?: string;
  };
};

// Per docs/design/p4-product-manager-design.html: a large pill-shaped search bar (44px) with a
// `primary-border` border + an orange-tinted shadow, made of 3 parts — a category dropdown (reuses `Menu`), a
// transparent input (no border of its own, inherits the outer pill's border), and a solid-primary search button.
export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder,
  categories,
  category,
  onCategoryChange,
  allLabel = 'Tất cả',
  searchLabel = 'Tìm',
  className,
  customClasses,
}: SearchInputProps) {
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const hasCategories = !!categories && categories.length > 0;
  const selectedCategory = categories?.find((c) => c.value === category);

  const submit = () => onSearch?.(value, category);

  return (
    <div
      className={cn(
        'flex h-11 w-full max-w-[560px] items-center gap-2 rounded-full border-[1.5px] border-primary-border bg-neutral-white p-[3px]',
        'shadow-[0_2px_10px_rgba(234,88,12,0.1)]',
        customClasses?.root,
        className,
      )}
    >
      {hasCategories && (
        <Menu
          trigger={
            <button
              type="button"
              className={cn(
                'flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary-background px-3 text-ui-label text-primary-clicked transition-colors hover:bg-primary-hover hover:text-white',
                customClasses?.category,
              )}
              aria-haspopup="menu"
              aria-expanded={categoryMenuOpen}
            >
              {selectedCategory?.label ?? allLabel}
              <RenderIcon
                name="chevron-down"
                strokeWidth={2.4}
                className={cn(
                  '!h-[13px] !w-[13px] transition-transform',
                  categoryMenuOpen && 'rotate-180',
                )}
              />
            </button>
          }
          items={[
            { key: '__all__', label: allLabel, onClick: () => onCategoryChange?.('') },
            ...categories.map<MenuEntry>((c) => ({
              key: c.value,
              label: c.label,
              onClick: () => onCategoryChange?.(c.value),
            })),
          ]}
          onMenuChange={(e) => setCategoryMenuOpen(e.open)}
        />
      )}

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        className={cn(
          'min-w-0 flex-1 border-none bg-transparent text-16 text-neutral-text-primary outline-none placeholder:text-neutral-placeholder',
          // Without a category dropdown before it, the input would sit flush against the pill's left curve
          // (leaving only the container's 3px padding) — extra left padding keeps it off the border.
          !hasCategories && 'pl-4',
          customClasses?.input,
        )}
      />

      <button
        type="button"
        onClick={submit}
        className={cn(
          'flex h-9 shrink-0 items-center gap-[7px] whitespace-nowrap rounded-full bg-primary px-4 text-14 font-bold text-white transition-colors hover:bg-primary-hover active:bg-primary-clicked',
          customClasses?.submit,
        )}
      >
        <RenderIcon name="search" strokeWidth={2.2} className="!h-4 !w-4" />
        {searchLabel}
      </button>
    </div>
  );
}
