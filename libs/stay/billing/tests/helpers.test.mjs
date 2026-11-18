import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  BillingError,
  countActiveOn,
  dayRatio,
  isBillingError,
  meterConsumption,
  resolvePrice,
} from '../dist/index.js';
import { assertBillingError } from './fixtures.mjs';

describe('dayRatio', () => {
  test('move-in 20/11 → 11/30 (rules.md)', () => {
    assert.deepEqual(dayRatio({ startDate: '2026-11-20' }, '2026-11'), {
      numerator: 11,
      denominator: 30,
      coveredFrom: '2026-11-20',
      coveredTo: '2026-11-30',
    });
  });

  test('full month uses the actual number of days', () => {
    assert.equal(dayRatio({ startDate: '2026-01-01' }, '2026-12').denominator, 31);
    assert.equal(dayRatio({ startDate: '2026-01-01' }, '2026-11').denominator, 30);
    assert.deepEqual(
      [
        dayRatio({ startDate: '2026-01-01' }, '2027-02').numerator,
        dayRatio({ startDate: '2026-01-01' }, '2027-02').denominator,
      ],
      [28, 28],
    );
    assert.deepEqual(
      [
        dayRatio({ startDate: '2026-01-01' }, '2028-02').numerator,
        dayRatio({ startDate: '2026-01-01' }, '2028-02').denominator,
      ],
      [29, 29],
    );
    assert.equal(dayRatio({ startDate: '2026-01-01' }, '2100-02').denominator, 28);
  });

  test('start and end inside the month count both days', () => {
    const ratio = dayRatio({ startDate: '2026-11-10', endDate: '2026-11-19' }, '2026-11');

    assert.equal(ratio.numerator, 10);
  });

  test('start == end is one day', () => {
    assert.equal(
      dayRatio({ startDate: '2026-11-15', endDate: '2026-11-15' }, '2026-11').numerator,
      1,
    );
  });

  test('no overlap gives 0 with no coverage', () => {
    assert.deepEqual(dayRatio({ startDate: '2026-12-01' }, '2026-11'), {
      numerator: 0,
      denominator: 30,
      coveredFrom: null,
      coveredTo: null,
    });
    assert.equal(
      dayRatio({ startDate: '2026-01-01', endDate: '2026-10-31' }, '2026-11').numerator,
      0,
    );
  });

  test('end before start and invalid inputs are errors', () => {
    assertBillingError(
      () => dayRatio({ startDate: '2026-11-20', endDate: '2026-11-19' }, '2026-11'),
      'END_BEFORE_START',
    );
    assertBillingError(() => dayRatio({ startDate: '2026-11-20' }, '2026-00'), 'INVALID_PERIOD');
    assertBillingError(() => dayRatio({ startDate: '2027-02-29' }, '2027-02'), 'INVALID_DATE');
  });
});

describe('meterConsumption', () => {
  test('single meter', () => {
    assert.equal(meterConsumption([{ startReading: 1130, endReading: 1250 }]).consumption, 120);
  });

  test('meter replacement adds both segments', () => {
    const usage = meterConsumption([
      { meterId: 'old', startReading: 9990, endReading: 9999 },
      { meterId: 'new', startReading: 0, endReading: 15 },
    ]);

    assert.equal(usage.consumption, 24);
    assert.deepEqual(usage.segments, [
      { meterId: 'old', startReading: 9990, endReading: 9999, consumption: 9 },
      { meterId: 'new', startReading: 0, endReading: 15, consumption: 15 },
    ]);
  });

  test('zero consumption is valid', () => {
    assert.equal(meterConsumption([{ startReading: 80, endReading: 80 }]).consumption, 0);
  });

  test('negative, missing, fractional and empty readings are typed errors', () => {
    assertBillingError(
      () => meterConsumption([{ startReading: 1250, endReading: 1249 }]),
      'NEGATIVE_CONSUMPTION',
      { segmentIndex: 0 },
    );
    assertBillingError(
      () => meterConsumption([{ startReading: null, endReading: 10 }]),
      'MISSING_READING',
      { field: 'startReading' },
    );
    assertBillingError(
      () => meterConsumption([{ startReading: -1, endReading: 10 }]),
      'INVALID_READING',
    );
    assertBillingError(
      () => meterConsumption([{ startReading: 1.5, endReading: 10 }]),
      'INVALID_READING',
    );
    assertBillingError(() => meterConsumption([]), 'NO_METER_SEGMENTS');
  });
});

describe('resolvePrice', () => {
  const overrides = [
    { effectiveFrom: '2026-12-01', price: 4000 },
    { effectiveFrom: '2026-06-01', price: 3800 },
  ];

  test('latest override with effectiveFrom ≤ date wins, in any input order', () => {
    assert.deepEqual(resolvePrice({ defaultPrice: 3500, overrides, on: '2026-11-01' }), {
      price: 3800,
      source: 'override',
      effectiveFrom: '2026-06-01',
    });
  });

  test('effectiveFrom equal to the date applies', () => {
    assert.equal(resolvePrice({ defaultPrice: 3500, overrides, on: '2026-12-01' }).price, 4000);
  });

  test('falls back to the default price before any override', () => {
    assert.deepEqual(resolvePrice({ defaultPrice: 3500, overrides, on: '2026-05-31' }), {
      price: 3500,
      source: 'default',
      effectiveFrom: null,
    });
    assert.equal(resolvePrice({ defaultPrice: 3500, on: '2026-05-31' }).price, 3500);
  });

  test('duplicate dates, invalid prices and missing default are errors', () => {
    assertBillingError(
      () =>
        resolvePrice({
          defaultPrice: 3500,
          overrides: [
            { effectiveFrom: '2026-06-01', price: 1 },
            { effectiveFrom: '2026-06-01', price: 2 },
          ],
          on: '2026-07-01',
        }),
      'DUPLICATE_EFFECTIVE_FROM',
    );
    assertBillingError(
      () =>
        resolvePrice({
          defaultPrice: 3500,
          overrides: [{ effectiveFrom: '2026-06-01', price: -5 }],
          on: '2026-07-01',
        }),
      'INVALID_AMOUNT',
    );
    assertBillingError(() => resolvePrice({ on: '2026-07-01' }), 'MISSING_DEFAULT_PRICE');
    assertBillingError(
      () => resolvePrice({ defaultPrice: 3500, on: '01/07/2026' }),
      'INVALID_DATE',
    );
  });
});

describe('countActiveOn', () => {
  const occupants = [
    { fromDate: '2026-01-01', toDate: null },
    { fromDate: '2026-03-01', toDate: '2026-10-31' },
    { fromDate: '2026-11-01' },
    { fromDate: '2026-11-02', toDate: null },
  ];

  test('counts registrations active on the issue date (toDate inclusive)', () => {
    assert.equal(countActiveOn(occupants, '2026-11-01'), 2);
    assert.equal(countActiveOn(occupants, '2026-10-31'), 2);
    assert.equal(countActiveOn(occupants, '2026-11-15'), 3);
    assert.equal(countActiveOn([], '2026-11-01'), 0);
  });

  test('reversed registration is an error', () => {
    assertBillingError(
      () => countActiveOn([{ fromDate: '2026-11-02', toDate: '2026-11-01' }], '2026-11-01'),
      'END_BEFORE_START',
    );
  });
});

describe('BillingError', () => {
  test('carries a code and details', () => {
    try {
      meterConsumption([{ startReading: 5, endReading: 4 }]);
      assert.fail('expected an error');
    } catch (error) {
      assert.ok(isBillingError(error));
      assert.ok(error instanceof BillingError);
      assert.equal(error.name, 'BillingError');
      assert.equal(error.code, 'NEGATIVE_CONSUMPTION');
      assert.equal(error.details.startReading, 5);
    }
  });
});
