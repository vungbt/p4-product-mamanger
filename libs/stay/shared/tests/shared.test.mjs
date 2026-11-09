import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import * as v from 'valibot';
import {
  addDays,
  addMonths,
  CONTRACT_TRANSITIONS,
  canTransition,
  comparePeriods,
  DEFAULT_ROUNDING_UNIT,
  daysBetweenInclusive,
  daysInMonth,
  daysInPeriod,
  divideRoundHalfUp,
  firstDayOfPeriod,
  formatInvoiceCode,
  formatPeriod,
  INVOICE_LINE_TYPES,
  INVOICE_TRANSITIONS,
  IsoDateSchema,
  isInvoiceOverdue,
  isIsoDate,
  isoDateInTimeZone,
  isPeriod,
  lastDayOfPeriod,
  METER_READING_TRANSITIONS,
  multiplyDivideRoundHalfUp,
  NonNegativeVndSchema,
  nextPeriod,
  PeriodSchema,
  parseInvoiceCode,
  parsePeriod,
  periodOfDate,
  periodOfIsoDate,
  previousPeriod,
  roundToUnit,
  SERVICE_KINDS,
  STAY_TIME_ZONE,
  StayValueError,
  sumVnd,
  VndSchema,
} from '../dist/index.js';

function assertStayError(fn, code) {
  assert.throws(fn, (error) => error instanceof StayValueError && error.code === code);
}

describe('constants', () => {
  test('service kinds and line types match the data model', () => {
    assert.deepEqual(SERVICE_KINDS, [
      'electricity',
      'water',
      'per_room',
      'per_person',
      'per_vehicle',
    ]);
    assert.ok(INVOICE_LINE_TYPES.includes('rounding'));
    assert.equal(INVOICE_LINE_TYPES.length, 10);
    assert.equal(DEFAULT_ROUNDING_UNIT, 1000);
    assert.equal(STAY_TIME_ZONE, 'Asia/Ho_Chi_Minh');
  });
});

describe('periods', () => {
  test('parse and format YYYY-MM', () => {
    assert.deepEqual(parsePeriod('2026-11'), { year: 2026, month: 11 });
    assert.equal(formatPeriod(2026, 1), '2026-01');
    assert.ok(isPeriod('2026-12'));

    for (const bad of ['2026-13', '2026-00', '2026-1', '26-11', '2026/11', 202611, null]) {
      assert.equal(isPeriod(bad), false, String(bad));
    }

    assertStayError(() => parsePeriod('2026-13'), 'INVALID_PERIOD');
    assertStayError(() => formatPeriod(2026, 13), 'INVALID_PERIOD');
  });

  test('add / previous / next across year boundaries', () => {
    assert.equal(previousPeriod('2026-01'), '2025-12');
    assert.equal(nextPeriod('2026-12'), '2027-01');
    assert.equal(addMonths('2026-11', 14), '2028-01');
    assert.equal(addMonths('2026-11', -23), '2024-12');
    assert.equal(previousPeriod('2026-11'), '2026-10');
    assert.equal(comparePeriods('2026-09', '2026-10'), -1);
    assert.equal(comparePeriods('2026-10', '2026-10'), 0);
  });

  test('days in month, including leap years', () => {
    assert.equal(daysInPeriod('2026-11'), 30);
    assert.equal(daysInPeriod('2026-12'), 31);
    assert.equal(daysInMonth(2027, 2), 28);
    assert.equal(daysInMonth(2028, 2), 29);
    assert.equal(daysInMonth(2100, 2), 28);
    assert.equal(daysInMonth(2000, 2), 29);
  });

  test('first and last day of a period', () => {
    assert.equal(firstDayOfPeriod('2028-02'), '2028-02-01');
    assert.equal(lastDayOfPeriod('2028-02'), '2028-02-29');
    assert.equal(lastDayOfPeriod('2027-02'), '2027-02-28');
  });
});

describe('dates', () => {
  test('ISO date validation rejects impossible days', () => {
    assert.ok(isIsoDate('2028-02-29'));
    assert.equal(isIsoDate('2027-02-29'), false);
    assert.equal(isIsoDate('2026-11-31'), false);
    assert.equal(isIsoDate('2026-11-1'), false);
  });

  test('inclusive day counts and arithmetic', () => {
    assert.equal(daysBetweenInclusive('2026-11-20', '2026-11-30'), 11);
    assert.equal(daysBetweenInclusive('2026-11-20', '2026-11-20'), 1);
    assert.equal(daysBetweenInclusive('2026-11-21', '2026-11-20'), 0);
    assert.equal(addDays('2028-02-28', 1), '2028-02-29');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(periodOfIsoDate('2026-11-20'), '2026-11');
  });

  test('period of an instant is evaluated in Asia/Ho_Chi_Minh (UTC+7)', () => {
    assert.equal(periodOfDate(new Date('2026-10-31T16:59:59Z')), '2026-10');
    assert.equal(periodOfDate(new Date('2026-10-31T17:00:00Z')), '2026-11');
    assert.equal(isoDateInTimeZone(new Date('2026-12-31T17:30:00Z')), '2027-01-01');
    assert.equal(isoDateInTimeZone(new Date('2026-12-31T17:30:00Z'), 'UTC'), '2026-12-31');
    assertStayError(() => periodOfDate(new Date('nope')), 'INVALID_DATE');
  });
});

describe('money', () => {
  test('half-up division, away from zero for negatives', () => {
    assert.equal(divideRoundHalfUp(5, 2), 3);
    assert.equal(divideRoundHalfUp(-5, 2), -3);
    assert.equal(divideRoundHalfUp(7, 3), 2);
    assert.equal(divideRoundHalfUp(110000, 3), 36667);
    assert.equal(multiplyDivideRoundHalfUp([100000, 11], 30), 36667);
    assert.equal(multiplyDivideRoundHalfUp([50000, 2, 11], 30), 36667);
    assertStayError(() => divideRoundHalfUp(1, 0), 'INVALID_AMOUNT');
  });

  test('rounding to a unit (default 1.000đ)', () => {
    assert.equal(roundToUnit(3910000, 1000), 3910000);
    assert.equal(roundToUnit(3910500, 1000), 3911000);
    assert.equal(roundToUnit(3910499, 1000), 3910000);
    assert.equal(roundToUnit(1221001, 1000), 1221000);
    assert.equal(roundToUnit(-759999, 1000), -760000);
    assert.equal(roundToUnit(-1500, 1000), -2000);
    assert.equal(roundToUnit(-400, 1000), 0);
    assert.equal(Object.is(roundToUnit(-400, 1000), -0), false);
    assertStayError(() => roundToUnit(1000, 0), 'INVALID_ROUNDING_UNIT');
    assertStayError(() => roundToUnit(10.5, 1000), 'INVALID_AMOUNT');
  });

  test('exact sums and range checks', () => {
    assert.equal(sumVnd([3000000, 100000, 30000, 100000, 100000, 420000, 160000]), 3910000);
    assertStayError(() => sumVnd([0.1, 0.2]), 'INVALID_AMOUNT');
    assertStayError(() => sumVnd([Number.MAX_SAFE_INTEGER, 1]), 'AMOUNT_OUT_OF_RANGE');
    assertStayError(
      () => multiplyDivideRoundHalfUp([Number.MAX_SAFE_INTEGER, 2]),
      'AMOUNT_OUT_OF_RANGE',
    );
  });
});

describe('invoice code', () => {
  test('format {building}-{YYYYMM}-{NNN}', () => {
    assert.equal(formatInvoiceCode('A', '2026-11', 1), 'A-202611-001');
    assert.equal(formatInvoiceCode('B2', '2027-01', 42), 'B2-202701-042');
    assert.deepEqual(parseInvoiceCode('A-202611-001'), {
      buildingCode: 'A',
      period: '2026-11',
      sequence: 1,
    });
  });

  test('sequence is limited to 3 digits; malformed codes are rejected', () => {
    assert.equal(formatInvoiceCode('A', '2026-11', 999), 'A-202611-999');
    assertStayError(() => formatInvoiceCode('A', '2026-11', 1000), 'INVALID_INVOICE_CODE');
    assertStayError(() => formatInvoiceCode('A', '2026-11', 0), 'INVALID_INVOICE_CODE');
    assertStayError(() => formatInvoiceCode('', '2026-11', 1), 'INVALID_INVOICE_CODE');
    assertStayError(() => parseInvoiceCode('A-2026-11-001'), 'INVALID_INVOICE_CODE');
    assertStayError(() => parseInvoiceCode('A-202613-001'), 'INVALID_PERIOD');
  });
});

describe('state machines', () => {
  test('contract: draft → active → ending → ended; draft → cancelled', () => {
    assert.ok(canTransition(CONTRACT_TRANSITIONS, 'draft', 'active'));
    assert.ok(canTransition(CONTRACT_TRANSITIONS, 'draft', 'cancelled'));
    assert.ok(canTransition(CONTRACT_TRANSITIONS, 'active', 'ending'));
    assert.ok(canTransition(CONTRACT_TRANSITIONS, 'ending', 'ended'));
    assert.equal(canTransition(CONTRACT_TRANSITIONS, 'active', 'cancelled'), false);
    assert.equal(canTransition(CONTRACT_TRANSITIONS, 'active', 'ended'), false);
    assert.equal(canTransition(CONTRACT_TRANSITIONS, 'ended', 'active'), false);
  });

  test('invoice: void only from issued; recalculated payment states', () => {
    assert.ok(canTransition(INVOICE_TRANSITIONS, 'draft', 'issued'));
    assert.ok(canTransition(INVOICE_TRANSITIONS, 'issued', 'void'));
    assert.ok(canTransition(INVOICE_TRANSITIONS, 'issued', 'partially_paid'));
    assert.ok(canTransition(INVOICE_TRANSITIONS, 'partially_paid', 'paid'));
    assert.equal(canTransition(INVOICE_TRANSITIONS, 'partially_paid', 'void'), false);
    assert.equal(canTransition(INVOICE_TRANSITIONS, 'paid', 'void'), false);
    assert.equal(canTransition(INVOICE_TRANSITIONS, 'draft', 'paid'), false);
    assert.equal(canTransition(INVOICE_TRANSITIONS, 'void', 'issued'), false);
  });

  test('meter reading: draft ↔ locked', () => {
    assert.ok(canTransition(METER_READING_TRANSITIONS, 'draft', 'locked'));
    assert.ok(canTransition(METER_READING_TRANSITIONS, 'locked', 'draft'));
  });

  test('overdue is derived: issued/partially_paid after the due date', () => {
    assert.equal(isInvoiceOverdue('issued', '2026-11-05', '2026-11-05'), false);
    assert.equal(isInvoiceOverdue('issued', '2026-11-05', '2026-11-06'), true);
    assert.equal(isInvoiceOverdue('partially_paid', '2026-11-05', '2026-12-01'), true);
    assert.equal(isInvoiceOverdue('paid', '2026-11-05', '2026-12-01'), false);
    assert.equal(isInvoiceOverdue('void', '2026-11-05', '2026-12-01'), false);
    assert.equal(isInvoiceOverdue('draft', '2026-11-05', '2026-12-01'), false);
  });
});

describe('valibot schemas', () => {
  test('period, date and VND', () => {
    assert.ok(v.safeParse(PeriodSchema, '2026-11').success);
    assert.equal(v.safeParse(PeriodSchema, '2026-13').success, false);
    assert.ok(v.safeParse(IsoDateSchema, '2028-02-29').success);
    assert.equal(v.safeParse(IsoDateSchema, '2027-02-29').success, false);
    assert.ok(v.safeParse(VndSchema, -50000).success);
    assert.equal(v.safeParse(VndSchema, 1.5).success, false);
    assert.equal(v.safeParse(NonNegativeVndSchema, -1).success, false);
  });
});
