# @stay/shared

Enums, types and small helpers shared by the Stay API and web. No React, no DB.

- **Authorization** (`@p4/ability/core`): `stayAbilityKit` with `STAY_ACTIONS` (`read`, `create`, `update`, `delete`, `manage`, `issue`, `void`, `settle`) and `STAY_SUBJECTS`; record attributes `{ buildingId?, contractId? }`. `owner` can do everything; `manager` works inside `{ buildingId: { $in: buildingIds } }` with optional `permissionGroups` (`operations`, `readings`, `payments`, `billing`; empty = read only), without `Settings`, `Member`, `manage`, `void` or `settle`; existing users default to all groups; `tenant` reads its own `Contract`/`Invoice`/`MeterReading` and creates `Maintenance` (`{ contractId: { $in: contractIds } }`). `canAccess` ignores conditional rules, so record-scoped roles never open a whole area. Also `STAY_ROLES`, `STAY_ACCOUNT_STATUSES`, `BUILDING_MEMBER_ROLES`.
- **Account contract**: `StayUser`, `StayMe` (`GET /api/me`), `StayCapabilities` (`GET /api/me/capabilities`), `STAY_CONTRACT_VERSION`.
- **Statuses and kinds** (`as const` arrays + union types): `ROOM_STATUSES`, `CONTRACT_STATUSES`, `INVOICE_STATUSES`, `PAYMENT_STATUSES`, `PAYMENT_METHODS`, `DEPOSIT_STATUSES`, `DEPOSIT_ENTRY_TYPES`, `METER_READING_STATUSES`, `METER_KINDS`, `SERVICE_KINDS`, `FIXED_SERVICE_KINDS`, `INVOICE_KINDS`, `INVOICE_LINE_TYPES`.
- **State machines** from [rules.md](../../../documents/stay/rules.md#trạng-thái): `CONTRACT_TRANSITIONS`, `INVOICE_TRANSITIONS`, `METER_READING_TRANSITIONS`, `canTransition`, and the derived `isInvoiceOverdue(status, dueOn, today)`.
- **Periods** (`YYYY-MM`): `isPeriod`, `parsePeriod`, `formatPeriod`, `addMonths`, `previousPeriod`, `nextPeriod`, `comparePeriods`, `daysInMonth`, `daysInPeriod`, `isLeapYear`.
- **Business dates** (`YYYY-MM-DD`, no time zone): `isIsoDate`, `parseIsoDate`, `addDays`, `compareIsoDates`, `daysBetweenInclusive`, `periodOfIsoDate`, `firstDayOfPeriod`, `lastDayOfPeriod`, and `isoDateInTimeZone` / `periodOfDate` for an instant in `Asia/Ho_Chi_Minh` (`STAY_TIME_ZONE`).
- **Money** (integer VND, never floats): `isVnd`, `assertVnd`, `divideRoundHalfUp`, `multiplyDivideRoundHalfUp` (exact, via `bigint`), `roundToUnit`, `sumVnd`, `DEFAULT_ROUNDING_UNIT` (1.000đ). Half-up rounds halves away from zero (`-2.5 → -3`).
- **Invoice code**: `formatInvoiceCode('A', '2026-11', 1) === 'A-202611-001'`, `parseInvoiceCode`.
- **VietQR**: `buildVietQrPayload({ bin, accountNumber, amount?, content? })` builds the NAPAS EMVCo payload (tag 38 `A000000727` + `QRIBFTTA`, VND, `VN`, purpose in 62/08, CRC-16/CCITT-FALSE in tag 63 via `crc16Ccitt`); `toTransferText` strips diacritics for transfer content.
- **Valibot**: `PeriodSchema`, `IsoDateSchema`, `VndSchema`, `NonNegativeVndSchema`.

Malformed values throw `StayValueError` with a `code` (`INVALID_PERIOD`, `INVALID_DATE`, `INVALID_AMOUNT`, `INVALID_ROUNDING_UNIT`, `AMOUNT_OUT_OF_RANGE`, `INVALID_INVOICE_CODE`, `INVALID_QR_FIELD`).

Build with `pnpm --filter @stay/shared build`; test with `pnpm --filter @stay/shared test` (`node --test` on `dist`).
