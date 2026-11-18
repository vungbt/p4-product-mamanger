import { StayValueError } from './errors.js';
import { formatPeriod, type Period, parsePeriod } from './period.js';

export interface InvoiceCodeParts {
  buildingCode: string;
  period: Period;
  sequence: number;
}

const INVOICE_CODE_PATTERN = /^(.+)-(\d{4})(\d{2})-(\d{3})$/;

/** `{building code}-{YYYYMM}-{3-digit sequence}`, e.g. `A-202611-001`. */
export function formatInvoiceCode(buildingCode: string, period: Period, sequence: number): string {
  const { year, month } = parsePeriod(period);

  if (typeof buildingCode !== 'string' || buildingCode.trim() === '') {
    throw new StayValueError('INVALID_INVOICE_CODE', 'Building code is required', buildingCode);
  }

  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999) {
    throw new StayValueError(
      'INVALID_INVOICE_CODE',
      'Invoice sequence must be an integer from 1 to 999 (3 digits)',
      sequence,
    );
  }

  return `${buildingCode}-${year}${String(month).padStart(2, '0')}-${String(sequence).padStart(3, '0')}`;
}

export function parseInvoiceCode(code: string): InvoiceCodeParts {
  const match = typeof code === 'string' ? INVOICE_CODE_PATTERN.exec(code) : null;
  const sequence = Number(match?.[4]);

  if (!match || sequence < 1) {
    throw new StayValueError('INVALID_INVOICE_CODE', `Invalid invoice code "${code}"`, code);
  }

  return {
    buildingCode: match[1] as string,
    period: formatPeriod(Number(match[2]), Number(match[3])),
    sequence,
  };
}
