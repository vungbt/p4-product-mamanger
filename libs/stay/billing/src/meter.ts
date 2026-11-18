import { BillingError } from './errors.js';
import type { MeterSegment, MeterSegmentSnapshot } from './types.js';

export interface MeterConsumption {
  consumption: number;
  segments: MeterSegmentSnapshot[];
}

function requireReading(value: unknown, segmentIndex: number, field: string): number {
  if (value === null || value === undefined) {
    throw new BillingError('MISSING_READING', `Segment ${segmentIndex} has no ${field}`, {
      segmentIndex,
      field,
    });
  }

  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new BillingError(
      'INVALID_READING',
      `Segment ${segmentIndex} ${field} must be a non-negative integer`,
      { segmentIndex, field, value },
    );
  }

  return value as number;
}

/**
 * Consumption across meter segments. A replaced meter gives two segments:
 * `(old meter final − period start) + (new meter closing − new meter initial)`.
 * A negative segment is a data-entry error and is thrown, never clamped to 0.
 */
export function meterConsumption(segments: readonly MeterSegment[]): MeterConsumption {
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new BillingError('NO_METER_SEGMENTS', 'At least one meter segment is required');
  }

  const snapshots = segments.map((segment, segmentIndex): MeterSegmentSnapshot => {
    const startReading = requireReading(segment.startReading, segmentIndex, 'startReading');
    const endReading = requireReading(segment.endReading, segmentIndex, 'endReading');

    if (endReading < startReading) {
      throw new BillingError(
        'NEGATIVE_CONSUMPTION',
        `Segment ${segmentIndex} end reading ${endReading} is below start reading ${startReading}`,
        { segmentIndex, meterId: segment.meterId ?? null, startReading, endReading },
      );
    }

    return {
      meterId: segment.meterId ?? null,
      startReading,
      endReading,
      consumption: endReading - startReading,
    };
  });

  return {
    consumption: snapshots.reduce((total, segment) => total + segment.consumption, 0),
    segments: snapshots,
  };
}
