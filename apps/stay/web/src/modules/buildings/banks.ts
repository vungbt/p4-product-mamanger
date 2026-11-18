import type { SelectOption } from '@itclabs/react-ui';
import { findVietQrBank, VIETQR_BANKS, type VietQrBank } from '@stay/shared';

export type { VietQrBank };
export { VIETQR_BANKS };

/** The VietQR directory lives in `@stay/shared` so the API can name the bank of a BIN too. */
export const findBank = findVietQrBank;

/** Searchable by short name, code, full name or BIN. */
export const BANK_OPTIONS: readonly SelectOption[] = VIETQR_BANKS.map((bank) => ({
  value: bank.bin,
  label: `${bank.shortName} (${bank.code}) · ${bank.name} · ${bank.bin}`,
}));
