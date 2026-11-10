import type { SelectOption } from '@itclabs/react-ui';
import { BILLING_DAY_END_OF_MONTH, ROUNDING_UNITS } from '@stay/shared';
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
