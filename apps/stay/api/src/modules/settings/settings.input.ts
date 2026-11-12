import {
  type BillingCycle,
  type BillingDay,
  billingCycleErrors,
  DEFAULT_BILLING_SETTINGS,
  GRACE_DAYS_MAX,
  isBillingDay,
  isRoundingUnit,
  READING_DAY_MONTHS,
  type ReadingDayMonth,
  type RoundingUnit,
  SERVICE_KINDS,
} from '@stay/shared';
import type { FormBody } from '@/shared/input.js';
import {
  activeMeteredTaken,
  type NewServiceInput,
  type ServiceInput,
  type SettingsInput,
  serviceNameTaken,
} from './settings.service.js';

const MAX_PRICE = 1_000_000_000;
const MAX_SORT_ORDER = 1_000_000;

/** A day read with `body.integer(field, 1, 31)` must be `1`–`28`, or `31` (end of month). */
export function checkBillingDay(body: FormBody, field: string, day: number): BillingDay {
  body.check(field, isBillingDay(day), 'billing_day');
  return day;
}

/** A unit read with `body.integer('roundingUnit', 1, 1000)` must be 1, 100 or 1 000 VND. */
export function checkRoundingUnit(body: FormBody, unit: number): RoundingUnit {
  if (isRoundingUnit(unit)) return unit;

  body.invalid('roundingUnit', 'rounding_unit');
  return DEFAULT_BILLING_SETTINGS.roundingUnit;
}

/** `readingDayMonth`: `same` | `next`. */
export function readReadingDayMonth(body: FormBody): ReadingDayMonth {
  return body.enum('readingDayMonth', READING_DAY_MONTHS);
}

/** `graceDays`: whole days 0–31 after the due date before an invoice counts as overdue. */
export function readGraceDays(body: FormBody): number {
  return body.integer('graceDays', 0, GRACE_DAYS_MAX);
}

/**
 * Cross-field cycle rules (`billingCycleErrors`) on the effective values. Fields with an own
 * error, and fields the request leaves to the system (`own[field] === false`), are skipped.
 */
export function checkBillingCycle(
  body: FormBody,
  cycle: BillingCycle,
  own: Partial<Record<keyof BillingCycle, boolean>> = {},
) {
  const fields = ['readingDay', 'readingDayMonth', 'issueDay', 'dueDay', 'graceDays'] as const;

  if (fields.some((field) => body.errors[field])) return;

  const errors = billingCycleErrors(cycle);

  if (errors.readingDay) {
    // In a building form the error belongs to whichever of the two days the request sets.
    const field = own.readingDay === false && own.issueDay !== false ? 'issueDay' : 'readingDay';

    body.invalid(field, errors.readingDay);
  }
  if (errors.dueDay)
    body.invalid(
      own.dueDay === false && own.issueDay !== false ? 'issueDay' : 'dueDay',
      errors.dueDay,
    );
  if (errors.graceDays) body.invalid('graceDays', errors.graceDays);
}

/** Body of `PUT /api/settings`. `readingDayMonth`/`graceDays` omitted = `same`/0. */
export function readSettingsInput(body: FormBody): SettingsInput & { version: number } {
  const input = {
    readingDay: checkBillingDay(body, 'readingDay', body.integer('readingDay', 1, 31)),
    readingDayMonth: body.isEmpty('readingDayMonth')
      ? DEFAULT_BILLING_SETTINGS.readingDayMonth
      : readReadingDayMonth(body),
    issueDay: checkBillingDay(body, 'issueDay', body.integer('issueDay', 1, 31)),
    dueDay: checkBillingDay(body, 'dueDay', body.integer('dueDay', 1, 31)),
    graceDays: body.isEmpty('graceDays') ? DEFAULT_BILLING_SETTINGS.graceDays : readGraceDays(body),
    roundingUnit: checkRoundingUnit(body, body.integer('roundingUnit', 1, 1000)),
    refundUnusedRent: body.boolean('refundUnusedRent'),
    transferContentTemplate: body.text('transferContentTemplate', 50),
    version: body.integer('version', 1),
  };

  checkBillingCycle(body, input);
  body.assertValid();
  return input;
}

async function checkServiceName(body: FormBody, name: string, exceptId?: string) {
  if (name && !body.errors.name)
    body.check('name', !(await serviceNameTaken(name, exceptId)), 'unique_value');
}

/** Body of `POST /api/services`. */
export async function readNewServiceInput(body: FormBody): Promise<NewServiceInput> {
  const input = {
    name: body.text('name', 120),
    kind: body.enum('kind', SERVICE_KINDS),
    unit: body.text('unit', 20),
    defaultPrice: body.integer('defaultPrice', 0, MAX_PRICE),
    sortOrder: body.isEmpty('sortOrder') ? undefined : body.integer('sortOrder', 0, MAX_SORT_ORDER),
    active: body.isEmpty('active') ? true : body.boolean('active'),
  };

  await checkServiceName(body, input.name);
  if (input.active && !body.errors.kind)
    body.check('kind', !(await activeMeteredTaken(input.kind)), 'metered_service_active');
  body.assertValid();
  return input;
}

/** Body of `PUT /api/services/:id`; `kind` and `code` never change. */
export async function readServiceInput(
  body: FormBody,
  service: { id: string; kind: NewServiceInput['kind'] },
): Promise<ServiceInput & { version: number }> {
  const input = {
    name: body.text('name', 120),
    unit: body.text('unit', 20),
    defaultPrice: body.integer('defaultPrice', 0, MAX_PRICE),
    sortOrder: body.integer('sortOrder', 0, MAX_SORT_ORDER),
    active: body.boolean('active'),
    version: body.integer('version', 1),
  };

  await checkServiceName(body, input.name, service.id);
  if (input.active)
    body.check(
      'active',
      !(await activeMeteredTaken(service.kind, service.id)),
      'metered_service_active',
    );
  body.assertValid();
  return input;
}
