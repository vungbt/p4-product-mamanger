import type { SelectOption } from '@itclabs/react-ui';
import {
  BILLING_DAY_END_OF_MONTH,
  GRACE_DAYS_MAX,
  READING_DAY_MONTHS,
  ROUNDING_UNITS,
} from '@stay/shared';
import type { TFunction } from 'i18next';
import { BILLING_DAYS, formatVnd } from '@/libraries/format';

/** "Ngày 1" … "Ngày 28", "Cuối tháng" (value = billing day as text). */
export function billingDayLabel(t: TFunction<'settings'>, day: number): string {
  return day === BILLING_DAY_END_OF_MONTH
    ? t('billing.endOfMonth')
    : t('billing.dayOfMonth', { day });
}

export function billingDayOptions(t: TFunction<'settings'>): SelectOption[] {
  return BILLING_DAYS.map((day) => ({ value: String(day), label: billingDayLabel(t, day) }));
}

export function roundingUnitOptions(): SelectOption[] {
  return ROUNDING_UNITS.map((unit) => ({ value: String(unit), label: formatVnd(unit) }));
}

/** "Cuối tháng tiêu thụ" (`same`) / "Đầu tháng sau" (`next`). */
export function readingDayMonthOptions(t: TFunction<'settings'>): SelectOption[] {
  return READING_DAY_MONTHS.map((value) => ({
    value,
    label: t(`billing.readingDayMonths.${value}`),
  }));
}

/** "Không ân hạn", "1 ngày" … "31 ngày" (value = number of days as text). */
export function graceDaysLabel(t: TFunction<'settings'>, days: number): string {
  return days === 0 ? t('billing.graceDaysNone') : t('billing.graceDaysValue', { count: days });
}

export function graceDaysOptions(t: TFunction<'settings'>): SelectOption[] {
  return Array.from({ length: GRACE_DAYS_MAX + 1 }, (_, days) => ({
    value: String(days),
    label: graceDaysLabel(t, days),
  }));
}
