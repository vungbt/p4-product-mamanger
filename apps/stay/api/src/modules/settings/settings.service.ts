import { BaseError, NotFound, selectFields, setAuditChanges } from '@p4/server-core';
import type { JsonValue } from '@p4/shared';
import {
  type BillingSettings,
  DEFAULT_BILLING_SETTINGS,
  isBillingDay,
  isGraceDays,
  isMoveOutFee,
  isReadingDayMonth,
  isRoundingUnit,
  type ServiceKind,
  type StayService,
  type StaySettings,
} from '@stay/shared';
import { Op, type Transaction } from 'sequelize';
import type { BuildingAttributes } from '@/sequelize/models/building.model.js';
import {
  BuildingModel,
  ServiceDefinitionModel,
  SystemSettingModel,
} from '@/sequelize/models/index.js';
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
  /** `undefined` on update keeps the stored description. */
  description?: string | null;
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
    readingDayMonth: isReadingDayMonth(stored.readingDayMonth)
      ? stored.readingDayMonth
      : DEFAULT_BILLING_SETTINGS.readingDayMonth,
    issueDay: day('issueDay'),
    dueDay: day('dueDay'),
    graceDays: isGraceDays(stored.graceDays)
      ? stored.graceDays
      : DEFAULT_BILLING_SETTINGS.graceDays,
    roundingUnit: isRoundingUnit(stored.roundingUnit)
      ? stored.roundingUnit
      : DEFAULT_BILLING_SETTINGS.roundingUnit,
    refundUnusedRent:
      typeof stored.refundUnusedRent === 'boolean'
        ? stored.refundUnusedRent
        : DEFAULT_BILLING_SETTINGS.refundUnusedRent,
    moveOutFee: isMoveOutFee(stored.moveOutFee)
      ? stored.moveOutFee
      : DEFAULT_BILLING_SETTINGS.moveOutFee,
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
export async function billingDefaults(transaction?: Transaction): Promise<BillingSettings> {
  const row = await SystemSettingModel.findOne({ where: { key: BILLING_KEY }, transaction });

  if (!row) throw new BaseError('settings_missing', 503, 'settings_missing');

  const { transferContentTemplate: _template, ...billing } = settingsValue(row.value);

  return billing;
}

type BuildingBilling = Pick<
  BuildingAttributes,
  | 'readingDay'
  | 'readingDayMonth'
  | 'issueDay'
  | 'dueDay'
  | 'graceDays'
  | 'roundingUnit'
  | 'refundUnusedRent'
  | 'moveOutFee'
>;

/** The building's own billing values, else the system defaults. */
export function effectiveBilling(row: BuildingBilling, defaults: BillingSettings): BillingSettings {
  return {
    readingDay: row.readingDay ?? defaults.readingDay,
    readingDayMonth: row.readingDayMonth ?? defaults.readingDayMonth,
    issueDay: row.issueDay ?? defaults.issueDay,
    dueDay: row.dueDay ?? defaults.dueDay,
    graceDays: row.graceDays ?? defaults.graceDays,
    roundingUnit: row.roundingUnit ?? defaults.roundingUnit,
    refundUnusedRent: row.refundUnusedRent ?? defaults.refundUnusedRent,
    moveOutFee: row.moveOutFee ?? defaults.moveOutFee,
  };
}

/** Billing cycle in force for a building (its overrides, else the system defaults). */
export async function buildingBilling(
  building: BuildingBilling,
  transaction?: Transaction,
): Promise<BillingSettings> {
  return effectiveBilling(building, await billingDefaults(transaction));
}

/** Grace period in force for each building id (`graceDays` override, else the system value). */
export async function graceDaysByBuilding(
  buildingIds: string[],
  transaction?: Transaction,
): Promise<Map<string, number>> {
  const ids = [...new Set(buildingIds)];
  const result = new Map<string, number>();

  if (!ids.length) return result;

  const fallback = (await billingDefaults(transaction)).graceDays;
  const rows = await BuildingModel.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id', 'graceDays'],
    transaction,
  });

  for (const row of rows) result.set(row.id, row.graceDays ?? fallback);
  return result;
}

/**
 * SQL expression of the grace period in force for the building in `buildingIdColumn`, for
 * `invoiceOverdueDaysSql`: its override, else `systemGraceDays` (the system value).
 */
export function graceDaysSql(buildingIdColumn: string, systemGraceDays: number): string {
  if (!Number.isSafeInteger(systemGraceDays)) throw new Error('Invalid grace days');
  return `COALESCE((SELECT gb.grace_days FROM buildings gb WHERE gb.id = ${buildingIdColumn}), ${systemGraceDays})`;
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
  'description',
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
        description: input.description ?? null,
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
        description: input.description === undefined ? row.description : input.description,
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
