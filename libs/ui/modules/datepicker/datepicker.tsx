import ReactDatePicker from 'react-date-picker';
import { cn } from '../../helpers/utils';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';
import './datepicker.css';
import { getIconSize } from '../../components/common';
import { RenderIcon } from '../../components/icons';
import { type BaseDatePickerProps, colorClasses, sizeClasses } from './common';

export type DatePickerProps = BaseDatePickerProps & {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  locale?: string;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
};

export function DatePicker({
  value,
  onChange,
  size = 'middle',
  color = 'neutral',
  variant = 'outline',
  icon = 'calendar-days',
  loading,
  error,
  isClearable,
  disabled,
  locale,
  format,
  minDate,
  maxDate,
  className,
  customClasses,
}: DatePickerProps) {
  const colorClass = error ? colorClasses.error[variant] : colorClasses[color][variant];

  return (
    <div className={cn('w-full', customClasses?.root)}>
      <div
        className={cn(
          'border rounded-lg transition-all ease-in-out',
          sizeClasses[size],
          colorClass,
          disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className,
          customClasses?.input,
        )}
      >
        <ReactDatePicker
          value={value ?? null}
          onChange={(val) => onChange?.(val instanceof Date ? val : null)}
          format={format}
          locale={locale}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled || loading}
          calendarProps={
            customClasses?.calendar ? { className: customClasses.calendar } : undefined
          }
          clearIcon={
            isClearable ? (
              <RenderIcon
                name="x-mark"
                className="!w-3 !h-3 text-neutral-placeholder hover:text-error transition-colors"
              />
            ) : null
          }
          calendarIcon={
            <RenderIcon
              name={loading ? 'loading' : (icon ?? 'calendar-days')}
              className={cn(
                getIconSize(size),
                'text-neutral-placeholder',
                customClasses?.icon,
                loading && 'animate-spin',
              )}
            />
          }
        />
      </div>

      {error && <p className={cn('mt-1 text-error text-14', customClasses?.error)}>{error}</p>}
    </div>
  );
}
