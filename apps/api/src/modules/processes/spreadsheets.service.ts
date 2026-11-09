import type { FileFormat, ImportResource, ProcessIssue } from '@p4/processes/shared';
import { IMPORT_COLUMNS } from '@p4/processes/shared';
import { BaseError } from '@p4/server-core';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import { Open } from 'unzipper';
import { processStoragePath, readProcessFile } from './storage.service.js';

export const MAX_IMPORT_ROWS = 5000;
export interface SpreadsheetRow {
  index: number;
  values: Record<string, string>;
  issues: ProcessIssue[];
}
function record(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new BaseError('invalid_spreadsheet_row');
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item !== 'string' || item.length > 10000)
      throw new BaseError('invalid_spreadsheet_cell');
    result[key] = item;
  }
  return result;
}
function validateHeaders(headers: string[], resource: ImportResource) {
  if (
    !headers.length ||
    headers.length > 30 ||
    new Set(headers).size !== headers.length ||
    headers.some((header) => !IMPORT_COLUMNS[resource].includes(header))
  )
    throw new BaseError('invalid_import_headers', 400, 'invalid_import_headers', {
      allowedColumns: IMPORT_COLUMNS[resource],
    });
}
export async function readSpreadsheet(
  key: string,
  format: FileFormat,
  resource: ImportResource,
): Promise<SpreadsheetRow[]> {
  const file = await readProcessFile(key);
  if (file.byteLength > 10485760) throw new BaseError('import_file_too_large');
  if (format === 'csv') {
    if (file.includes(0)) throw new BaseError('invalid_csv_encoding');
    const data: unknown = parse(file.toString('utf8'), {
      bom: true,
      columns: (headers: string[]) => {
        validateHeaders(headers, resource);
        return headers;
      },
      skip_empty_lines: true,
      max_record_size: 1000000,
      to: MAX_IMPORT_ROWS + 1,
    });
    if (!Array.isArray(data) || data.length > MAX_IMPORT_ROWS)
      throw new BaseError('import_row_limit');
    return data.map((raw: unknown, index) => ({
      index: index + 2,
      values: record(raw),
      issues: [],
    }));
  }
  const archive = await Open.file(processStoragePath(key));
  if (
    archive.files.length > 2000 ||
    archive.files.reduce((sum, entry) => sum + entry.uncompressedSize, 0) > 52428800 ||
    !archive.files.some((entry) => entry.path === 'xl/workbook.xml')
  )
    throw new BaseError('xlsx_archive_limit');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(processStoragePath(key));
  if (workbook.worksheets.length !== 1) throw new BaseError('import_requires_one_sheet');
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount > MAX_IMPORT_ROWS + 1 || sheet.columnCount > 30)
    throw new BaseError('import_row_limit');
  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
    if (typeof cell.value !== 'string') throw new BaseError('invalid_import_headers');
    headers.push(cell.value.trim());
  });
  validateHeaders(headers, resource);
  const rows: SpreadsheetRow[] = [];
  for (let index = 2; index <= sheet.rowCount; index++) {
    const values: Record<string, string> = {};
    const issues: ProcessIssue[] = [];
    let populated = false;
    for (const [column, header] of headers.entries()) {
      const value = sheet.getRow(index).getCell(column + 1).value;
      if (value !== null && value !== undefined && value !== '') populated = true;
      if (value === null || value === undefined) values[header] = '';
      else if (typeof value === 'number' || typeof value === 'string')
        values[header] = String(value);
      else {
        issues.push({
          item: index,
          field: header,
          code: 'unsupported_cell',
          message: 'Use plain text or numbers; formulas and rich cells are not imported.',
        });
        values[header] = '';
      }
    }
    if (populated) rows.push({ index, values, issues });
  }
  return rows;
}
export async function spreadsheetBuffer(
  rows: Record<string, string | number | null>[],
  format: FileFormat,
  columns: readonly string[],
) {
  if (format === 'csv') {
    const cell = (value: string | number | null | undefined) => {
      const text = String(value ?? '');
      const safe = /^\s*[=+@-]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    return Buffer.from(
      '\uFEFF' +
        [
          columns.map(cell).join(','),
          ...rows.map((row) => columns.map((column) => cell(row[column])).join(',')),
        ].join('\r\n'),
      'utf8',
    );
  }
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Data');
  sheet.columns = columns.map((key) => ({ header: key, key, width: 24 }));
  for (const row of rows)
    sheet.addRow(Object.fromEntries(columns.map((column) => [column, row[column] ?? ''])));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
