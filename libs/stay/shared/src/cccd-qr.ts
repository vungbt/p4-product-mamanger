import { formatIsoDate, type IsoDate } from './date.js';
import { normalizeIdNumber, type TenantGender } from './tenant.js';

/**
 * Text of the QR code on a Vietnamese chip CCCD / Căn cước card, `|`-separated:
 *
 * `CCCD number|old CMND number|full name|birth date DDMMYYYY|gender|permanent address|issue date DDMMYYYY`
 *
 * The old CMND number may be empty (`001…||NGUYỄN VĂN A|…`) or missing altogether on some cards
 * (6 fields, no issue date when the 6th is an address). Fields after the 7th (newer cards) are
 * ignored. Nothing here is logged or sent anywhere: the result only prefills a form.
 */
export interface CccdQrData {
  /** 12-digit CCCD number. */
  idNumber: string;
  /** Old 9- or 12-digit CMND number, `null` when absent. */
  oldIdNumber: string | null;
  fullName: string | null;
  birthDate: IsoDate | null;
  gender: TenantGender | null;
  permanentAddress: string | null;
  /** Card issue date. */
  issuedAt: IsoDate | null;
}

/** Why a QR text is not a CCCD: `empty`, not the `|` layout, or no valid 12-digit number. */
export type CccdQrError = 'empty' | 'not_cccd' | 'invalid_id_number';

export type CccdQrResult = { ok: true; data: CccdQrData } | { ok: false; error: CccdQrError };

/** Fewest fields of a CCCD QR: number, name, birth date, gender, address, issue date. */
const MIN_FIELDS = 6;
const OLD_ID_PATTERN = /^(\d{9}|\d{12})$/;

/** Collapsed whitespace, NFC (QR encoders differ), `null` when empty. */
function text(value: string | undefined): string | null {
  const cleaned = (value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();

  return cleaned || null;
}

/** `DDMMYYYY` (also `DD/MM/YYYY`, `DD-MM-YYYY`) → `YYYY-MM-DD`, `null` when not a real date. */
export function parseCccdDate(value: string | undefined): IsoDate | null {
  const raw = (value ?? '').trim();
  const match =
    /^(\d{2})(\d{2})(\d{4})$/.exec(raw) ?? /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(raw);

  if (!match) return null;
  try {
    return formatIsoDate(Number(match[3]), Number(match[2]), Number(match[1]));
  } catch {
    return null;
  }
}

/** `Nam` / `Nữ` (any case, with or without diacritics; also `Male`/`Female`/`Khác`). */
export function parseCccdGender(value: string | undefined): TenantGender | null {
  const key = (value ?? '').normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();

  if (key === 'nam' || key === 'male' || key === 'm') return 'male';
  if (key === 'nu' || key === 'female' || key === 'f') return 'female';
  if (key === 'khac' || key === 'other') return 'other';
  return null;
}

/** Parses the QR text of a CCCD card; see `CccdQrData` for the layout. */
export function parseCccdQr(raw: string): CccdQrResult {
  const content = raw.replace(/^﻿/, '').trim();

  if (!content) return { ok: false, error: 'empty' };

  const fields = content.split('|').map((field) => field.trim());

  if (fields.length < MIN_FIELDS) return { ok: false, error: 'not_cccd' };

  const idNumber = normalizeIdNumber(fields[0] ?? '');

  if (!idNumber) return { ok: false, error: 'invalid_id_number' };

  // 7+ fields, or 6 whose 2nd is an old number (or empty): the standard layout, issue date last
  // (missing in the 6-field case). Otherwise 6 fields without the old number.
  const second = fields[1] ?? '';
  const withOldNumber =
    fields.length >= 7 || second === '' || OLD_ID_PATTERN.test(second.replace(/\s/g, ''));
  const [name, birth, gender, address, issued] = withOldNumber
    ? fields.slice(2, 7)
    : fields.slice(1, 6);
  const oldIdNumber = withOldNumber ? second.replace(/\s/g, '') : '';

  return {
    ok: true,
    data: {
      idNumber,
      oldIdNumber: OLD_ID_PATTERN.test(oldIdNumber) ? oldIdNumber : null,
      fullName: text(name),
      birthDate: parseCccdDate(birth),
      gender: parseCccdGender(gender),
      permanentAddress: text(address),
      issuedAt: parseCccdDate(issued),
    },
  };
}
