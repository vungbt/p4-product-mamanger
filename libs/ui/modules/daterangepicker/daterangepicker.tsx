import { format, isValid } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import Calendar from 'react-calendar';
import { cn } from '../../helpers/utils';
import 'react-calendar/dist/Calendar.css';
import '../datepicker/calendar.css';
import './daterangepicker.css';
import { getIconSize } from '../../components/common';
import { RenderIcon } from '../../components/icons';
import { type BaseDatePickerProps, colorClasses, sizeClasses } from '../datepicker/common';

export type DateRange = [Date | null, Date | null];

export type DateRangePickerProps = BaseDatePickerProps & {
  value?: DateRange | null;
  onChange?: (range: DateRange | null) => void;
  locale?: string;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
  separator?: string;
  placeholder?: string;
};

export function DateRangePicker({
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
  dateFormat = 'yyyy-MM-dd',
  minDate,
  maxDate,
  separator = ' → ',
  placeholder = 'Select date range...',
  className,
  customClasses,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colorClass = error ? colorClasses.error[variant] : colorClasses[color][variant];

  const formatDate = (date: Date | null) => {
    if (!date || !isValid(date)) return '';
    return format(date, dateFormat);
  };

  const displayValue = (() => {
    if (!value || (!value[0] && !value[1])) return '';
    const start = formatDate(value[0]);
    const end = formatDate(value[1]);
    if (start && end) return `${start}${separator}${end}`;
    if (start) return `${start}${separator}...`;
    return '';
  })();

  const calendarValue = (() => {
    if (!value) return null;
    const [start, end] = value;
    if (start && end) return [start, end] as [Date, Date];
    if (start) return start;
    return null;
  })();

  return (
    <div ref={rootRef} className={cn('w-full relative', customClasses?.root)}>
      <input
        readOnly
        disabled={disabled || loading}
        value={displayValue}
        placeholder={placeholder}
        onClick={() => {
          if (!(disabled || loading)) setOpen(true);
        }}
        onFocus={() => {
          if (!(disabled || loading)) setOpen(true);
        }}
        className={cn(
          'w-full border rounded-lg transition-all ease-in-out outline-none pr-10',
          sizeClasses[size],
          colorClass,
          disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          className,
          customClasses?.input,
        )}
      />

      {isClearable && value && (value[0] || value[1]) ? (
        <button
          type="button"
          onClick={() => {
            onChange?.(null);
            setOpen(false);
          }}
          className="absolute top-1/2 right-10 transform -translate-y-1/2 text-neutral-placeholder hover:text-error transition-all ease-linear"
          aria-label="Clear date range"
        >
          <RenderIcon name="x-mark" className="!w-3 !h-3" />
        </button>
      ) : null}

      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 pointer-events-none text-neutral-placeholder">
        <RenderIcon
          className={cn(getIconSize(size), customClasses?.icon, loading && 'animate-spin')}
          name={loading ? 'loading' : (icon ?? 'calendar-days')}
        />
      </div>

      {error && <p className={cn('mt-1 text-error text-14', customClasses?.error)}>{error}</p>}

      {open && !(disabled || loading) ? (
        <div
          role="none"
          className={cn(
            'absolute z-50 mt-2 bg-neutral-white rounded-lg shadow-lg',
            customClasses?.calendar,
          )}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Calendar
            selectRange
            value={calendarValue}
            onChange={(val) => {
              if (Array.isArray(val)) {
                const range: DateRange = [val[0] ?? null, val[1] ?? null];
                onChange?.(range);
                if (val[0] && val[1]) setOpen(false);
              }
            }}
            minDate={minDate}
            maxDate={maxDate}
            locale={locale}
          />
        </div>
      ) : null}
    </div>
  );
}
