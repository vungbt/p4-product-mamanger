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

export function formatDate(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return String(date);
  return formatFn(parsed, DateFormat.DMY);
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
