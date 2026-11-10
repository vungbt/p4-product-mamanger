import type { SelectOption } from '@itclabs/react-ui';
import banks from './vietqr-banks.json';

/**
 * Banks of the VietQR (NAPAS 247) directory, committed as a static list (no runtime fetch).
 * Source: `GET https://api.vietqr.io/v2/banks`, keeping `bin`, `code`, `shortName`, `name`.
 */
export type VietQrBank = { bin: string; code: string; shortName: string; name: string };

export const VIETQR_BANKS: readonly VietQrBank[] = banks;

export function findBank(bin: string | null | undefined): VietQrBank | undefined {
  return bin ? VIETQR_BANKS.find((bank) => bank.bin === bin) : undefined;
}

/** Searchable by short name, code, full name or BIN. */
export const BANK_OPTIONS: readonly SelectOption[] = VIETQR_BANKS.map((bank) => ({
  value: bank.bin,
  label: `${bank.shortName} (${bank.code}) · ${bank.name} · ${bank.bin}`,
}));
