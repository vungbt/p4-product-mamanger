import { BaseError, InputValidError, NotFound, setAuditChanges } from '@p4/server-core';
import type { JsonValue } from '@p4/shared';
import {
  type DuplicateTenantRef,
  type StayUser,
  TENANT_IMPORT_COLUMNS,
  TENANT_IMPORT_MAX_ROWS,
  type TenantImportCellError,
  type TenantImportColumn,
  type TenantImportCommitRow,
  type TenantImportPreview,
  type TenantImportResult,
  type TenantImportRow,
} from '@stay/shared';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import type { TFunction } from 'i18next';
import { Op, type Transaction } from 'sequelize';
import { Open } from 'unzipper';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import { BuildingModel, sequelize, TenantModel, UserModel } from '@/sequelize/models/index.js';
import { runIdempotent } from '@/shared/persistence.js';
import { foldText, normalizeTenantFields, type TenantFields } from './tenants.input.js';

/** Largest accepted import file (2 MB) and its unzipped size for XLSX (20 MB). */
export const IMPORT_MAX_BYTES = 2_097_152;
const XLSX_MAX_UNZIPPED_BYTES = 20_971_520;

type RowValues = Partial<Record<TenantImportColumn, string>>;

/** Folded header text → column key; accepts the Vietnamese header or the key itself. */
const HEADER_KEYS = new Map<string, TenantImportColumn>(
  TENANT_IMPORT_COLUMNS.flatMap(({ key, header }) => [
    [foldText(header).replace(/[^a-z0-9]/g, ''), key],
    [key.toLowerCase(), key],
  ]),
);

function importError(code: string, extensions: Record<string, unknown> = {}) {
  return new BaseError(code, 400, code, extensions);
}

/** Column keys of a header row; unknown, duplicate or missing required columns answer 400. */
function readHeader(cells: string[]): (TenantImportColumn | null)[] {
  const keys = cells.map((cell) => {
    const folded = foldText(cell).replace(/[^a-z0-9]/g, '');

    return folded ? (HEADER_KEYS.get(folded) ?? folded) : null;
  });
  const unknown = cells.filter((cell, index) => {
    const key = keys[index];

    return key !== null && !TENANT_IMPORT_COLUMNS.some((column) => column.key === key) && cell;
  });
  const known = keys.filter((key): key is TenantImportColumn =>
    TENANT_IMPORT_COLUMNS.some((column) => column.key === key),
  );
  const missing = TENANT_IMPORT_COLUMNS.filter(
    (column) => column.required && !known.includes(column.key),
  ).map((column) => column.header);

  if (unknown.length) throw importError('import_unknown_columns', { columns: unknown });
  if (missing.length) throw importError('import_missing_columns', { columns: missing });
  if (new Set(known).size !== known.length) throw importError('import_duplicate_columns');
  return keys.map((key) =>
    TENANT_IMPORT_COLUMNS.some((column) => column.key === key) ? (key as TenantImportColumn) : null,
  );
}

/** Data rows keyed by column, with their line number; blank lines are skipped. */
function toRows(lines: string[][]): { line: number; values: RowValues }[] {
  const [header, ...data] = lines;

  if (!header) throw importError('import_empty');

  const keys = readHeader(header);
  const rows: { line: number; values: RowValues }[] = [];

  data.forEach((cells, index) => {
    if (!cells.some((cell) => cell.trim())) return;

    const values: RowValues = {};

    keys.forEach((key, column) => {
      const cell = cells[column]?.trim();

      if (key && cell) values[key] = cell;
    });
    rows.push({ line: index + 2, values });
  });
  if (!rows.length) throw importError('import_empty');
  if (rows.length > TENANT_IMPORT_MAX_ROWS)
    throw importError('import_too_many_rows', { max: TENANT_IMPORT_MAX_ROWS });
  return rows;
}

function readCsv(buffer: Buffer): string[][] {
  if (buffer.includes(0)) throw importError('import_invalid_file');

  try {
    const records: unknown = parse(buffer.toString('utf8'), {
      bom: true,
      relax_column_count: true,
      skip_empty_lines: true,
      max_record_size: 100_000,
      to: TENANT_IMPORT_MAX_ROWS + 2,
    });

    if (!Array.isArray(records)) throw importError('import_invalid_file');
    return records.map((record: unknown) =>
      Array.isArray(record) ? record.map((cell: unknown) => String(cell ?? '')) : [],
    );
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw importError('import_invalid_file');
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

/** Text of an XLSX cell as the user sees it; dates become `dd/MM/yyyy`. */
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date)
    return `${pad(value.getUTCDate())}/${pad(value.getUTCMonth() + 1)}/${value.getUTCFullYear()}`;
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((part) => part.text).join('');
    if ('text' in value && typeof value.text === 'string') return value.text;
    if ('result' in value) return cellText(value.result as ExcelJS.CellValue);
    return '';
  }
  return String(value);
}

async function readXlsx(buffer: Buffer): Promise<string[][]> {
  try {
    const archive = await Open.buffer(buffer);
    const unzipped = archive.files.reduce((sum, entry) => sum + entry.uncompressedSize, 0);

    if (archive.files.length > 500 || unzipped > XLSX_MAX_UNZIPPED_BYTES)
      throw importError('import_invalid_file');

    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(Uint8Array.from(buffer).buffer);

    const sheet = workbook.worksheets[0];

    if (!sheet || sheet.rowCount > TENANT_IMPORT_MAX_ROWS + 1 + 1000)
      throw importError('import_too_many_rows', { max: TENANT_IMPORT_MAX_ROWS });

    const lines: string[][] = [];

    for (let index = 1; index <= sheet.rowCount; index += 1) {
      const row = sheet.getRow(index);
      const cells: string[] = [];

      for (let column = 1; column <= Math.min(sheet.columnCount, 40); column += 1)
        cells.push(cellText(row.getCell(column).value));
      lines.push(cells);
    }
    return lines;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw importError('import_invalid_file');
  }
}

/** Rows of an uploaded CSV/XLSX (first sheet), keyed by column. */
export async function readImportFile(
  fileName: string,
  buffer: Buffer,
): Promise<{ line: number; values: RowValues }[]> {
  if (/\.csv$/i.test(fileName)) return toRows(readCsv(buffer));
  if (/\.xlsx$/i.test(fileName)) return toRows(await readXlsx(buffer));
  throw new InputValidError('input_valid_error', { file: ['import_requires_csv_or_xlsx'] });
}

interface CheckedRow {
  row: TenantImportRow;
  fields: TenantFields | null;
}

/**
 * Validates every row (errors per column) and flags duplicates: a phone already used in the
 * building, a CCCD used anywhere, or a repeat of an earlier row in the file. Nothing is written.
 */
async function checkRows(
  user: StayUser,
  buildingId: string,
  rows: { line: number; values: RowValues }[],
  t: TFunction,
  transaction?: Transaction,
): Promise<CheckedRow[]> {
  const checked = rows.map(({ line, values }): CheckedRow => {
    const errors: TenantImportCellError[] = [];
    const fields = normalizeTenantFields(
      (field) => values[field],
      (field, key, options) => {
        if (errors.some((error) => error.column === field)) return;

        const header = TENANT_IMPORT_COLUMNS.find((column) => column.key === field)?.header;

        errors.push({
          column: field,
          message: t(`error:${key}`, { attribute: header, ...options }),
        });
      },
    );

    return {
      row: {
        line,
        status: errors.length ? 'error' : 'valid',
        values,
        errors,
        duplicate: null,
      },
      fields: errors.length ? null : fields,
    };
  });
  const valid = checked.filter((item) => item.fields);
  const phones = valid.map((item) => item.fields?.phone ?? '');
  const idNumbers = valid.flatMap((item) => (item.fields?.idNumber ? [item.fields.idNumber] : []));
  const existing = await TenantModel.findAll({
    attributes: ['id', 'buildingId', 'phone', 'idNumber'],
    where: {
      [Op.or]: [
        { buildingId, phone: { [Op.in]: phones } },
        ...(idNumbers.length ? [{ idNumber: { [Op.in]: idNumbers } }] : []),
      ],
    },
    transaction,
  });
  const visible = (tenant: TenantModel) =>
    canAccessRecord(user, 'read', 'Tenant', { buildingId: tenant.buildingId }) ? tenant.id : null;
  const emails = valid.flatMap((item) => (item.fields?.email ? [item.fields.email] : []));
  const accounts = emails.length
    ? await UserModel.findAll({
        attributes: ['email'],
        where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), { [Op.in]: emails }),
        transaction,
      })
    : [];
  const usedEmails = new Set(accounts.map((account) => account.email.toLowerCase()));
  const seenPhones = new Set<string>();
  const seenIdNumbers = new Set<string>();

  for (const item of valid) {
    const fields = item.fields as TenantFields;
    const byIdNumber = fields.idNumber
      ? existing.find((tenant) => tenant.idNumber === fields.idNumber)
      : undefined;
    const byPhone = existing.find(
      (tenant) => tenant.buildingId === buildingId && tenant.phone === fields.phone,
    );
    let duplicate: DuplicateTenantRef | null = byIdNumber
      ? { field: 'idNumber', tenantId: visible(byIdNumber) }
      : byPhone
        ? { field: 'phone', tenantId: visible(byPhone) }
        : null;

    if (!duplicate && fields.idNumber && seenIdNumbers.has(fields.idNumber))
      duplicate = { field: 'idNumber', tenantId: null };
    if (!duplicate && seenPhones.has(fields.phone)) duplicate = { field: 'phone', tenantId: null };

    seenPhones.add(fields.phone);
    if (fields.idNumber) seenIdNumbers.add(fields.idNumber);
    if (duplicate) {
      item.row.status = 'duplicate';
      item.row.duplicate = duplicate;
      item.fields = null;
    } else if (fields.email) {
      if (usedEmails.has(fields.email)) {
        item.row.status = 'error';
        item.row.errors.push({
          column: 'email',
          message: t('error:unique_value', { attribute: 'Email' }),
        });
        item.fields = null;
      } else usedEmails.add(fields.email);
    }
  }
  return checked;
}

/** The import's target building: exists, not archived and the user manages its tenants. */
async function assertImportBuilding(user: StayUser, buildingId: string, transaction?: Transaction) {
  const building = canAccessRecord(user, 'manage', 'Tenant', { buildingId })
    ? await BuildingModel.findByPk(buildingId, { transaction })
    : null;

  if (!building) throw new NotFound('building_not_found');
  if (building.archivedAt) throw new BaseError('building_archived', 409, 'building_archived');
}

/** `POST /api/tenants/import/preview`: per-row and per-column result; writes nothing. */
export async function previewImport(
  user: StayUser,
  buildingId: string,
  file: { name: string; buffer: Buffer },
  t: TFunction,
): Promise<TenantImportPreview> {
  await assertImportBuilding(user, buildingId);

  const checked = await checkRows(
    user,
    buildingId,
    await readImportFile(file.name, file.buffer),
    t,
  );
  const rows = checked.map((item) => item.row);
  const count = (status: TenantImportRow['status']) =>
    rows.filter((row) => row.status === status).length;

  return {
    buildingId,
    fileName: file.name.slice(0, 200),
    totalRows: rows.length,
    validCount: count('valid'),
    errorCount: count('error'),
    duplicateCount: count('duplicate'),
    rows,
  };
}

/**
 * `POST /api/tenants/import`: re-checks the previewed rows and creates the valid ones in one
 * transaction. The same `Idempotency-Key` with the same body returns the first result without
 * creating anything again. Only profiles are created: rooms are assigned through contracts.
 */
export async function commitImport(
  user: StayUser,
  input: { buildingId: string; rows: TenantImportCommitRow[] },
  key: string,
  t: TFunction,
): Promise<TenantImportResult> {
  const { result, replayed } = await runIdempotent(
    {
      scope: 'tenant.import',
      actorId: user.id,
      key,
      payload: {
        buildingId: input.buildingId,
        rows: input.rows.map(({ line, values }) => ({
          line,
          values: Object.fromEntries(
            Object.entries(values).flatMap(([column, value]) =>
              value === undefined ? [] : [[column, value]],
            ),
          ),
        })),
      },
    },
    async (transaction) => {
      // One import at a time per building, so concurrent commits cannot both pass the checks.
      await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:key))', {
        replacements: { key: `tenant-import:${input.buildingId}` },
        transaction,
      });
      await assertImportBuilding(user, input.buildingId, transaction);

      const checked = await checkRows(user, input.buildingId, input.rows, t, transaction);
      const created = await TenantModel.bulkCreate(
        checked.flatMap((item) =>
          item.fields ? [{ ...item.fields, buildingId: input.buildingId }] : [],
        ),
        { transaction, returning: true },
      );
      const skipped = checked.flatMap(({ row }) =>
        row.status === 'valid' ? [] : [{ line: row.line, status: row.status }],
      );

      setAuditChanges({
        buildingId: input.buildingId,
        createdCount: created.length,
        skippedCount: skipped.length,
      });
      return {
        buildingId: input.buildingId,
        createdCount: created.length,
        skippedCount: skipped.length,
        tenantIds: created.map((row) => row.id),
        skipped,
      };
    },
  );

  return { ...storedResult(result), replayed };
}

/** The result kept by the idempotency record (written by `commitImport` above). */
function storedResult(value: JsonValue): Omit<TenantImportResult, 'replayed'> {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const number = (item: JsonValue | undefined) => (typeof item === 'number' ? item : 0);
  const list = (item: JsonValue | undefined) => (Array.isArray(item) ? item : []);

  return {
    buildingId: typeof record.buildingId === 'string' ? record.buildingId : '',
    createdCount: number(record.createdCount),
    skippedCount: number(record.skippedCount),
    tenantIds: list(record.tenantIds).filter((id): id is string => typeof id === 'string'),
    skipped: list(record.skipped).flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];

      const status = item.status === 'error' || item.status === 'duplicate' ? item.status : null;

      return status && typeof item.line === 'number' ? [{ line: item.line, status }] : [];
    }),
  };
}

/** The import template: header row only, every column formatted as text (keeps leading zeros). */
export async function importTemplate(format: 'csv' | 'xlsx'): Promise<Buffer> {
  const headers = TENANT_IMPORT_COLUMNS.map((column) => column.header);

  if (format === 'csv')
    return Buffer.from(`﻿${headers.map((header) => `"${header}"`).join(',')}\r\n`, 'utf8');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Người thuê');

  sheet.columns = TENANT_IMPORT_COLUMNS.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.key === 'permanentAddress' || column.key === 'note' ? 36 : 18,
    style: { numFmt: '@' },
  }));
  sheet.getRow(1).font = { bold: true };
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
