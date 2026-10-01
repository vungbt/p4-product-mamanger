import { format as formatFn, isValid, parseISO } from 'date-fns';

export enum DateFormat {
  DMY = 'dd/MM/yyyy',
}

export function formatCurrency(amount: number, currency: string = 'VND'): string {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return String(amount);
  }
}

/**
 * `formatStr` accepts either a `DateFormat` value (autocomplete) or a free-form `date-fns`
 * pattern (e.g. `'yyyy-MM-dd'`, `'dd/MM/yyyy HH:mm'`...) — typed as `DateFormat | (string & {})`
 * instead of plain `string` so the editor still suggests the existing `DateFormat` values,
 * rather than TS widening the union to `string` and losing autocomplete entirely. Defaults to
 * `DateFormat.DMY` as before, so no existing call site needs to change.
 */
export function formatDate(
  date: string | Date,
  formatStr: DateFormat | (string & {}) = DateFormat.DMY,
): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return String(date);
  return formatFn(parsed, formatStr);
}

export function getInitials(name?: string | null): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
