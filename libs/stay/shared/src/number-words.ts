import { StayValueError } from './errors.js';

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
/** Group names by power of 1000; `tỷ` repeats after a billion (nghìn tỷ, triệu tỷ). */
const GROUPS = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

const digit = (value: number) => DIGITS[value] ?? '';

/**
 * Reads 0–999. `full` (any group after the leading one) always reads the hundreds, so
 * `1.005.000` is "một triệu không trăm linh năm nghìn".
 */
function readTriple(value: number, full: boolean): string[] {
  const hundreds = Math.floor(value / 100);
  const tens = Math.floor((value % 100) / 10);
  const units = value % 10;
  const words: string[] = [];

  if (full || hundreds > 0) words.push(digit(hundreds), 'trăm');
  if (tens === 0) {
    if (units > 0 && words.length > 0) words.push('linh');
  } else if (tens === 1) words.push('mười');
  else words.push(digit(tens), 'mươi');

  if (units === 0) return words;
  if (units === 1 && tens >= 2) words.push('mốt');
  else if (units === 5 && tens >= 1) words.push('lăm');
  else words.push(digit(units));
  return words;
}

/**
 * Vietnamese words of a whole number, lower case: `3500000` → "ba triệu năm trăm nghìn".
 * Zero groups are skipped ("một triệu", not "một triệu không nghìn").
 */
export function readVietnameseNumber(value: number): string {
  if (!Number.isSafeInteger(value))
    throw new StayValueError('INVALID_AMOUNT', 'value must be a safe integer', value);
  if (value === 0) return digit(0);
  if (value < 0) return `âm ${readVietnameseNumber(-value)}`;

  const groups: number[] = [];

  for (let rest = value; rest > 0; rest = Math.floor(rest / 1000)) groups.push(rest % 1000);

  const words: string[] = [];

  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index] ?? 0;
    const name = GROUPS[index];

    if (group === 0) continue;
    words.push(...readTriple(group, index < groups.length - 1));
    if (name) words.push(name);
  }
  return words.join(' ');
}

/** Amount of VND in words, capitalised, as printed on contracts: "Ba triệu năm trăm nghìn đồng". */
export function readVndInWords(amount: number): string {
  const words = `${readVietnameseNumber(amount)} đồng`;

  return words.charAt(0).toUpperCase() + words.slice(1);
}
