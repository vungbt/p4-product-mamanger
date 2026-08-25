import type React from 'react';
import { forwardRef, useId, useMemo } from 'react';
import ReactSelect, {
  type ClearIndicatorProps,
  type CSSObjectWithLabel,
  components,
  type DropdownIndicatorProps,
  type GroupBase,
  type MultiValueProps,
  type OptionProps,
  type Props as ReactSelectProps,
  type StylesConfig,
} from 'react-select';
import { getIconSize, getPlaceholderFontSizeVar } from '../../components/common';
import { type IconName, RenderIcon } from '../../components/icons';
import { Tag } from '../../components/tag';
import { cn } from '../../helpers/utils';

export type SelectOption = {
  label: string;
  value: string | number;
  isDisabled?: boolean;
};

export type SelectProps = {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'middle' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';
  variant?: 'solid' | 'outline' | 'subtle' | 'ghost';
  icon?: IconName;
  iconRight?: IconName;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  isClearable?: boolean;
  isSearchable?: boolean;
  isMulti?: boolean;
  customClasses?: {
    root?: string;
    label?: string;
    select?: string;
    icon?: string;
    iconRight?: string;
    helperText?: string;
    error?: string;
    indicatorClassName?: string;
  };
} & Omit<ReactSelectProps<SelectOption, boolean, GroupBase<SelectOption>>, 'size' | 'required'>;

const sizeClasses = {
  small: 'text-14',
  middle: 'text-16',
  large: 'text-16',
};

// Per docs/design/p4-product-manager-design.html (Form controls · Focus) — same formula
// as Input: default `neutral-border` border, focus switches to `border-primary` + a
// `shadow-focus-ring` ring (only neutral gets a ring, other colors just change border color, matching Input).
const colorClasses = {
  primary: {
    solid: 'bg-primary-background border-primary text-primary-base focus-within:border-primary',
    outline: 'bg-transparent border-primary text-primary-base focus-within:border-primary-base',
    subtle:
      'bg-primary-background border-primary-background text-primary-base focus-within:border-primary',
    ghost:
      'text-primary bg-transparent border border-dashed border-primary hover:bg-primary-background',
  },
  secondary: {
    solid:
      'bg-secondary-background border-secondary text-secondary-base focus-within:border-secondary',
    outline:
      'bg-transparent border-secondary text-secondary-base focus-within:border-secondary-base',
    subtle:
      'bg-secondary-background border-secondary-background text-secondary-base focus-within:border-secondary',
    ghost:
      'text-secondary bg-transparent border border-dashed border-secondary hover:bg-secondary-background',
  },
  success: {
    solid: 'bg-success-bg border-success text-success focus-within:border-success-base',
    outline: 'bg-transparent border-success text-success focus-within:border-success-base',
    subtle: 'bg-success-bg border-success-bg text-success focus-within:border-success',
    ghost: 'text-success bg-transparent border border-dashed border-success hover:bg-success-bg',
  },
  error: {
    solid: 'bg-error-bg border-error focus-within:border-error-base',
    outline: 'bg-transparent border-error focus-within:border-error-base',
    subtle: 'bg-error-bg border-error-bg focus-within:border-error',
    ghost: 'bg-transparent border border-dashed border-error hover:bg-error-bg',
  },
  pending: {
    solid: 'bg-pending-bg border-pending text-pending focus-within:border-pending-base',
    outline: 'bg-transparent border-pending text-pending focus-within:border-pending-base',
    subtle: 'bg-pending-bg border-pending-bg text-pending focus-within:border-pending',
    ghost: 'text-pending bg-transparent border border-dashed border-pending hover:bg-pending-bg',
  },
  neutral: {
    solid:
      'bg-neutral-bg border-neutral-border text-neutral-text-primary focus-within:border-primary focus-within:shadow-focus-ring',
    outline:
      'bg-transparent border-neutral-border text-neutral-text-primary focus-within:border-primary focus-within:shadow-focus-ring',
    subtle:
      'bg-neutral-bg border-neutral-bg text-neutral-text-primary focus-within:border-primary focus-within:shadow-focus-ring',
    ghost:
      'text-neutral-text-primary bg-transparent border border-dashed border-neutral-border hover:bg-neutral-bg',
  },
};

const getPaddingClasses = (
  size: 'small' | 'middle' | 'large',
  hasIcon: boolean,
  hasIconRight: boolean,
) => {
  const basePadding = {
    small: hasIcon ? 'pl-8' : 'pl-2',
    middle: hasIcon ? 'pl-10' : 'pl-4',
    large: hasIcon ? 'pl-12' : 'pl-6',
  };

  const rightPadding = {
    small: hasIconRight ? 'pr-8' : 'pr-2',
    middle: hasIconRight ? 'pr-10' : 'pr-2',
    large: hasIconRight ? 'pr-12' : 'pr-4',
  };

  return `${basePadding[size]} ${rightPadding[size]}`;
};

const DropdownIndicator = (
  props: DropdownIndicatorProps<SelectOption, boolean, GroupBase<SelectOption>> & {
    indicatorClassName?: string;
  },
) => {
  return (
    <components.DropdownIndicator {...props}>
      <RenderIcon
        name="chevron-down"
        className={cn(
          'text-neutral-placeholder transition-transform duration-200 !w-5 !h-5',
          props.selectProps.menuIsOpen ? 'rotate-180' : '',
          props.indicatorClassName,
        )}
      />
    </components.DropdownIndicator>
  );
};

const ClearIndicator = (
  props: ClearIndicatorProps<SelectOption, boolean, GroupBase<SelectOption>>,
) => {
  return (
    <components.ClearIndicator {...props}>
      <RenderIcon
        name="x-mark"
        className="text-neutral-placeholder hover:text-error transition-colors duration-200 !w-5 !h-5 cursor-pointer"
      />
    </components.ClearIndicator>
  );
};

function mergeSelectStyles(
  base: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>>,
  overrides?: StylesConfig<SelectOption, boolean, GroupBase<SelectOption>>,
): StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> {
  if (!overrides) return base;
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(overrides) as (keyof typeof overrides)[]) {
    const b = base[key];
    const o = overrides[key];
    if (o === undefined) continue;
    if (b === undefined) {
      result[key as string] = o;
      continue;
    }
    result[key as string] = (provided: CSSObjectWithLabel, state?: unknown) => {
      const fromB =
        typeof b === 'function'
          ? (b as (p: CSSObjectWithLabel, s?: unknown) => CSSObjectWithLabel)(provided, state)
          : { ...provided, ...(b as object) };
      return typeof o === 'function'
        ? (o as (p: CSSObjectWithLabel, s?: unknown) => CSSObjectWithLabel)(fromB, state)
        : { ...fromB, ...(o as object) };
    };
  }
  return result as StylesConfig<SelectOption, boolean, GroupBase<SelectOption>>;
}

export const Select = forwardRef<React.ElementRef<typeof ReactSelect>, SelectProps>(
  (
    {
      className,
      disabled = false,
      loading = false,
      size = 'middle',
      color = 'neutral',
      variant = 'outline',
      icon,
      iconRight,
      error,
      placeholder = 'Select an option...',
      isClearable = false,
      isSearchable = true,
      isMulti = false,
      customClasses,
      id,
      options = [],
      styles: stylesFromProps,
      ...rest
    },
    ref,
  ) => {
    const colorClass = error ? colorClasses.error[variant] : colorClasses[color][variant];
    const reactId = useId();

    const customStyles = useMemo(() => {
      const menuFontSize = size === 'small' ? 'var(--size-14)' : 'var(--size-16)';

      return {
        control: (provided: CSSObjectWithLabel) => ({
          ...provided,
          minHeight: size === 'small' ? '32px' : size === 'large' ? '48px' : '40px',
          border: 'none',
          boxShadow: 'none',
          backgroundColor: 'transparent',
          '&:hover': { border: 'none' },
          '&:focus-within': { boxShadow: 'none' },
        }),
        valueContainer: (provided: CSSObjectWithLabel) => ({ ...provided, padding: 0 }),
        placeholder: (provided: CSSObjectWithLabel) => ({
          ...provided,
          fontSize: getPlaceholderFontSizeVar(size),
          color: 'var(--color-neutral-placeholder)',
        }),
        input: (provided: CSSObjectWithLabel) => ({ ...provided, margin: 0, padding: 0 }),
        indicatorSeparator: () => ({ display: 'none' }) as CSSObjectWithLabel,
        dropdownIndicator: (provided: CSSObjectWithLabel) => ({
          ...provided,
          padding: size === 'small' ? '4px' : size === 'large' ? '12px' : '8px',
        }),
        clearIndicator: (provided: CSSObjectWithLabel) => ({
          ...provided,
          padding: size === 'small' ? '4px' : size === 'large' ? '12px' : '8px',
        }),
        multiValue: (provided: CSSObjectWithLabel) => ({
          ...provided,
          margin: size === 'small' ? '1px' : '2px',
          backgroundColor: 'transparent',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          border: 'none',
        }),
        menuList: (provided: CSSObjectWithLabel) => ({
          ...provided,
          fontSize: menuFontSize,
          // Default text for menu chrome (e.g. loading); options override below.
          color: 'var(--color-neutral-text-primary)',
        }),
        option: (
          provided: CSSObjectWithLabel,
          state: OptionProps<SelectOption, boolean, GroupBase<SelectOption>>,
        ) => {
          const { isSelected, isFocused, isDisabled } = state;
          let color = 'var(--color-neutral-text-primary)';
          if (isDisabled) color = 'var(--color-neutral-disable)';
          else if (isSelected) color = 'var(--color-primary-hover)';

          return {
            ...provided,
            fontSize: menuFontSize,
            backgroundColor: isDisabled
              ? 'transparent'
              : isSelected || isFocused
                ? 'var(--color-primary-bg)'
                : 'transparent',
            color,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            '&:hover': isDisabled ? {} : { backgroundColor: 'var(--color-primary-bg)' },
          };
        },
        menu: (provided: CSSObjectWithLabel) => ({
          ...provided,
          zIndex: 50,
          backgroundColor: 'var(--color-neutral-white)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid var(--color-neutral)',
          borderRadius: '8px',
        }),
        menuPortal: (provided: CSSObjectWithLabel) => ({
          ...provided,
          // Above drawer panel (10000) / modal (9999) when using menuPortalTarget=document.body
          zIndex: 10050,
        }),
      };
    }, [size]);

    const mergedStyles = useMemo(
      () => mergeSelectStyles(customStyles, stylesFromProps),
      [customStyles, stylesFromProps],
    );

    const MultiValue = (props: MultiValueProps<SelectOption, boolean, GroupBase<SelectOption>>) => {
      const { data, removeProps } = props;
      return (
        <div className="mr-1">
          <Tag
            content={data?.label}
            onClose={() => {
              removeProps?.onClick?.({} as React.MouseEvent<HTMLDivElement>);
            }}
          />
        </div>
      );
    };

    return (
      <div className={cn('w-full relative', customClasses?.root)} suppressHydrationWarning>
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
            <RenderIcon
              name={loading ? 'loading' : icon}
              className={cn(getIconSize(size), customClasses?.icon, loading && 'animate-spin')}
            />
          </div>
        )}

        <div
          className={cn(
            'relative',
            getPaddingClasses(size, !!icon, !!iconRight),
            'border rounded-lg transition-all ease-in-out',
            colorClass,
            disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
            className,
            customClasses?.select,
          )}
        >
          <ReactSelect
            {...rest}
            ref={ref as never}
            id={id}
            instanceId={reactId}
            options={options}
            isDisabled={disabled || loading}
            isLoading={loading}
            isClearable={isClearable}
            isSearchable={isSearchable}
            isMulti={isMulti}
            styles={mergedStyles}
            className={sizeClasses[size]}
            placeholder={placeholder}
            components={{
              DropdownIndicator: (
                props: DropdownIndicatorProps<SelectOption, boolean, GroupBase<SelectOption>>,
              ) => (
                <DropdownIndicator
                  {...props}
                  indicatorClassName={customClasses?.indicatorClassName}
                />
              ),
              ClearIndicator,
              MultiValue,
              ...rest.components,
            }}
          />
        </div>

        {iconRight && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
            <RenderIcon
              name={iconRight}
              className={cn(getIconSize(size), customClasses?.iconRight)}
            />
          </div>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
