import { StayValueError } from './errors.js';

/**
 * VietQR (NAPAS 247) payload: an EMVCo merchant-presented QR string that Vietnamese banking apps
 * scan to pre-fill a transfer to `accountNumber` at the bank `bin`. Pure, no I/O.
 */
export interface VietQrInput {
  /** NAPAS bank identification number (6 digits). */
  bin: string;
  /** Beneficiary account number (letters/digits, at most 19). */
  accountNumber: string;
  /** Integer VND; omitted → the payer types the amount (static QR). */
  amount?: number;
  /** Transfer content (purpose). Diacritics are removed; at most 50 characters are kept. */
  content?: string;
}

/** GUID of the NAPAS VietQR scheme (tag 38, sub-tag 00). */
export const VIETQR_GUID = 'A000000727';
/** Service code "transfer to account" (tag 38, sub-tag 02). */
export const VIETQR_SERVICE_ACCOUNT = 'QRIBFTTA';
const CURRENCY_VND = '704';
const COUNTRY_VN = 'VN';
const MAX_CONTENT_LENGTH = 50;

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) of the UTF-8 bytes of `text`, as 4 hex digits. */
export function crc16Ccitt(text: string): string {
  let crc = 0xffff;

  for (const byte of new TextEncoder().encode(text)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** One EMVCo data object: 2-digit id, 2-digit length, value. */
function tlv(id: string, value: string): string {
  if (value.length > 99) {
    throw new StayValueError(
      'INVALID_QR_FIELD',
      `QR field ${id} is longer than 99 characters`,
      value,
    );
  }

  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/** Upper-case ASCII without Vietnamese diacritics, keeping letters, digits and spaces. */
export function toTransferText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, (letter) => (letter === 'đ' ? 'd' : 'D'))
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/** Builds the VietQR payload string (ending with the CRC of tag 63). */
export function buildVietQrPayload({ bin, accountNumber, amount, content }: VietQrInput): string {
  if (!/^\d{6}$/.test(bin)) {
    throw new StayValueError('INVALID_QR_FIELD', 'bin must be 6 digits', bin);
  }
  if (!/^[0-9A-Za-z]{1,19}$/.test(accountNumber)) {
    throw new StayValueError(
      'INVALID_QR_FIELD',
      'accountNumber must be 1–19 letters or digits',
      accountNumber,
    );
  }
  if (amount !== undefined && (!Number.isSafeInteger(amount) || amount <= 0)) {
    throw new StayValueError('INVALID_QR_FIELD', 'amount must be a positive integer VND', amount);
  }

  const beneficiary = tlv('00', bin) + tlv('01', accountNumber);
  const merchant =
    tlv('00', VIETQR_GUID) + tlv('01', beneficiary) + tlv('02', VIETQR_SERVICE_ACCOUNT);
  const purpose = content ? toTransferText(content).slice(0, MAX_CONTENT_LENGTH).trim() : '';

  const body = [
    tlv('00', '01'),
    // 12 = dynamic (amount fixed by the QR), 11 = static.
    tlv('01', amount === undefined ? '11' : '12'),
    tlv('38', merchant),
    tlv('53', CURRENCY_VND),
    amount === undefined ? '' : tlv('54', String(amount)),
    tlv('58', COUNTRY_VN),
    purpose ? tlv('62', tlv('08', purpose)) : '',
  ].join('');
  const unsigned = `${body}6304`;

  return unsigned + crc16Ccitt(unsigned);
}
