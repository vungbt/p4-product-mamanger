import { MonthPicker } from '@itclabs/react-ui';
import type { ReactNode } from 'react';

export type PeriodPickerProps = {
  /** Billing period `YYYY-MM`, or `''` when none is chosen. */
  value: string;
  onChange: (value: string) => void;
  label: ReactNode;
  /** Accessible name when the visible label is not plain text. */
  'aria-label'?: string;
  /** Earliest / latest selectable period (`YYYY-MM`). */
  min?: string;
  max?: string;
  /** Trigger text while no period is chosen. */
  placeholder?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Offer "Xoá" (empty period) — only for optional filters; reports `''`. */
  clearable?: boolean;
  className?: string;
  'data-testid'?: string;
};

/** Any 4-digit year is a valid period (`isPeriod`); the kit would otherwise stop at 1900–2100. */
const PERIOD_MIN = '1000-01';
const PERIOD_MAX = '9999-12';

/**
 * Every billing-period (month) control of the app: the kit `MonthPicker` (`YYYY-MM`). The trigger
 * is a button named by `label`, and its text is the period as `MM/YYYY`.
 */
export function PeriodPicker({
  value,
  onChange,
  className,
  clearable = false,
  min = PERIOD_MIN,
  max = PERIOD_MAX,
  ...props
}: PeriodPickerProps) {
  return (
    <MonthPicker
      {...props}
      value={value || null}
      min={min}
      max={max}
      clearable={clearable}
      rootClassName={className}
      onValueChange={(next) => onChange(next ?? '')}
    />
  );
}
