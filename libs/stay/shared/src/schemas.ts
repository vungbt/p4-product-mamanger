import * as v from 'valibot';
import { isIsoDate } from './date.js';
import { isPeriod } from './period.js';

export const PeriodSchema = v.pipe(
  v.string(),
  v.check((value: string) => isPeriod(value), 'Kỳ phải có dạng YYYY-MM'),
);

export const IsoDateSchema = v.pipe(
  v.string(),
  v.check((value: string) => isIsoDate(value), 'Ngày phải có dạng YYYY-MM-DD hợp lệ'),
);

/** Integer VND (may be negative, e.g. a discount or adjustment). */
export const VndSchema = v.pipe(v.number(), v.safeInteger('Số tiền phải là số nguyên'));

export const NonNegativeVndSchema = v.pipe(VndSchema, v.minValue(0, 'Số tiền không được âm'));
