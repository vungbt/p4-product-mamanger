import type React from 'react';
import { forwardRef } from 'react';
import {
  type ClearIndicatorProps,
  type CSSObjectWithLabel,
  components,
  type DropdownIndicatorProps,
  type GroupBase,
  type MultiValueProps,
  type OptionProps,
  type Props as ReactSelectProps,
} from 'react-select';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { cn } from '../../lib/utils';
import { getIconSize, getPlaceholderFontSizeVar } from '../common';
import { type IconName, RenderIcon } from '../icons';
import { Tag } from '../tag';
import type { SelectOption } from './select';

export type SelectAsyncCreatableProps = {
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'middle' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'pending' | 'neutral';
  variant?: 'solid' | 'outline' | 'subtle' | 'ghost';
  icon?: IconName;
  iconRight?: IconName;
  error?: string;
  placeholder?: string;
  isClearable?: boolean;
  isSearchable?: boolean;
  isMulti?: boolean;
  loadOptions: (
    inputValue: string,
    callback: (options: SelectOption[]) => void,
  ) => undefined | Promise<SelectOption[]>;
  onCreateOption: (inputValue: string) => void;
  customClasses?: {
    root?: string;
    label?: string;
    select?: string;
    icon?: string;
    iconRight?: string;
    helperText?: string;
    error?: string;
  };
} & Omit<
  ReactSelectProps<SelectOption, boolean, GroupBase<SelectOption>>,
  'size' | 'required' | 'options'
>;

const sizeClasses = {
  small: 'text-14',
  middle: 'text-14',
  large: 'text-16',
};

const colorClasses = {
  primary: {
    solid:
      'bg-primary-background border-primary text-primary-base focus-within:border-primary focus-within:shadow-primary-background',
    outline:
      'bg-transparent border-primary text-primary-base focus-within:border-primary-base focus-within:shadow-primary-background',
    subtle:
      'bg-primary-background border-primary-background text-primary-base focus-within:border-primary focus-within:shadow-primary-background',
    ghost:
      'text-primary bg-transparent border border-dashed border-primary hover:bg-primary-background focus-within:shadow-none',
  },
  secondary: {
    solid:
      'bg-secondary-background border-secondary text-secondary-base focus-within:border-secondary focus-within:shadow-secondary-background',
    outline:
      'bg-transparent border-secondary text-secondary-base focus-within:border-secondary-base focus-within:shadow-secondary-background',
    subtle:
      'bg-secondary-background border-secondary-background text-secondary-base focus-within:border-secondary focus-within:shadow-secondary-background',
    ghost:
      'text-secondary bg-transparent border border-dashed border-secondary hover:bg-secondary-background focus-within:shadow-none',
  },
  success: {
    solid:
      'bg-success-bg border-success text-success focus-within:border-success-base focus-within:shadow-success-bg',
    outline:
      'bg-transparent border-success text-success focus-within:border-success-base focus-within:shadow-success-bg',
    subtle:
      'bg-success-bg border-success-bg text-success focus-within:border-success focus-within:shadow-success-bg',
    ghost:
      'text-success bg-transparent border border-dashed border-success hover:bg-success-bg focus-within:shadow-none',
  },
  error: {
    solid: 'bg-error-bg border-error focus-within:border-error-base focus-within:shadow-error-bg',
    outline:
      'bg-transparent border-error focus-within:border-error-base focus-within:shadow-error-bg',
    subtle: 'bg-error-bg border-error-bg focus-within:border-error focus-within:shadow-error-bg',
    ghost:
      'bg-transparent border border-dashed border-error hover:bg-error-bg focus-within:shadow-none',
  },
  pending: {
    solid:
      'bg-pending-bg border-pending text-pending focus-within:border-pending-base focus-within:shadow-pending-bg',
    outline:
      'bg-transparent border-pending text-pending focus-within:border-pending-base focus-within:shadow-pending-bg',
    subtle:
      'bg-pending-bg border-pending-bg text-pending focus-within:border-pending focus-within:shadow-pending-bg',
    ghost:
      'text-pending bg-transparent border border-dashed border-pending hover:bg-pending-bg focus-within:shadow-none',
  },
  neutral: {
    solid:
      'bg-neutral-bg border-neutral text-neutral-text-primary focus-within:border-primary-border focus-within:shadow-neutral-bg',
    outline:
      'bg-transparent border-neutral text-neutral-text-primary focus-within:border-primary-border focus-within:shadow-neutral-bg',
    subtle:
      'bg-neutral-bg border-neutral-bg text-neutral-text-primary focus-within:border-neutral focus-within:shadow-neutral-bg',
    ghost:
      'text-neutral-text-primary bg-transparent border border-dashed border-neutral hover:bg-neutral-bg focus-within:shadow-none',
  },
} as const;

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
  props: DropdownIndicatorProps<SelectOption, boolean, GroupBase<SelectOption>>,
) => (
  <components.DropdownIndicator {...props}>
    <RenderIcon
      name="chevron-down"
      className={cn(
        'text-neutral-placeholder transition-transform duration-200 !w-5 !h-5',
        props.selectProps.menuIsOpen ? 'rotate-180' : '',
      )}
    />
  </components.DropdownIndicator>
);

const ClearIndicator = (
  props: ClearIndicatorProps<SelectOption, boolean, GroupBase<SelectOption>>,
) => (
  <components.ClearIndicator {...props}>
    <RenderIcon
      name="x-mark"
      className="text-neutral-placeholder hover:text-error transition-colors duration-200 !w-5 !h-5 cursor-pointer"
    />
  </components.ClearIndicator>
);

export const SelectAsyncCreatable = forwardRef<
  React.ElementRef<typeof AsyncCreatableSelect>,
  SelectAsyncCreatableProps
>(
  (
    {
      className,
      disabled,
      loading,
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
      loadOptions,
      onCreateOption,
      customClasses,
      id,
      ...rest
    },
    ref,
  ) => {
    const colorClass = error ? colorClasses.error[variant] : colorClasses[color][variant];
    const menuFontSize = size === 'large' ? 'var(--size-16)' : 'var(--size-14)';

    const customStyles = {
      control: (provided: CSSObjectWithLabel) => ({
        ...provided,
        minHeight: size === 'small' ? '32px' : size === 'large' ? '48px' : '40px',
        border: 'none',
        boxShadow: 'none',
        backgroundColor: 'transparent',
        '&:hover': { border: 'none' },
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
    };

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
      <div className={cn('w-full relative', customClasses?.root)}>
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
            'border rounded-lg transition-all ease-in-out focus-within:shadow-border',
            colorClass,
            disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
            className,
            customClasses?.select,
          )}
        >
          <AsyncCreatableSelect
            {...rest}
            ref={ref as never}
            id={id}
            instanceId={id}
            defaultOptions
            loadOptions={loadOptions}
            onCreateOption={onCreateOption}
            placeholder={placeholder}
            isDisabled={disabled || loading}
            isLoading={loading}
            isClearable={isClearable}
            isSearchable={isSearchable}
            isMulti={isMulti}
            styles={customStyles}
            className={sizeClasses[size]}
            components={{ DropdownIndicator, ClearIndicator, MultiValue, ...rest.components }}
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

SelectAsyncCreatable.displayName = 'SelectAsyncCreatable';
