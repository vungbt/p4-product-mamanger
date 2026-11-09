import assert from 'node:assert/strict';
import { BillingError } from '../dist/index.js';

/** Building defaults from rules.md ("Toà mặc định"). */
export const PRICES = {
  electricity: 3500,
  water: 20000,
  internet: 100000,
  trash: 30000,
  common: 50000,
  parking: 100000,
};

export const SERVICES = [
  {
    serviceId: 'svc-internet',
    code: 'internet',
    name: 'Internet',
    kind: 'per_room',
    unitPrice: PRICES.internet,
  },
  { serviceId: 'svc-trash', code: 'trash', name: 'Rác', kind: 'per_room', unitPrice: PRICES.trash },
  {
    serviceId: 'svc-common',
    code: 'common',
    name: 'Phí chung',
    kind: 'per_person',
    unitPrice: PRICES.common,
  },
  {
    serviceId: 'svc-parking',
    code: 'parking',
    name: 'Gửi xe',
    kind: 'per_vehicle',
    unitPrice: PRICES.parking,
  },
];

export function electricity(segments) {
  return {
    kind: 'electricity',
    serviceId: 'svc-electricity',
    code: 'electricity',
    unit: 'kWh',
    unitPrice: PRICES.electricity,
    segments,
  };
}

export function water(segments) {
  return {
    kind: 'water',
    serviceId: 'svc-water',
    code: 'water',
    unit: 'm³',
    unitPrice: PRICES.water,
    segments,
  };
}

/** Full-month example of rules.md: period 2026-11, rent 3.000.000đ, 2 people, 1 vehicle. */
export function fullMonthInput(overrides = {}) {
  return {
    period: '2026-11',
    contract: { startDate: '2026-01-01', endDate: null, rent: 3000000 },
    occupantCount: 2,
    vehicleCount: 1,
    services: SERVICES,
    utilities: [
      electricity([{ meterId: 'm-e1', startReading: 1130, endReading: 1250 }]),
      water([{ meterId: 'm-w1', startReading: 80, endReading: 88 }]),
    ],
    ...overrides,
  };
}

export function amounts(invoice) {
  return invoice.lines.map((line) => [line.type, line.amount]);
}

export function line(invoice, predicate) {
  const found = invoice.lines.find(predicate);

  assert.ok(found, 'expected line not found');

  return found;
}

export function serviceLine(invoice, code) {
  return line(invoice, (item) => item.type === 'service' && item.meta.serviceCode === code);
}

/** Invariants that must hold for every computed invoice. */
export function assertBalanced(invoice) {
  const sum = invoice.lines.reduce((total, item) => total + item.amount, 0);
  const withoutRounding = invoice.lines
    .filter((item) => item.type !== 'rounding')
    .reduce((total, item) => total + item.amount, 0);

  assert.equal(sum, invoice.total, 'sum of lines equals total');
  assert.equal(withoutRounding, invoice.subtotal, 'subtotal excludes rounding');
  assert.equal(invoice.total - invoice.subtotal, invoice.rounding);
  assert.ok(invoice.total % invoice.roundingUnit === 0, 'total is a multiple of roundingUnit');

  const roundingLines = invoice.lines.filter((item) => item.type === 'rounding');

  assert.equal(roundingLines.length, invoice.rounding === 0 ? 0 : 1);

  for (const item of invoice.lines) {
    assert.ok(Number.isSafeInteger(item.amount), `integer amount on ${item.type}`);
    assert.ok(!Object.is(item.amount, -0), `no negative zero on ${item.type}`);
  }
}

export function assertBillingError(fn, code, details = {}) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof BillingError, `expected BillingError, got ${error}`);
    assert.equal(error.code, code);

    for (const [key, value] of Object.entries(details)) {
      assert.deepEqual(error.details[key], value, `details.${key}`);
    }

    return true;
  });
}
