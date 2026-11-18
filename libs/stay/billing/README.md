# @stay/billing

Pure billing formulas of [rules.md](../../../documents/stay/rules.md): no DB, no clock (dates are passed in), integer VND only. The API loads data, calls these functions and stores the returned lines as the `invoice_lines` snapshot.

## Functions

| Function | Result |
| --- | --- |
| `computeMonthlyInvoice(input)` | Period M: rent of M + `per_room`/`per_person`/`per_vehicle` services of M (day-ratio prorated) + electricity/water consumed in M−1 + manual lines |
| `computeMoveInInvoice(input)` | Rent + services from the start date to month end (or contract end), prorated; no utilities, no deposit |
| `computeSettlement(input)` | Rent + services for stayed days in periods not in `invoicedPeriods` (nor in `prepaidLines`), prorated like a monthly invoice from `charges`; utilities to the move-out reading, optional refund of prepaid days after D (`refundUnusedRent`), surcharges; plus outstanding invoices, deposit offset and `ownerRefunds` / `tenantPays` |
| `toPrepaidLines(lines, invoiceId?)` | Rent/service lines of an issued invoice as `prepaidLines` for a settlement |
| `allocateSettlementDeposit(input)` | Splits the deposit over earlier unpaid invoices (oldest first) then the settlement invoice; the rest is refunded. A negative settlement total is a credit, never paid from the deposit. Same net as `computeSettlement` |
| `meterConsumption(segments)` | Total consumption over one or two meter segments (meter replacement) |
| `dayRatio(term, period)` | `days stayed in M / days in M`, counting both start and end day |
| `resolvePrice({ defaultPrice, overrides, on })` | Override with the latest `effectiveFrom ≤ on`, else the default |
| `countActiveOn(registrations, on)` | Occupants/vehicles registered on the issue date (`toDate` inclusive) |

Every invoice result has `lines`, `subtotal`, `rounding`, `total` and `roundingUnit`. Each line carries `type`, `serviceId`, `description` (`{ key, params }` for i18n), `period`, `quantity`, `unit`, `unitPrice`, `ratioNum`/`ratioDen`, `amount` and `meta` (coverage dates, start/end readings and meter segments, reason, referenced invoice). Each line is rounded half-up to whole đồng; the total is rounded to `roundingUnit` (default 1.000đ) and the difference is a `rounding` line, so **the lines always sum to the total**.

## Errors

Invalid input throws `BillingError` with a `code` and `details`. Nothing is clamped or guessed: `NEGATIVE_CONSUMPTION`, `MISSING_READING`, `INVALID_READING`, `NO_METER_SEGMENTS`, `END_BEFORE_START`, `NO_OCCUPANCY_IN_PERIOD`, `MOVE_OUT_BEFORE_START`, `MISSING_REASON`, `MISSING_REFERENCE`, `MISSING_PREPAID_LINES`, `MISSING_INVOICED_PERIODS`, `MISSING_CHARGES`, `INVALID_PREPAID_LINE`, `INVALID_OUTSTANDING_INVOICE`, `DUPLICATE_EFFECTIVE_FROM`, `INVALID_*`…

## Interpretations

- Readings are non-negative integers (fractional readings are rejected).
- Discounts are given as a positive `amount` and stored as a negative line; adjustments are signed and must reference the original invoice.
- The move-out day is a day of stay; a refund covers the days after it.
- Negative amounts (refunds, a negative settlement total) round half away from zero.
- The deposit is not an invoice line: the settlement returns `depositApplied`, `depositRefunded`, `ownerRefunds` and `tenantPays`. Outstanding invoices are listed with `remaining`, not added to the settlement total.
- `computeMonthlyInvoice` applies the formula to whatever period it is given. The API decides whether a contract that received a move-in invoice for M also gets a monthly invoice for M.

Test with `pnpm --filter @stay/billing test` (builds `@stay/shared` and this package, then runs `node --test` on `dist`).
