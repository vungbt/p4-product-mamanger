import {
  addDays,
  compareIsoDates,
  daysBetweenInclusive,
  daysInPeriod,
  firstDayOfPeriod,
  lastDayOfPeriod,
  multiplyDivideRoundHalfUp,
  nextPeriod,
  type Period,
  periodOfIsoDate,
  sumVnd,
} from '@stay/shared';
import { BillingError, withBillingErrors } from './errors.js';
import { finalizeInvoice, manualLines, rentLine, serviceLines, utilityLines } from './lines.js';
import { dayRatio } from './ratio.js';
import {
  type DepositAllocation,
  type DepositAllocationInput,
  type DepositAllocationLine,
  type InvoiceLine,
  LINE_DESCRIPTION_KEYS,
  type OutstandingInvoice,
  type OutstandingInvoiceInput,
  type PrepaidLineInput,
  type SettlementInput,
  type SettlementResult,
} from './types.js';
import {
  requireCount,
  requireDate,
  requirePeriod,
  requireRoundingUnit,
  requireVnd,
} from './validate.js';

function refundLine(
  line: PrepaidLineInput,
  index: number,
  moveOutDate: string,
): InvoiceLine | null {
  const path = `prepaidLines[${index}]`;

  if (line.type !== 'rent' && line.type !== 'service') {
    throw new BillingError('INVALID_PREPAID_LINE', `${path}.type must be rent or service`, {
      index,
      type: line.type,
    });
  }

  const period = requirePeriod(line.period, `${path}.period`);
  const coveredFrom = requireDate(line.coveredFrom, `${path}.coveredFrom`);
  const coveredTo = requireDate(line.coveredTo, `${path}.coveredTo`);
  const unitPrice = requireVnd(line.unitPrice, `${path}.unitPrice`, { min: 0 });
  const quantity = requireCount(line.quantity, `${path}.quantity`);

  if (
    compareIsoDates(coveredTo, coveredFrom) < 0 ||
    compareIsoDates(coveredFrom, firstDayOfPeriod(period)) < 0 ||
    compareIsoDates(coveredTo, lastDayOfPeriod(period)) > 0
  ) {
    throw new BillingError(
      'INVALID_PREPAID_LINE',
      `${path} must cover an ordered range inside ${period}`,
      { index, period, coveredFrom, coveredTo },
    );
  }

  const dayAfterMoveOut = addDays(moveOutDate, 1);
  const refundFrom =
    compareIsoDates(dayAfterMoveOut, coveredFrom) > 0 ? dayAfterMoveOut : coveredFrom;
  const unusedDays = daysBetweenInclusive(refundFrom, coveredTo);

  if (unusedDays === 0) {
    return null;
  }

  const denominator = daysInPeriod(period);
  const isRent = line.type === 'rent';

  return {
    type: 'refund',
    serviceId: line.serviceId ?? null,
    description: {
      key: isRent ? LINE_DESCRIPTION_KEYS.refundRent : LINE_DESCRIPTION_KEYS.refundService,
      params: {
        period,
        from: refundFrom,
        to: coveredTo,
        ...(line.name ? { name: line.name } : {}),
      },
    },
    period,
    quantity,
    unit: null,
    unitPrice,
    ratioNum: unusedDays,
    ratioDen: denominator,
    amount: 0 - multiplyDivideRoundHalfUp([unitPrice, quantity, unusedDays], denominator),
    meta: {
      coveredFrom: refundFrom,
      coveredTo,
      ...(line.code ? { serviceCode: line.code } : {}),
      ...(line.sourceInvoiceId ? { sourceInvoiceId: line.sourceInvoiceId } : {}),
    },
  };
}

function outstandingInvoice(invoice: OutstandingInvoiceInput, index: number): OutstandingInvoice {
  const path = `outstandingInvoices[${index}]`;

  if (typeof invoice.invoiceId !== 'string' || invoice.invoiceId === '') {
    throw new BillingError('INVALID_OUTSTANDING_INVOICE', `${path}.invoiceId is required`, {
      index,
    });
  }

  const total = requireVnd(invoice.total, `${path}.total`);
  const paidTotal = requireVnd(invoice.paidTotal, `${path}.paidTotal`, { min: 0 });
  const remaining = total - paidTotal;

  if (remaining <= 0) {
    throw new BillingError('INVALID_OUTSTANDING_INVOICE', `${path} has nothing left to collect`, {
      index,
      invoiceId: invoice.invoiceId,
      total,
      paidTotal,
    });
  }

  return { ...invoice, remaining };
}

/**
 * Rent/service lines of an issued invoice, as `prepaidLines` for `computeSettlement`.
 * Other line types (utilities, surcharges, refunds…) are not prepaid and are skipped.
 */
export function toPrepaidLines(
  lines: readonly InvoiceLine[],
  sourceInvoiceId?: string,
): PrepaidLineInput[] {
  return lines.flatMap((line): PrepaidLineInput[] => {
    if (line.type !== 'rent' && line.type !== 'service') {
      return [];
    }

    const { coveredFrom, coveredTo, serviceCode } = line.meta;

    if (!line.period || !coveredFrom || !coveredTo || line.unitPrice === null) {
      throw new BillingError('INVALID_PREPAID_LINE', 'Prepaid line is missing its coverage', {
        type: line.type,
        serviceId: line.serviceId,
      });
    }

    return [
      {
        type: line.type,
        serviceId: line.serviceId,
        ...(serviceCode ? { code: serviceCode } : {}),
        ...(typeof line.description.params.name === 'string'
          ? { name: line.description.params.name }
          : {}),
        period: line.period,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        coveredFrom,
        coveredTo,
        ...(sourceInvoiceId ? { sourceInvoiceId } : {}),
      },
    ];
  });
}

/**
 * Rent and services for days actually stayed (contract start → D) in periods that no issued
 * invoice covers. A period counts as invoiced when it is in `invoicedPeriods` or has a prepaid
 * rent/service line, so an invoiced month is never charged twice.
 */
function unbilledLines(
  input: SettlementInput,
  startDate: string,
  moveOutDate: string,
): InvoiceLine[] {
  if (!Array.isArray(input.invoicedPeriods)) {
    throw new BillingError(
      'MISSING_INVOICED_PERIODS',
      'invoicedPeriods is required (periods with an issued monthly or move-in invoice)',
    );
  }

  const invoiced = new Set<Period>(
    input.invoicedPeriods.map((period, index) =>
      requirePeriod(period, `invoicedPeriods[${index}]`),
    ),
  );

  for (const [index, line] of (input.prepaidLines ?? []).entries()) {
    invoiced.add(requirePeriod(line.period, `prepaidLines[${index}].period`));
  }

  const lastPeriod = periodOfIsoDate(moveOutDate);
  const lines: InvoiceLine[] = [];

  for (let period = periodOfIsoDate(startDate); ; period = nextPeriod(period)) {
    if (!invoiced.has(period)) {
      const charges = input.charges;

      if (!charges) {
        throw new BillingError(
          'MISSING_CHARGES',
          `Days in ${period} are not invoiced; charges (rent, services, counts) are required`,
          { period },
        );
      }

      const ratio = dayRatio({ startDate, endDate: moveOutDate }, period);

      lines.push(
        rentLine(charges.rent, period, ratio),
        ...serviceLines(charges.services ?? [], charges, period, ratio),
      );
    }

    if (period === lastPeriod) {
      return lines;
    }
  }
}

/**
 * Settlement on move-out day D: rent + services for stayed days of periods not yet invoiced,
 * utilities up to the move-out reading, optional refund of
 * prepaid days after D (`refundUnusedRent`), surcharges, then the deposit offset against the
 * settlement total plus outstanding invoices → owner refunds X or tenant pays Y.
 * Outstanding invoices are listed only; their payments stay on the original invoices.
 */
export function computeSettlement(input: SettlementInput): SettlementResult {
  return withBillingErrors(() => {
    const startDate = requireDate(input.contract.startDate, 'contract.startDate');
    const moveOutDate = requireDate(input.moveOutDate, 'moveOutDate');
    const roundingUnit = requireRoundingUnit(input.roundingUnit);
    const depositHeld = requireVnd(input.depositHeld, 'depositHeld', { min: 0 });

    if (typeof input.refundUnusedRent !== 'boolean') {
      throw new BillingError('INVALID_SETTING', 'refundUnusedRent must be true or false', {
        value: input.refundUnusedRent,
      });
    }

    if (compareIsoDates(moveOutDate, startDate) < 0) {
      throw new BillingError('MOVE_OUT_BEFORE_START', 'moveOutDate is before the contract start', {
        startDate,
        moveOutDate,
      });
    }

    if (input.refundUnusedRent && !Array.isArray(input.prepaidLines)) {
      throw new BillingError(
        'MISSING_PREPAID_LINES',
        'prepaidLines is required when refundUnusedRent is on',
      );
    }

    const period = periodOfIsoDate(moveOutDate);
    const unbilled = unbilledLines(input, startDate, moveOutDate);
    const refunds = input.refundUnusedRent
      ? (input.prepaidLines ?? [])
          .map((line, index) => refundLine(line, index, moveOutDate))
          .filter((line): line is InvoiceLine => line !== null)
      : [];
    const lines = [
      ...unbilled,
      ...utilityLines(input.utilities ?? [], period),
      ...refunds,
      ...manualLines(input.surcharges ?? [], 'surcharges'),
    ];
    const invoice = finalizeInvoice('settlement', period, lines, roundingUnit);
    const outstandingInvoices = (input.outstandingInvoices ?? []).map(outstandingInvoice);
    const outstandingTotal = sumVnd(outstandingInvoices.map((item) => item.remaining));
    const amountDue = invoice.total + outstandingTotal;
    const depositApplied = Math.min(depositHeld, Math.max(0, amountDue));
    const balance = depositHeld - amountDue;

    return {
      ...invoice,
      kind: 'settlement',
      outstandingInvoices,
      outstandingTotal,
      amountDue,
      depositHeld,
      depositApplied,
      depositRefunded: depositHeld - depositApplied,
      ownerRefunds: Math.max(0, balance),
      tenantPays: Math.max(0, -balance),
    };
  });
}

/**
 * Splits the deposit of a settlement over the invoices it pays (rules.md "Trả phòng và thanh
 * lý"): earlier unpaid invoices first, in the given order (oldest first), then the settlement
 * invoice, so payments land on the original invoices and anything still owed stays on the
 * settlement invoice. The rest of the deposit is refunded.
 *
 * A negative settlement total (refunds larger than the charges) is a credit the owner pays out
 * with the deposit refund; it is never paid from the deposit. The net result always equals
 * `computeSettlement`: `ownerRefunds − tenantPays = depositHeld − amountDue`.
 */
export function allocateSettlementDeposit(input: DepositAllocationInput): DepositAllocation {
  return withBillingErrors(() => {
    const depositHeld = requireVnd(input.depositHeld, 'depositHeld', { min: 0 });
    const settlementTotal = requireVnd(input.settlementTotal, 'settlementTotal');
    const outstanding = input.outstandingInvoices.map((invoice, index) => {
      if (typeof invoice.invoiceId !== 'string' || invoice.invoiceId === '') {
        throw new BillingError('INVALID_OUTSTANDING_INVOICE', `outstandingInvoices[${index}]`, {
          index,
        });
      }

      return {
        invoiceId: invoice.invoiceId,
        remaining: requireVnd(invoice.remaining, `outstandingInvoices[${index}].remaining`, {
          min: 1,
        }),
      };
    });
    const targets = [
      ...outstanding,
      ...(settlementTotal > 0 ? [{ invoiceId: null, remaining: settlementTotal }] : []),
    ];
    let left = depositHeld;
    const allocations: DepositAllocationLine[] = [];

    for (const target of targets) {
      const amount = Math.min(left, target.remaining);

      left -= amount;
      allocations.push({
        invoiceId: target.invoiceId,
        amount,
        remaining: target.remaining - amount,
      });
    }

    const depositApplied = depositHeld - left;
    const settlementCredit = Math.max(0, -settlementTotal);
    const remainingDue = sumVnd(allocations.map((line) => line.remaining));
    const balance = left + settlementCredit - remainingDue;

    return {
      allocations,
      depositApplied,
      settlementDepositApplied: allocations.find((line) => line.invoiceId === null)?.amount ?? 0,
      depositRefunded: left,
      settlementCredit,
      remainingDue,
      ownerRefunds: Math.max(0, balance),
      tenantPays: Math.max(0, -balance),
    };
  });
}
