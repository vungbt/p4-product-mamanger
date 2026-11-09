import { BUILDING_CODE_PATTERN, isIsoDate } from '@stay/shared';
import { Op } from 'sequelize';
import { BuildingModel, ServiceDefinitionModel } from '@/sequelize/models/index.js';
import type { FormBody } from '@/shared/input.js';
import { checkBillingDay, checkRoundingUnit } from '../settings/settings.input.js';
import { billingDefaults } from '../settings/settings.service.js';
import type { PriceOverrideInput } from './building-prices.service.js';
import type { BuildingInput } from './buildings.service.js';
import { buildingHasInvoices } from './buildings.usage.js';

const MAX_PRICE = 1_000_000_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BANK_FIELDS = ['bankBin', 'bankAccount', 'bankAccountName'] as const;

/** `undefined`/empty text → `null`. */
const orNull = (value: string | undefined) => value || null;

/** Body of `POST /api/buildings` and `PUT /api/buildings/:id` (`existing`). */
export async function readBuildingInput(
  body: FormBody,
  existing?: { id: string; code: string },
): Promise<BuildingInput> {
  const input: BuildingInput = {
    code: body.text('code', 6).toUpperCase(),
    name: body.text('name', 120),
    address: orNull(body.optionalText('address', 255)),
    readingDay: body.isEmpty('readingDay')
      ? null
      : checkBillingDay(body, 'readingDay', body.integer('readingDay', 1, 31)),
    issueDay: body.isEmpty('issueDay')
      ? null
      : checkBillingDay(body, 'issueDay', body.integer('issueDay', 1, 31)),
    dueDay: body.isEmpty('dueDay')
      ? null
      : checkBillingDay(body, 'dueDay', body.integer('dueDay', 1, 31)),
    roundingUnit: body.isEmpty('roundingUnit')
      ? null
      : checkRoundingUnit(body, body.integer('roundingUnit', 1, 1000)),
    refundUnusedRent: body.isEmpty('refundUnusedRent') ? null : body.boolean('refundUnusedRent'),
    bankBin: orNull(body.optionalText('bankBin', 6)),
    bankAccount: orNull(body.optionalText('bankAccount', 19)?.replace(/\s+/g, '')),
    bankAccountName: orNull(
      body.optionalText('bankAccountName', 50)?.replace(/\s+/g, ' ').toUpperCase(),
    ),
    rulesText: orNull(body.optionalText('rulesText', 5000)),
    contactPhone: orNull(body.optionalText('contactPhone', 20)?.replace(/[\s.-]/g, '')),
  };

  if (!body.errors.code) {
    if (body.check('code', BUILDING_CODE_PATTERN.test(input.code), 'building_code_format')) {
      const taken = await BuildingModel.count({
        where: { code: input.code, ...(existing ? { id: { [Op.ne]: existing.id } } : {}) },
      });

      body.check('code', taken === 0, 'unique_value');
    }
    if (existing && input.code !== existing.code)
      body.check('code', !(await buildingHasInvoices(existing.id)), 'building_code_locked');
  }

  if (input.bankBin) body.check('bankBin', /^\d{6}$/.test(input.bankBin), 'bank_bin_format');
  if (input.bankAccount)
    body.check('bankAccount', /^[0-9A-Za-z]{4,19}$/.test(input.bankAccount), 'invalid_field');
  if (input.bankAccountName)
    body.check(
      'bankAccountName',
      /^[A-Z0-9 ]+$/.test(input.bankAccountName),
      'bank_account_name_format',
    );
  if (BANK_FIELDS.some((field) => input[field]))
    for (const field of BANK_FIELDS) body.check(field, Boolean(input[field]), 'bank_incomplete');
  if (input.contactPhone)
    body.check('contactPhone', /^0\d{9,10}$/.test(input.contactPhone), 'phone_format');

  if (!body.errors.issueDay && !body.errors.dueDay && (input.issueDay || input.dueDay)) {
    const defaults = await billingDefaults();

    body.check(
      input.dueDay ? 'dueDay' : 'issueDay',
      (input.dueDay ?? defaults.dueDay) >= (input.issueDay ?? defaults.issueDay),
      'due_before_issue',
    );
  }

  body.assertValid();
  return input;
}

/** Body of `PUT /api/buildings/:id/prices`. */
export async function readPriceOverrideInput(body: FormBody): Promise<PriceOverrideInput> {
  const input = {
    serviceId: body.text('serviceId', 36),
    effectiveFrom: body.text('effectiveFrom', 10),
    price: body.data.price === null ? null : body.integer('price', 0, MAX_PRICE),
  };

  if (!body.errors.effectiveFrom)
    body.check('effectiveFrom', isIsoDate(input.effectiveFrom), 'invalid_date');
  if (!body.errors.serviceId)
    body.check(
      'serviceId',
      UUID_PATTERN.test(input.serviceId) &&
        (await ServiceDefinitionModel.count({ where: { id: input.serviceId } })) > 0,
      'service_not_found',
    );

  body.assertValid();
  return input;
}
