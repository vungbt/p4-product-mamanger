import {
  type InvoiceKind,
  isFixedServiceKind,
  isMeterKind,
  multiplyDivideRoundHalfUp,
  type Period,
  roundToUnit,
  sumVnd,
  type Vnd,
} from '@stay/shared';
import { BillingError, withBillingErrors } from './errors.js';
import { meterConsumption } from './meter.js';
import type { DayRatio } from './ratio.js';
import {
  type ComputedInvoice,
  type FixedServiceInput,
  type InvoiceLine,
  LINE_DESCRIPTION_KEYS,
  type ManualLineInput,
  type UtilityInput,
} from './types.js';
import { requireCount, requireRoundingUnit, requireVnd } from './validate.js';

function coverage(ratio: DayRatio): { coveredFrom?: string; coveredTo?: string } {
  return ratio.coveredFrom && ratio.coveredTo
    ? { coveredFrom: ratio.coveredFrom, coveredTo: ratio.coveredTo }
    : {};
}

export function rentLine(rent: Vnd, period: Period, ratio: DayRatio): InvoiceLine {
  requireVnd(rent, 'contract.rent', { min: 0 });

  return {
    type: 'rent',
    serviceId: null,
    description: { key: LINE_DESCRIPTION_KEYS.rent, params: { period } },
    period,
    quantity: 1,
    unit: null,
    unitPrice: rent,
    ratioNum: ratio.numerator,
    ratioDen: ratio.denominator,
    amount: multiplyDivideRoundHalfUp([rent, ratio.numerator], ratio.denominator),
    meta: coverage(ratio),
  };
}

export function serviceLines(
  services: readonly FixedServiceInput[],
  counts: { occupantCount: number; vehicleCount: number },
  period: Period,
  ratio: DayRatio,
): InvoiceLine[] {
  const occupantCount = requireCount(counts.occupantCount, 'occupantCount');
  const vehicleCount = requireCount(counts.vehicleCount, 'vehicleCount');

  return services.map((service, index) => {
    if (!isFixedServiceKind(service.kind)) {
      throw new BillingError(
        'INVALID_SERVICE_KIND',
        `services[${index}] must be per_room, per_person or per_vehicle; metered services go in utilities`,
        { index, kind: service.kind },
      );
    }

    const unitPrice = requireVnd(service.unitPrice, `services[${index}].unitPrice`, { min: 0 });
    const quantity =
      service.kind === 'per_person'
        ? occupantCount
        : service.kind === 'per_vehicle'
          ? vehicleCount
          : 1;

    return {
      type: 'service',
      serviceId: service.serviceId ?? null,
      description: {
        key: LINE_DESCRIPTION_KEYS.service,
        params: { name: service.name, code: service.code, period, quantity },
      },
      period,
      quantity,
      unit: service.unit ?? null,
      unitPrice,
      ratioNum: ratio.numerator,
      ratioDen: ratio.denominator,
      amount: multiplyDivideRoundHalfUp([unitPrice, quantity, ratio.numerator], ratio.denominator),
      meta: {
        serviceCode: service.code,
        serviceKind: service.kind,
        ...(service.description ? { serviceDescription: service.description } : {}),
        ...coverage(ratio),
      },
    };
  });
}

export function utilityLines(utilities: readonly UtilityInput[], period: Period): InvoiceLine[] {
  return utilities.map((utility, index) => {
    if (!isMeterKind(utility.kind)) {
      throw new BillingError(
        'INVALID_SERVICE_KIND',
        `utilities[${index}] must be electricity or water`,
        {
          index,
          kind: utility.kind,
        },
      );
    }

    const unitPrice = requireVnd(utility.unitPrice, `utilities[${index}].unitPrice`, { min: 0 });
    let usage: ReturnType<typeof meterConsumption>;

    try {
      usage = meterConsumption(utility.segments);
    } catch (error) {
      if (error instanceof BillingError) {
        throw new BillingError(error.code, `${utility.kind}: ${error.message}`, {
          ...error.details,
          kind: utility.kind,
          utilityIndex: index,
        });
      }

      throw error;
    }

    const first = usage.segments[0] as (typeof usage.segments)[number];
    const last = usage.segments[usage.segments.length - 1] as (typeof usage.segments)[number];

    return {
      type: utility.kind,
      serviceId: utility.serviceId ?? null,
      description: {
        key: LINE_DESCRIPTION_KEYS[utility.kind],
        params: { period, ...(utility.name ? { name: utility.name } : {}) },
      },
      period,
      quantity: usage.consumption,
      unit: utility.unit ?? null,
      unitPrice,
      ratioNum: null,
      ratioDen: null,
      amount: multiplyDivideRoundHalfUp([usage.consumption, unitPrice]),
      meta: {
        ...(utility.code ? { serviceCode: utility.code } : {}),
        serviceKind: utility.kind,
        ...(utility.description ? { serviceDescription: utility.description } : {}),
        startReading: first.startReading,
        endReading: last.endReading,
        segments: usage.segments,
        ...(utility.roomId ? { roomId: utility.roomId } : {}),
        ...(utility.sourceEventId ? { sourceEventId: utility.sourceEventId } : {}),
      },
    };
  });
}

export function manualLines(lines: readonly ManualLineInput[], field: string): InvoiceLine[] {
  return lines.map((line, index) => {
    const path = `${field}[${index}]`;
    const reason = typeof line.reason === 'string' ? line.reason.trim() : '';

    if (reason === '') {
      throw new BillingError('MISSING_REASON', `${path} requires a reason`, { index });
    }

    let amount: Vnd;

    if (line.type === 'surcharge' || line.type === 'discount') {
      const value = requireVnd(line.amount, `${path}.amount`, { min: 1 });

      amount = line.type === 'discount' ? -value : value;
    } else if (line.type === 'adjustment') {
      amount = requireVnd(line.amount, `${path}.amount`);

      if (amount === 0) {
        throw new BillingError('INVALID_AMOUNT', `${path}.amount must not be 0`, { index });
      }

      if (typeof line.referenceInvoiceId !== 'string' || line.referenceInvoiceId === '') {
        throw new BillingError('MISSING_REFERENCE', `${path} must reference the original invoice`, {
          index,
        });
      }
    } else {
      throw new BillingError('INVALID_MANUAL_LINE', `${path} has an unsupported type`, {
        index,
        type: (line as { type?: unknown }).type,
      });
    }

    return {
      type: line.type,
      serviceId: null,
      description: { key: LINE_DESCRIPTION_KEYS[line.type], params: { reason } },
      period: null,
      quantity: 1,
      unit: null,
      unitPrice: amount,
      ratioNum: null,
      ratioDen: null,
      amount,
      meta: {
        reason,
        ...(line.type === 'adjustment' ? { referenceInvoiceId: line.referenceInvoiceId } : {}),
      },
    };
  });
}

export interface InvoiceTotals {
  /** Sum of every line except rounding lines. */
  subtotal: Vnd;
  rounding: Vnd;
  /** Subtotal rounded half-up to `roundingUnit`. */
  total: Vnd;
  /** The "Làm tròn" line to append (`null` when `rounding` is 0). */
  roundingLine: InvoiceLine | null;
}

/**
 * Totals of `lines` (stored snapshot lines included); previous rounding lines are ignored and a
 * new rounding line is returned, so the sum of the lines plus that line equals the total.
 */
export function invoiceTotals(
  lines: readonly Pick<InvoiceLine, 'type' | 'amount'>[],
  roundingUnit: Vnd,
): InvoiceTotals {
  return withBillingErrors(() => {
    const unit = requireRoundingUnit(roundingUnit);
    const subtotal = sumVnd(
      lines.filter((line) => line.type !== 'rounding').map((line) => line.amount),
    );
    const total = roundToUnit(subtotal, unit);
    const rounding = total - subtotal;

    return {
      subtotal,
      rounding,
      total,
      roundingLine:
        rounding === 0
          ? null
          : {
              type: 'rounding',
              serviceId: null,
              description: { key: LINE_DESCRIPTION_KEYS.rounding, params: { roundingUnit: unit } },
              period: null,
              quantity: 1,
              unit: null,
              unitPrice: rounding,
              ratioNum: null,
              ratioDen: null,
              amount: rounding,
              meta: {},
            },
    };
  });
}

/** Adds the rounding line and totals; the sum of `lines` always equals `total`. */
export function finalizeInvoice(
  kind: InvoiceKind,
  period: Period,
  lines: InvoiceLine[],
  roundingUnit: Vnd,
): ComputedInvoice {
  const { subtotal, rounding, total, roundingLine } = invoiceTotals(lines, roundingUnit);

  return {
    kind,
    period,
    lines: roundingLine ? [...lines, roundingLine] : lines,
    subtotal,
    rounding,
    total,
    roundingUnit,
  };
}
