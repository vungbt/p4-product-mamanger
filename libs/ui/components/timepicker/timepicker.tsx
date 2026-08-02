import ReactTimePicker from 'react-time-picker';
import { cn } from '../../lib/utils';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import './timepicker.css';
import { getIconSize } from '../common';
import { type BaseDatePickerProps, colorClasses, sizeClasses } from '../datepicker/common';
import { RenderIcon } from '../icons';

export type TimePickerProps = BaseDatePickerProps & {
  value?: string | null;
  onChange?: (time: string | null) => void;
  locale?: string;
  format?: string;
  minTime?: string;
  maxTime?: string;
  disableClock?: boolean;
};

export function TimePicker({
  value,
  onChange,
  size = 'middle',
  color = 'neutral',
  variant = 'outline',
  icon = 'clock',
  loading,
  error,
  isClearable,
  disabled,
  locale,
  format,
  minTime,
  maxTime,
  disableClock = true,
  className,
  customClasses,
}: TimePickerProps) {
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
        <ReactTimePicker
          value={value ?? null}
          onChange={(val) => onChange?.(val ? String(val) : null)}
          format={format}
          locale={locale}
          minTime={minTime}
          maxTime={maxTime}
          disabled={disabled || loading}
          disableClock={disableClock}
          clearIcon={
            isClearable ? (
              <RenderIcon
                name="x-mark"
                className="!w-3 !h-3 text-neutral-placeholder hover:text-error transition-colors"
              />
            ) : null
          }
          clockIcon={
            <RenderIcon
              name={loading ? 'loading' : (icon ?? 'clock')}
              className={cn(getIconSize(size), customClasses?.icon, loading && 'animate-spin')}
            />
          }
        />
      </div>

      {error && <p className={cn('mt-1 text-error text-14', customClasses?.error)}>{error}</p>}
    </div>
  );
}
