import type { ReportExportInput, ReportSheet, StayUser } from '@stay/shared';
import ExcelJS from 'exceljs';
import { vnd } from '../overview/overview.service.js';
import { reportQuery, reportRange, reportSnapshot } from './reports.service.js';

type Column = { key: string; header: string; width: number; kind?: 'money' | 'date' };
const common: Column[] = [
  { key: 'code', header: 'Mã hoá đơn', width: 24 },
  { key: 'room', header: 'Phòng', width: 16 },
  { key: 'period', header: 'Kỳ hoá đơn', width: 16 },
];
const money = (key: string, header: string): Column => ({ key, header, width: 22, kind: 'money' });
const date = (key: string, header: string): Column => ({ key, header, width: 18, kind: 'date' });
const sheets: Record<ReportSheet, { name: string; columns: Column[]; sql: string }> = {
  invoices: {
    name: 'Hoá đơn',
    columns: [
      ...common,
      date('issued', 'Ngày phát hành'),
      date('due', 'Hạn thu'),
      money('total', 'Phải thu'),
      money('paid', 'Đã thu'),
      money('remaining', 'Còn nợ'),
    ],
    sql: `SELECT i.code, r.code room, i.period, i.issued_on issued, i.due_on due,
      i.total, i.paid_total paid, i.total - i.paid_total remaining
      FROM invoices i JOIN rooms r ON r.id = i.room_id WHERE i.building_id = :buildingId
        AND i.status IN (:billedStatuses) AND i.period BETWEEN :from AND :to ORDER BY i.period, i.code`,
  },
  payments: {
    name: 'Sổ thu',
    columns: [
      ...common,
      date('paidOn', 'Ngày thu'),
      { key: 'method', header: 'Phương thức', width: 20 },
      money('amount', 'Số tiền'),
    ],
    sql: `SELECT i.code, r.code room, i.period, p.paid_on "paidOn", p.method, p.amount
      FROM payments p JOIN invoices i ON i.id = p.invoice_id JOIN rooms r ON r.id = i.room_id
      WHERE p.building_id = :buildingId AND p.reversed_at IS NULL AND i.status IN (:billedStatuses)
        AND p.paid_on BETWEEN :start AND :end ORDER BY p.paid_on, p.id`,
  },
  expenses: {
    name: 'Chi phí',
    columns: [
      { key: 'category', header: 'Danh mục', width: 28 },
      { key: 'room', header: 'Phòng', width: 16 },
      { key: 'period', header: 'Kỳ chi phí', width: 16 },
      date('spentOn', 'Ngày chi'),
      money('amount', 'Số tiền'),
    ],
    sql: `SELECT c.name category, r.code room, e.period, e.spent_on "spentOn", e.amount
      FROM expenses e JOIN expense_categories c ON c.id = e.category_id LEFT JOIN rooms r ON r.id = e.room_id
      WHERE e.building_id = :buildingId AND e.period BETWEEN :from AND :to ORDER BY e.spent_on, e.id`,
  },
  receivables: {
    name: 'Công nợ',
    columns: [
      ...common,
      date('due', 'Hạn thu'),
      money('total', 'Phải thu'),
      money('paid', 'Đã thu'),
      money('remaining', 'Còn nợ'),
    ],
    sql: `SELECT i.code, r.code room, i.period, i.due_on due, i.total, i.paid_total paid,
      i.total - i.paid_total remaining FROM invoices i JOIN rooms r ON r.id = i.room_id
      WHERE i.building_id = :buildingId AND i.status IN ('issued','partially_paid')
        AND i.total > i.paid_total AND i.period BETWEEN :from AND :to ORDER BY i.due_on, i.code`,
  },
};

/** Raw string cell values remain strings (never Excel formula objects). No audit changes. */
export async function exportReport(user: StayUser, input: ReportExportInput): Promise<Buffer> {
  const range = reportRange(input.from, input.to);

  return reportSnapshot(user, input.buildingId, async (transaction) => {
    const workbook = new ExcelJS.Workbook();

    for (const key of input.sheets) {
      const definition = sheets[key];
      const sheet = workbook.addWorksheet(definition.name, {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      sheet.columns = definition.columns.map(({ key, header, width }) => ({ key, header, width }));
      sheet.getRow(1).font = { bold: true };
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: definition.columns.length },
      };
      const rows = await reportQuery<Record<string, string | number | null>>(
        definition.sql,
        { buildingId: input.buildingId, ...range },
        transaction,
      );

      for (const record of rows) {
        const values: Record<string, string | number | Date | null> = {};

        for (const column of definition.columns) {
          const value = record[column.key] ?? null;

          values[column.key] =
            column.kind === 'money'
              ? vnd(value)
              : column.kind === 'date' && value
                ? new Date(`${value}T00:00:00Z`)
                : value;
        }
        sheet.addRow(values);
      }
      for (const column of definition.columns) {
        if (column.kind)
          sheet.getColumn(column.key).numFmt =
            column.kind === 'money' ? '#,##0 "₫";[Red]-#,##0 "₫"' : 'dd/mm/yyyy';
      }
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  });
}
