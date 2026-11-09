import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { computeMonthlyInvoice, computeMoveInInvoice } from '../dist/index.js';
import {
  amounts,
  assertBalanced,
  assertBillingError,
  electricity,
  fullMonthInput,
  line,
  SERVICES,
  serviceLine,
  water,
} from './fixtures.mjs';

describe('computeMonthlyInvoice — rules.md full-month example (2026-11)', () => {
  const invoice = computeMonthlyInvoice(fullMonthInput());

  test('totals 3.910.000đ with no rounding line', () => {
    assert.equal(invoice.kind, 'monthly');
    assert.equal(invoice.period, '2026-11');
    assert.equal(invoice.subtotal, 3910000);
    assert.equal(invoice.rounding, 0);
    assert.equal(invoice.total, 3910000);
    assertBalanced(invoice);
  });

  test('has every line of the example table, in order', () => {
    assert.deepEqual(amounts(invoice), [
      ['rent', 3000000],
      ['service', 100000],
      ['service', 30000],
      ['service', 100000],
      ['service', 100000],
      ['electricity', 420000],
      ['water', 160000],
    ]);
  });

  test('rent line: 3.000.000 × 30/30 for 11/2026', () => {
    const rent = line(invoice, (item) => item.type === 'rent');

    assert.deepEqual(
      {
        period: rent.period,
        quantity: rent.quantity,
        unitPrice: rent.unitPrice,
        ratioNum: rent.ratioNum,
        ratioDen: rent.ratioDen,
        meta: rent.meta,
        description: rent.description,
      },
      {
        period: '2026-11',
        quantity: 1,
        unitPrice: 3000000,
        ratioNum: 30,
        ratioDen: 30,
        meta: { coveredFrom: '2026-11-01', coveredTo: '2026-11-30' },
        description: { key: 'invoiceLine.rent', params: { period: '2026-11' } },
      },
    );
  });

  test('per_person: 50.000 × 2 people; per_vehicle: 100.000 × 1 vehicle', () => {
    const common = serviceLine(invoice, 'common');
    const parking = serviceLine(invoice, 'parking');

    assert.equal(common.quantity, 2);
    assert.equal(common.unitPrice, 50000);
    assert.equal(common.amount, 100000);
    assert.equal(common.serviceId, 'svc-common');
    assert.equal(common.meta.serviceKind, 'per_person');
    assert.equal(parking.quantity, 1);
    assert.equal(parking.amount, 100000);
  });

  test('electricity of 10/2026: (1.250 − 1.130) × 3.500 with readings snapshot', () => {
    const power = line(invoice, (item) => item.type === 'electricity');

    assert.equal(power.period, '2026-10');
    assert.equal(power.quantity, 120);
    assert.equal(power.unit, 'kWh');
    assert.equal(power.unitPrice, 3500);
    assert.equal(power.ratioNum, null);
    assert.equal(power.amount, 420000);
    assert.equal(power.meta.startReading, 1130);
    assert.equal(power.meta.endReading, 1250);
    assert.deepEqual(power.meta.segments, [
      { meterId: 'm-e1', startReading: 1130, endReading: 1250, consumption: 120 },
    ]);
  });

  test('water of 10/2026: (88 − 80) × 20.000', () => {
    const waterLine = line(invoice, (item) => item.type === 'water');

    assert.equal(waterLine.period, '2026-10');
    assert.equal(waterLine.quantity, 8);
    assert.equal(waterLine.amount, 160000);
  });
});

describe('computeMonthlyInvoice — utilities', () => {
  test('meter replaced mid-period: (old final − period start) + (new closing − new initial)', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        utilities: [
          electricity([
            { meterId: 'old', startReading: 1130, endReading: 1190 },
            { meterId: 'new', startReading: 0, endReading: 60 },
          ]),
          water([{ startReading: 80, endReading: 88 }]),
        ],
      }),
    );
    const power = line(invoice, (item) => item.type === 'electricity');

    assert.equal(power.quantity, 120);
    assert.equal(power.amount, 420000);
    assert.equal(power.meta.startReading, 1130);
    assert.equal(power.meta.endReading, 60);
    assert.deepEqual(
      power.meta.segments.map((segment) => [segment.meterId, segment.consumption]),
      [
        ['old', 60],
        ['new', 60],
      ],
    );
    assert.equal(invoice.total, 3910000);
    assertBalanced(invoice);
  });

  test('zero consumption keeps a 0đ line with its readings', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        utilities: [
          electricity([{ startReading: 1130, endReading: 1250 }]),
          water([{ startReading: 80, endReading: 80 }]),
        ],
      }),
    );
    const waterLine = line(invoice, (item) => item.type === 'water');

    assert.equal(waterLine.quantity, 0);
    assert.equal(waterLine.amount, 0);
    assert.equal(waterLine.meta.startReading, 80);
    assert.equal(invoice.total, 3750000);
    assertBalanced(invoice);
  });

  test('negative consumption blocks the invoice (never clamped to 0)', () => {
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ utilities: [electricity([{ startReading: 1250, endReading: 1130 }])] }),
        ),
      'NEGATIVE_CONSUMPTION',
      { kind: 'electricity', segmentIndex: 0, startReading: 1250, endReading: 1130 },
    );
  });

  test('negative consumption on the new meter after a replacement is reported on segment 1', () => {
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({
            utilities: [
              water([
                { startReading: 80, endReading: 85 },
                { startReading: 10, endReading: 4 },
              ]),
            ],
          }),
        ),
      'NEGATIVE_CONSUMPTION',
      { kind: 'water', segmentIndex: 1 },
    );
  });

  test('missing closing reading blocks the invoice', () => {
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ utilities: [water([{ startReading: 80, endReading: null }])] }),
        ),
      'MISSING_READING',
      { kind: 'water', field: 'endReading' },
    );
  });

  test('a utility without segments is rejected', () => {
    assertBillingError(
      () => computeMonthlyInvoice(fullMonthInput({ utilities: [water([])] })),
      'NO_METER_SEGMENTS',
    );
  });

  test('contract started in M−1: start reading is the move-in reading, line period is M−1', () => {
    // Moved in 20/11/2026 with electricity 1.250 and water 88; closing 30/11: 1.300 and 90.
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        period: '2026-12',
        contract: { startDate: '2026-11-20', rent: 3000000 },
        utilities: [
          electricity([{ startReading: 1250, endReading: 1300 }]),
          water([{ startReading: 88, endReading: 90 }]),
        ],
      }),
    );

    assert.equal(line(invoice, (item) => item.type === 'rent').amount, 3000000);
    assert.equal(line(invoice, (item) => item.type === 'rent').ratioDen, 31);
    assert.equal(line(invoice, (item) => item.type === 'electricity').period, '2026-11');
    assert.equal(line(invoice, (item) => item.type === 'electricity').amount, 175000);
    assert.equal(line(invoice, (item) => item.type === 'water').amount, 40000);
    assert.equal(invoice.total, 3545000);
    assertBalanced(invoice);
  });

  test('January invoice bills December utilities of the previous year', () => {
    const invoice = computeMonthlyInvoice(fullMonthInput({ period: '2027-01' }));

    assert.equal(line(invoice, (item) => item.type === 'electricity').period, '2026-12');
    assert.equal(line(invoice, (item) => item.type === 'rent').ratioDen, 31);
  });
});

describe('computeMonthlyInvoice — rounding', () => {
  test('non-zero rounding line rounds half-up to 1.000đ (3.913.500 → 3.914.000)', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        utilities: [
          electricity([{ startReading: 1130, endReading: 1251 }]),
          water([{ startReading: 80, endReading: 88 }]),
        ],
      }),
    );
    const rounding = invoice.lines.at(-1);

    assert.equal(line(invoice, (item) => item.type === 'electricity').amount, 423500);
    assert.equal(invoice.subtotal, 3913500);
    assert.equal(invoice.rounding, 500);
    assert.equal(invoice.total, 3914000);
    assert.equal(rounding.type, 'rounding');
    assert.equal(rounding.amount, 500);
    assert.deepEqual(rounding.description, {
      key: 'invoiceLine.rounding',
      params: { roundingUnit: 1000 },
    });
    assertBalanced(invoice);
  });

  test('custom building roundingUnit rounds down with a negative rounding line', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        roundingUnit: 10000,
        utilities: [
          electricity([{ startReading: 1130, endReading: 1251 }]),
          water([{ startReading: 80, endReading: 88 }]),
        ],
      }),
    );

    assert.equal(invoice.total, 3910000);
    assert.equal(invoice.rounding, -3500);
    assert.equal(invoice.roundingUnit, 10000);
    assertBalanced(invoice);
  });

  test('roundingUnit 1 never adds a rounding line', () => {
    const invoice = computeMoveInInvoice({
      contract: { startDate: '2026-11-20', rent: 3000000 },
      occupantCount: 2,
      vehicleCount: 1,
      services: SERVICES,
      roundingUnit: 1,
    });

    assert.equal(invoice.total, 1221001);
    assert.equal(invoice.rounding, 0);
    assertBalanced(invoice);
  });

  test('invalid roundingUnit is rejected', () => {
    assertBillingError(
      () => computeMonthlyInvoice(fullMonthInput({ roundingUnit: 0 })),
      'INVALID_ROUNDING_UNIT',
    );
    assertBillingError(
      () => computeMonthlyInvoice(fullMonthInput({ roundingUnit: 2.5 })),
      'INVALID_ROUNDING_UNIT',
    );
  });
});

describe('computeMonthlyInvoice — proration and counts', () => {
  test('contract ending in M prorates rent and services (15/31)', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        period: '2026-12',
        contract: { startDate: '2026-01-01', endDate: '2026-12-15', rent: 3000000 },
      }),
    );
    const rent = line(invoice, (item) => item.type === 'rent');

    assert.equal(rent.ratioNum, 15);
    assert.equal(rent.ratioDen, 31);
    assert.equal(rent.amount, 1451613);
    assert.deepEqual(rent.meta, { coveredFrom: '2026-12-01', coveredTo: '2026-12-15' });
    assert.equal(serviceLine(invoice, 'internet').amount, 48387);
    assert.equal(serviceLine(invoice, 'trash').amount, 14516);
    assertBalanced(invoice);
  });

  test('February 2027 (28 days) full month → 28/28', () => {
    const invoice = computeMonthlyInvoice(fullMonthInput({ period: '2027-02' }));
    const rent = line(invoice, (item) => item.type === 'rent');

    assert.equal(rent.ratioNum, 28);
    assert.equal(rent.ratioDen, 28);
    assert.equal(rent.amount, 3000000);
    assert.equal(line(invoice, (item) => item.type === 'water').period, '2027-01');
  });

  test('leap February 2028 ending on the 29th → 29/29', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        period: '2028-02',
        contract: { startDate: '2027-03-01', endDate: '2028-02-29', rent: 3000000 },
      }),
    );
    const rent = line(invoice, (item) => item.type === 'rent');

    assert.equal(rent.ratioNum, 29);
    assert.equal(rent.ratioDen, 29);
    assert.equal(rent.amount, 3000000);
  });

  test('leap February 2028 ending on the 14th → 14/29', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        period: '2028-02',
        contract: { startDate: '2027-03-01', endDate: '2028-02-14', rent: 2900000 },
      }),
    );

    assert.equal(line(invoice, (item) => item.type === 'rent').amount, 1400000);
    assertBalanced(invoice);
  });

  test('per_person/per_vehicle use the counts on the issue date (3 people, 2 vehicles)', () => {
    const invoice = computeMonthlyInvoice(fullMonthInput({ occupantCount: 3, vehicleCount: 2 }));

    assert.equal(serviceLine(invoice, 'common').quantity, 3);
    assert.equal(serviceLine(invoice, 'common').amount, 150000);
    assert.equal(serviceLine(invoice, 'parking').quantity, 2);
    assert.equal(serviceLine(invoice, 'parking').amount, 200000);
    assert.equal(serviceLine(invoice, 'internet').quantity, 1);
    assert.equal(invoice.total, 4060000);
  });

  test('zero vehicles keeps the parking line at 0đ', () => {
    const invoice = computeMonthlyInvoice(fullMonthInput({ vehicleCount: 0 }));

    assert.equal(serviceLine(invoice, 'parking').quantity, 0);
    assert.equal(serviceLine(invoice, 'parking').amount, 0);
    assert.equal(invoice.total, 3810000);
  });

  test('a contract with no day in M has no monthly invoice', () => {
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ contract: { startDate: '2026-01-01', endDate: '2026-10-31', rent: 1 } }),
        ),
      'NO_OCCUPANCY_IN_PERIOD',
      { period: '2026-11' },
    );
    assertBillingError(
      () =>
        computeMonthlyInvoice(fullMonthInput({ contract: { startDate: '2026-12-01', rent: 1 } })),
      'NO_OCCUPANCY_IN_PERIOD',
    );
  });

  test('literal reading: a contract that starts in M is prorated like the move-in invoice', () => {
    // rules.md does not say whether a contract that got a move-in invoice for M also gets a
    // monthly invoice for M. The formula is applied literally; the API must not issue both.
    const monthly = computeMonthlyInvoice(
      fullMonthInput({ contract: { startDate: '2026-11-20', rent: 3000000 }, utilities: [] }),
    );
    const moveIn = computeMoveInInvoice({
      contract: { startDate: '2026-11-20', rent: 3000000 },
      occupantCount: 2,
      vehicleCount: 1,
      services: SERVICES,
    });

    assert.deepEqual(amounts(monthly), amounts(moveIn));
  });
});

describe('computeMonthlyInvoice — manual lines', () => {
  test('surcharge and discount with reasons; discount is stored negative', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        manualLines: [
          { type: 'surcharge', amount: 200000, reason: 'Đền ghế hỏng' },
          { type: 'discount', amount: 100000, reason: 'Giảm giá tháng đầu' },
        ],
      }),
    );
    const surcharge = line(invoice, (item) => item.type === 'surcharge');
    const discount = line(invoice, (item) => item.type === 'discount');

    assert.equal(surcharge.amount, 200000);
    assert.equal(surcharge.meta.reason, 'Đền ghế hỏng');
    assert.deepEqual(surcharge.description, {
      key: 'invoiceLine.surcharge',
      params: { reason: 'Đền ghế hỏng' },
    });
    assert.equal(discount.amount, -100000);
    assert.equal(invoice.total, 4010000);
    assertBalanced(invoice);
  });

  test('adjustment of a paid invoice references the original invoice', () => {
    const invoice = computeMonthlyInvoice(
      fullMonthInput({
        manualLines: [
          {
            type: 'adjustment',
            amount: -35000,
            reason: 'Sửa chỉ số điện kỳ 2026-09',
            referenceInvoiceId: 'inv-2026-10',
          },
        ],
      }),
    );
    const adjustment = line(invoice, (item) => item.type === 'adjustment');

    assert.equal(adjustment.amount, -35000);
    assert.equal(adjustment.meta.referenceInvoiceId, 'inv-2026-10');
    assert.equal(invoice.total, 3875000);
    assertBalanced(invoice);
  });

  test('manual lines without a reason, with a bad amount or without a reference are rejected', () => {
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ manualLines: [{ type: 'surcharge', amount: 1000, reason: '  ' }] }),
        ),
      'MISSING_REASON',
    );
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ manualLines: [{ type: 'discount', amount: -1000, reason: 'x' }] }),
        ),
      'INVALID_AMOUNT',
    );
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ manualLines: [{ type: 'surcharge', amount: 10.5, reason: 'x' }] }),
        ),
      'INVALID_AMOUNT',
    );
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ manualLines: [{ type: 'adjustment', amount: 5000, reason: 'x' }] }),
        ),
      'MISSING_REFERENCE',
    );
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ manualLines: [{ type: 'refund', amount: 5000, reason: 'x' }] }),
        ),
      'INVALID_MANUAL_LINE',
    );
  });
});

describe('computeMonthlyInvoice — input validation', () => {
  test('invalid period', () => {
    assertBillingError(
      () => computeMonthlyInvoice(fullMonthInput({ period: '2026-13' })),
      'INVALID_PERIOD',
    );
    assertBillingError(
      () => computeMonthlyInvoice(fullMonthInput({ period: '2026-1' })),
      'INVALID_PERIOD',
    );
  });

  test('invalid or reversed contract dates', () => {
    assertBillingError(
      () =>
        computeMonthlyInvoice(fullMonthInput({ contract: { startDate: '2026-02-30', rent: 1 } })),
      'INVALID_DATE',
    );
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ contract: { startDate: '2026-11-10', endDate: '2026-11-09', rent: 1 } }),
        ),
      'END_BEFORE_START',
    );
  });

  test('non-integer or negative money, counts and readings', () => {
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ contract: { startDate: '2026-01-01', rent: 3000000.5 } }),
        ),
      'INVALID_AMOUNT',
    );
    assertBillingError(
      () =>
        computeMonthlyInvoice(fullMonthInput({ contract: { startDate: '2026-01-01', rent: -1 } })),
      'INVALID_AMOUNT',
    );
    assertBillingError(
      () => computeMonthlyInvoice(fullMonthInput({ occupantCount: -1 })),
      'INVALID_QUANTITY',
    );
    assertBillingError(
      () => computeMonthlyInvoice(fullMonthInput({ vehicleCount: 1.5 })),
      'INVALID_QUANTITY',
    );
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({ utilities: [water([{ startReading: 80, endReading: 88.5 }])] }),
        ),
      'INVALID_READING',
    );
  });

  test('metered kinds are not accepted as fixed services, nor fixed kinds as utilities', () => {
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({
            services: [{ code: 'e', name: 'Điện', kind: 'electricity', unitPrice: 3500 }],
          }),
        ),
      'INVALID_SERVICE_KIND',
    );
    assertBillingError(
      () =>
        computeMonthlyInvoice(
          fullMonthInput({
            utilities: [
              { kind: 'per_room', unitPrice: 1, segments: [{ startReading: 0, endReading: 1 }] },
            ],
          }),
        ),
      'INVALID_SERVICE_KIND',
    );
  });
});
