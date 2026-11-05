import { randomUUID } from 'node:crypto';
import type { ReportExport, ReportKind, ReportQuery } from '@p4/shared';
import type { Request } from 'express';
import { QueryTypes } from 'sequelize';
import { type DomainEventModel, ReportExportModel, sequelize } from '@/sequelize/models/index.js';
import { enqueueEvent, recordAudit, runIdempotent } from '@/shared/commerce/persistence.js';
import { BaseError } from '@/utils/errors/base-error.js';
import { InputValidError, NotFound } from '@/utils/errors/index.js';
import { selectFields } from '@/utils/select-fields.js';

export function reportQuery(raw: Record<string, unknown>): ReportQuery {
  const from = raw.from;
  const to = raw.to;
  const timezone = raw.timezone ?? 'UTC';
  if (
    typeof from !== 'string' ||
    typeof to !== 'string' ||
    typeof timezone !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(to) ||
    !Number.isFinite(Date.parse(from)) ||
    !Number.isFinite(Date.parse(to)) ||
    Date.parse(to) <= Date.parse(from) ||
    Date.parse(to) - Date.parse(from) > 366 * 86400000
  )
    throw new InputValidError('invalid_report_range');
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
  } catch {
    throw new InputValidError('invalid_timezone');
  }
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString(), timezone };
}
export function requestReportQuery(req: Request) {
  return reportQuery(req.query);
}
export type ReportRow = Record<string, string | number | null>;
export async function reportRows(kind: ReportKind, query: ReportQuery): Promise<ReportRow[]> {
  const replacements = { ...query };
  if (kind === 'sales')
    return sequelize.query<ReportRow>(
      `SELECT date_trunc('day', l.created_at AT TIME ZONE :timezone)::text AS day, l.currency, COALESCE(SUM(CASE WHEN l.kind='capture' THEN l.amount ELSE 0 END),0)::text AS captured, COALESCE(SUM(CASE WHEN l.kind='refund' THEN l.amount ELSE 0 END),0)::text AS refunded, SUM(CASE WHEN l.kind='capture' THEN l.amount ELSE -l.amount END)::text AS net FROM payment_ledger l WHERE l.created_at>= :from AND l.created_at< :to GROUP BY day,l.currency ORDER BY day,l.currency`,
      { replacements, type: QueryTypes.SELECT },
    );
  if (kind === 'orders')
    return sequelize.query<ReportRow>(
      `SELECT lifecycle_status AS status,COUNT(*)::int AS count FROM orders WHERE created_at>= :from AND created_at< :to GROUP BY lifecycle_status ORDER BY lifecycle_status`,
      { replacements, type: QueryTypes.SELECT },
    );
  if (kind === 'products')
    return sequelize.query<ReportRow>(
      `SELECT i.product_id AS "productId",i.sku,SUM(i.fulfilled_quantity)::int AS fulfilled,SUM(i.returned_quantity)::int AS returned,SUM(i.fulfilled_quantity-i.returned_quantity)::int AS retained FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.created_at>= :from AND o.created_at< :to GROUP BY i.product_id,i.sku ORDER BY retained DESC,i.product_id,i.sku LIMIT 1000`,
      { replacements, type: QueryTypes.SELECT },
    );
  return sequelize.query<ReportRow>(
    `SELECT v.id,v.sku,v.on_hand AS "onHand",v.reserved,v.on_hand-v.reserved AS available,COALESCE(SUM(m.on_hand_delta),0)::text AS "periodOnHandDelta",COALESCE(SUM(m.reserved_delta),0)::text AS "periodReservedDelta" FROM product_variants v LEFT JOIN inventory_movements m ON m.variant_id=v.id AND m.created_at>= :from AND m.created_at< :to GROUP BY v.id ORDER BY v.sku,v.id LIMIT 1000`,
    { replacements, type: QueryTypes.SELECT },
  );
}
export function csvCell(value: string | number | null) {
  const raw = String(value ?? '');
  const safe = /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function rowsCsv(rows: ReportRow[]) {
  const keys = rows[0] ? Object.keys(rows[0]) : [];
  return (
    '\uFEFF' +
    [
      keys.map(csvCell).join(','),
      ...rows.map((row) => keys.map((key) => csvCell(row[key] ?? null)).join(',')),
    ].join('\r\n')
  );
}
export function exportDto(row: ReportExportModel): ReportExport {
  return {
    ...selectFields(row, ['id', 'report', 'status']),
    expiresAt: row.expiresAt.toISOString(),
    downloadUrl:
      row.status === 'ready' && row.expiresAt.getTime() > Date.now()
        ? `/api/admin/report-exports/${row.id}/download`
        : null,
  };
}
export async function createExport(
  userId: string,
  report: ReportKind,
  filters: ReportQuery,
  key: string,
) {
  const result = await runIdempotent(
    { scope: 'report.export', actorId: userId, key, payload: { report, filters: { ...filters } } },
    async (transaction) => {
      const row = await ReportExportModel.create(
        {
          id: randomUUID(),
          userId,
          report,
          filters,
          status: 'pending',
          content: null,
          expiresAt: new Date(Date.now() + 3600000),
        },
        { transaction },
      );
      await enqueueEvent(
        {
          type: 'report.export_requested',
          aggregateType: 'report_export',
          aggregateId: row.id,
          payload: { exportId: row.id },
        },
        transaction,
      );
      await recordAudit(
        {
          actorId: userId,
          action: 'report.export_requested',
          resourceType: 'report_export',
          resourceId: row.id,
        },
        transaction,
      );
      return { exportId: row.id };
    },
  );
  const value = result.result;
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof value.exportId !== 'string'
  )
    throw new Error('Invalid export result');
  const row = await ReportExportModel.findByPk(value.exportId);
  if (!row) throw new NotFound();
  return exportDto(row);
}
export async function generateExport(event: DomainEventModel) {
  const row = await ReportExportModel.findByPk(event.aggregateId);
  if (!row || row.status === 'ready' || row.expiresAt.getTime() <= Date.now()) return;
  const content = rowsCsv(await reportRows(row.report, row.filters));
  if (content.length > 5000000) throw new BaseError('export_size_exceeded');
  await row.update({ status: 'ready', content });
}
