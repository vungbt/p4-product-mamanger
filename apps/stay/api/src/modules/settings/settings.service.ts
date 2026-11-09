import { BaseError, NotFound, selectFields, setAuditChanges } from '@p4/server-core';
import type { JsonValue } from '@p4/shared';
import {
  type BillingSettings,
  DEFAULT_BILLING_SETTINGS,
  isBillingDay,
  isRoundingUnit,
  type ServiceKind,
  type StayService,
  type StaySettings,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import { ServiceDefinitionModel, SystemSettingModel } from '@/sequelize/models/index.js';
import type { ServiceDefinitionAttributes } from '@/sequelize/models/service-definition.model.js';
import { auditedTransaction, recordAudit } from '@/shared/audit.js';
import { assertVersion } from '@/shared/input.js';
import type { ModelOrder } from '@/types/database.js';

const BILLING_KEY = 'billing';

/** Kinds read from a meter: at most one active service of each. */
export const METERED_KINDS: readonly ServiceKind[] = ['electricity', 'water'];

export type SettingsInput = Omit<StaySettings, 'version'>;

export interface ServiceInput {
  name: string;
  unit: string;
  defaultPrice: number;
  sortOrder?: number;
  active: boolean;
}

export interface NewServiceInput extends ServiceInput {
  kind: ServiceKind;
}

/** Stored JSON → settings; a missing or invalid field falls back to its default. */
function settingsValue(value: JsonValue): SettingsInput {
  const stored = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const day = (field: 'readingDay' | 'issueDay' | 'dueDay') => {
    const raw = stored[field];

    return isBillingDay(raw) ? raw : DEFAULT_BILLING_SETTINGS[field];
  };

  return {
    readingDay: day('readingDay'),
    issueDay: day('issueDay'),
    dueDay: day('dueDay'),
    roundingUnit: isRoundingUnit(stored.roundingUnit)
      ? stored.roundingUnit
      : DEFAULT_BILLING_SETTINGS.roundingUnit,
    refundUnusedRent:
      typeof stored.refundUnusedRent === 'boolean'
        ? stored.refundUnusedRent
        : DEFAULT_BILLING_SETTINGS.refundUnusedRent,
    transferContentTemplate:
      typeof stored.transferContentTemplate === 'string' && stored.transferContentTemplate
        ? stored.transferContentTemplate
        : DEFAULT_BILLING_SETTINGS.transferContentTemplate,
  };
}

async function settingsRow(transaction?: Transaction) {
  const row = await SystemSettingModel.findOne({
    where: { key: BILLING_KEY },
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (!row) throw new BaseError('settings_missing', 503, 'settings_missing');
  return row;
}

function settingsDto(row: SystemSettingModel): StaySettings {
  return { ...settingsValue(row.value), version: row.version };
}

export async function getSettings(): Promise<StaySettings> {
  return settingsDto(await settingsRow());
}

/** System billing defaults that buildings inherit (`null` building fields). */
export async function billingDefaults(): Promise<BillingSettings> {
  const { transferContentTemplate: _template, ...billing } = settingsValue(
    (await settingsRow()).value,
  );

  return billing;
}

export async function updateSettings(
  input: SettingsInput,
  expectedVersion: number,
): Promise<StaySettings> {
  return auditedTransaction(async (transaction) => {
    const row = await settingsRow(transaction);

    assertVersion(row.version, expectedVersion);

    const before = settingsDto(row);

    await row.update({ value: { ...input } }, { transaction });

    const after = settingsDto(row);

    await recordAudit(
      {
        action: 'settings.update',
        resourceType: 'settings',
        resourceId: BILLING_KEY,
        changes: { before: { ...before }, after: { ...after } },
      },
      transaction,
    );

    return after;
  });
}

/* Services ------------------------------------------------------------------------------------ */

const serviceFields = [
  'id',
  'code',
  'name',
  'kind',
  'unit',
  'defaultPrice',
  'active',
  'sortOrder',
  'version',
] satisfies (keyof StayService)[];

export async function listServices(): Promise<StayService[]> {
  const order: ModelOrder<ServiceDefinitionAttributes> = [
    ['sortOrder', 'ASC'],
    ['name', 'ASC'],
    ['id', 'ASC'],
  ];
  const rows = await ServiceDefinitionModel.findAll({ order });

  return rows.map((row) => selectFields(row, serviceFields));
}

/**
 * Another service already uses `name`, ignoring case. Compared in JavaScript: Postgres `lower()`
 * leaves Vietnamese letters unchanged under the C locale. The catalogue is a handful of rows.
 */
export async function serviceNameTaken(name: string, exceptId?: string): Promise<boolean> {
  const key = name.toLocaleLowerCase('vi');
  const rows = await ServiceDefinitionModel.findAll({ attributes: ['id', 'name'] });

  return rows.some((row) => row.id !== exceptId && row.name.toLocaleLowerCase('vi') === key);
}

/** Another active service of a metered `kind` exists. */
export async function activeMeteredTaken(kind: ServiceKind, exceptId?: string): Promise<boolean> {
  if (!METERED_KINDS.includes(kind)) return false;

  const count = await ServiceDefinitionModel.count({
    where: {
      kind,
      active: true,
      ...(exceptId ? { id: { [Op.ne]: exceptId } } : {}),
    },
  });

  return count > 0;
}

/** `Gửi xe` → `gui_xe`; suffixed `_2`, `_3`… while taken. */
async function uniqueServiceCode(name: string): Promise<string> {
  const base =
    name
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[đĐ]/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 28) || 'service';
  const taken = new Set(
    (
      await ServiceDefinitionModel.findAll({
        attributes: ['code'],
        where: { code: { [Op.startsWith]: base } },
      })
    ).map((row) => row.code),
  );
  let code = base;

  for (let suffix = 2; taken.has(code); suffix++) code = `${base}_${suffix}`;
  return code;
}

async function nextSortOrder(): Promise<number> {
  const max = await ServiceDefinitionModel.max<number, ServiceDefinitionModel>('sortOrder');

  return (typeof max === 'number' ? max : 0) + 10;
}

export async function getService(id: string, transaction?: Transaction) {
  const row = await ServiceDefinitionModel.findByPk(id, {
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });

  if (!row) throw new NotFound('service_not_found');
  return row;
}

export async function createService(input: NewServiceInput): Promise<StayService> {
  return auditedTransaction(async (transaction) => {
    const row = await ServiceDefinitionModel.create(
      {
        code: await uniqueServiceCode(input.name),
        name: input.name,
        kind: input.kind,
        unit: input.unit,
        defaultPrice: input.defaultPrice,
        active: input.active,
        sortOrder: input.sortOrder ?? (await nextSortOrder()),
      },
      { transaction },
    );
    const after = selectFields(row, serviceFields);

    setAuditChanges({ after });
    return after;
  });
}

export async function updateService(
  id: string,
  input: ServiceInput,
  expectedVersion: number,
): Promise<StayService> {
  return auditedTransaction(async (transaction) => {
    const row = await getService(id, transaction);

    assertVersion(row.version, expectedVersion);

    const before = selectFields(row, serviceFields);

    // Contracts using a deactivated service are handled by ST-10 (detach from the next period).
    await row.update(
      {
        name: input.name,
        unit: input.unit,
        defaultPrice: input.defaultPrice,
        active: input.active,
        sortOrder: input.sortOrder ?? row.sortOrder,
      },
      { transaction },
    );

    const after = selectFields(row, serviceFields);

    setAuditChanges({ before, after });
    return after;
  });
}
