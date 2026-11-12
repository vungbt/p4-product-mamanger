import { BaseError, buildPaginationMeta, NotFound, searchPattern } from '@p4/server-core';
import type { ListQuery, PaginationMeta } from '@p4/shared';
import {
  CONTRACT_STATUSES,
  invoiceOverdueDays,
  invoiceOverdueDaysSql,
  isoDateInTimeZone,
  RECEIVABLE_BUCKETS,
  type ReceivableBucket,
  type ReceivableInvoice,
  type ReceivableSortField,
  type ReceivableTotals,
  type StayReceivable,
  type StayUser,
} from '@stay/shared';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import { BuildingModel, InvoiceModel, sequelize } from '@/sequelize/models/index.js';
import { buildingBilling } from '../settings/settings.service.js';

export interface ReceivableListQuery extends ListQuery<ReceivableSortField> {
  bucket?: ReceivableBucket;
}

/** Unpaid = issued or partially paid with something left (drafts and void never count). */
const UNPAID_STATUSES = ['issued', 'partially_paid'] as const;

const SORT_COLUMNS: Record<ReceivableSortField, string> = {
  remaining: 'remaining',
  overdueDays: 'overdue_days',
  roomCode: 'room_code',
};

/**
 * One row per contract with unpaid invoices in the building, filtered by `q` (room code,
 * contract code, occupant name or phone). Amounts are summed in SQL from `total − paid_total`;
 * overdue days use `today` (Asia/Ho_Chi_Minh) and the building's `:graceDays`, with the
 * shared `invoiceOverdueDaysSql` (the SQL twin of `isInvoiceOverdue`).
 */
const ROWS_SQL = `
WITH unpaid AS (
  SELECT i.contract_id, i.due_on, i.total - i.paid_total AS remaining,
    ${invoiceOverdueDaysSql('i.due_on', ':graceDays', ':today')} AS overdue_days
  FROM invoices i
  WHERE i.building_id = :buildingId
    AND i.status IN (:statuses)
    AND i.total > i.paid_total
),
grouped AS (
  SELECT contract_id,
    CAST(COUNT(*) AS int) AS invoice_count,
    SUM(remaining) AS remaining,
    COALESCE(SUM(remaining) FILTER (WHERE overdue_days > 0), 0) AS overdue_remaining,
    CAST(COUNT(*) FILTER (WHERE overdue_days > 0) AS int) AS overdue_count,
    to_char(MIN(due_on), 'YYYY-MM-DD') AS oldest_due_on,
    CAST(MAX(overdue_days) AS int) AS overdue_days
  FROM unpaid
  GROUP BY contract_id
),
receivables AS (
  SELECT g.*, c.code AS contract_code, c.status AS contract_status,
    COALESCE(stay_contract_room_at(c.id, CAST(:today AS date)), c.room_id) AS room_id,
    CASE
      WHEN g.overdue_days <= 0 THEN 'not_due'
      WHEN g.overdue_days <= 7 THEN '1_7'
      WHEN g.overdue_days <= 30 THEN '8_30'
      ELSE 'over_30'
    END AS bucket
  FROM grouped g
  JOIN contracts c ON c.id = g.contract_id
),
matched AS (
  SELECT r.*, rm.code AS room_code,
    rep.full_name AS representative_name, rep.phone AS representative_phone
  FROM receivables r
  JOIN rooms rm ON rm.id = r.room_id
  LEFT JOIN LATERAL (
    SELECT t.full_name, t.phone
    FROM contract_occupants o
    JOIN tenants t ON t.id = o.tenant_id
    WHERE o.contract_id = r.contract_id AND o.is_primary
    ORDER BY (o.to_date IS NULL) DESC, o.from_date DESC, o.id DESC
    LIMIT 1
  ) rep ON true
  WHERE CAST(:pattern AS text) IS NULL
    OR rm.code ILIKE :pattern
    OR r.contract_code ILIKE :pattern
    OR EXISTS (
      SELECT 1
      FROM contract_occupants o
      JOIN tenants t ON t.id = o.tenant_id
      WHERE o.contract_id = r.contract_id
        AND (t.full_name ILIKE :pattern OR t.phone ILIKE :pattern)
    )
)`;

interface RowRecord {
  contract_id: string;
  contract_code: string;
  contract_status: string;
  room_id: string;
  room_code: string;
  representative_name: string | null;
  representative_phone: string | null;
  invoice_count: number;
  remaining: string | number;
  overdue_remaining: string | number;
  oldest_due_on: string;
  overdue_days: number;
  bucket: string;
}

interface BucketRecord {
  bucket: string;
  count: number;
  remaining: string | number;
  overdue_remaining: string | number;
  invoice_count: string | number;
  overdue_count: string | number;
}

const BUCKETS_SQL = `${ROWS_SQL}
SELECT bucket, CAST(COUNT(*) AS int) AS count, SUM(remaining) AS remaining,
  SUM(overdue_remaining) AS overdue_remaining, SUM(invoice_count) AS invoice_count,
  SUM(overdue_count) AS overdue_count
FROM matched GROUP BY bucket`;

/** BIGINT sums arrive as strings; amounts beyond the safe integer range are refused. */
function vnd(value: string | number | null): number {
  const amount = Number(value ?? 0);

  if (!Number.isSafeInteger(amount))
    throw new BaseError('receivable_amount_overflow', 422, 'receivable_amount_overflow');
  return amount;
}

const isBucket = (value: string): value is ReceivableBucket =>
  (RECEIVABLE_BUCKETS as readonly string[]).includes(value);

function bucketOf(value: string): ReceivableBucket {
  if (!isBucket(value)) throw new Error(`Unknown receivable bucket ${value}`);
  return value;
}

function contractStatusOf(value: string): StayReceivable['contractStatus'] {
  const status = CONTRACT_STATUSES.find((candidate) => candidate === value);

  if (!status) throw new Error(`Unknown contract status ${value}`);
  return status;
}

async function invoicesByContract(
  buildingId: string,
  contractIds: string[],
  today: string,
  graceDays: number,
  transaction: Transaction,
): Promise<Map<string, ReceivableInvoice[]>> {
  const grouped = new Map<string, ReceivableInvoice[]>();

  if (!contractIds.length) return grouped;
  const rows = await InvoiceModel.findAll({
    where: {
      buildingId,
      contractId: { [Op.in]: contractIds },
      status: { [Op.in]: [...UNPAID_STATUSES] },
      total: { [Op.gt]: sequelize.col('paid_total') },
    },
    order: [
      ['dueOn', 'ASC'],
      ['period', 'ASC'],
      ['id', 'ASC'],
    ],
    transaction,
  });
  const instant = new Date();

  for (const row of rows) {
    const invoices = grouped.get(row.contractId) ?? [];

    invoices.push({
      id: row.id,
      code: row.code,
      kind: row.kind,
      period: row.period,
      status: row.status,
      total: row.total,
      paidTotal: row.paidTotal,
      remaining: row.total - row.paidTotal,
      dueOn: row.dueOn,
      overdueDays: invoiceOverdueDays(row.dueOn, today, graceDays),
      shareExpiresAt:
        row.shareTokenHash && row.shareExpiresAt && row.shareExpiresAt > instant
          ? row.shareExpiresAt.toISOString()
          : null,
    });
    grouped.set(row.contractId, invoices);
  }
  return grouped;
}

/**
 * ST-18 Công nợ: unpaid invoices of a building grouped by contract. Rows, totals and bucket
 * counts are read in one REPEATABLE READ snapshot so `meta` always matches the listed rows.
 */
export async function listReceivables(
  user: StayUser,
  buildingId: string,
  query: ReceivableListQuery,
): Promise<{ data: StayReceivable[]; meta: PaginationMeta & ReceivableTotals }> {
  if (!canAccessRecord(user, 'read', 'Invoice', { buildingId })) throw new NotFound();
  const today = isoDateInTimeZone(new Date());
  // Phones only for users who may read the building's tenant records (owner, its managers).
  const showPhone = canAccessRecord(user, 'read', 'Tenant', { buildingId });
  const replacements = {
    buildingId,
    today,
    graceDays: 0,
    statuses: [...UNPAID_STATUSES],
    pattern: query.q ? searchPattern(query.q) : null,
  };
  const direction = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const column = SORT_COLUMNS[query.sortBy ?? 'remaining'];

  return sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (transaction) => {
      const building = await BuildingModel.findByPk(buildingId, { transaction });

      if (!building) throw new NotFound();
      replacements.graceDays = (await buildingBilling(building, transaction)).graceDays;
      const bucketRows = await sequelize.query<BucketRecord>(BUCKETS_SQL, {
        replacements,
        type: QueryTypes.SELECT,
        transaction,
      });
      const rows = await sequelize.query<RowRecord>(
        `${ROWS_SQL}
        SELECT * FROM matched
        WHERE CAST(:bucket AS text) IS NULL OR bucket = :bucket
        ORDER BY ${column} ${direction}, room_code ASC, contract_id ASC
        LIMIT :limit OFFSET :offset`,
        {
          replacements: {
            ...replacements,
            bucket: query.bucket ?? null,
            limit: query.pageSize,
            offset: (query.page - 1) * query.pageSize,
          },
          type: QueryTypes.SELECT,
          transaction,
        },
      );
      const invoices = await invoicesByContract(
        buildingId,
        rows.map((row) => row.contract_id),
        today,
        replacements.graceDays,
        transaction,
      );
      const buckets = RECEIVABLE_BUCKETS.map((bucket) => {
        const row = bucketRows.find((candidate) => candidate.bucket === bucket);

        return {
          bucket,
          count: row?.count ?? 0,
          remaining: vnd(row?.remaining ?? 0),
          overdueRemaining: vnd(row?.overdue_remaining ?? 0),
          invoiceCount: Number(row?.invoice_count ?? 0),
        };
      });
      const included = buckets.filter((row) => !query.bucket || row.bucket === query.bucket);
      const sum = (values: number[]) => vnd(values.reduce((total, value) => total + value, 0));

      return {
        data: rows.map((row) => ({
          contractId: row.contract_id,
          contractCode: row.contract_code,
          contractStatus: contractStatusOf(row.contract_status),
          roomId: row.room_id,
          roomCode: row.room_code,
          representativeName: row.representative_name,
          representativePhone: showPhone ? row.representative_phone : null,
          invoiceCount: row.invoice_count,
          remaining: vnd(row.remaining),
          overdueRemaining: vnd(row.overdue_remaining),
          oldestDueOn: row.oldest_due_on,
          overdueDays: row.overdue_days,
          bucket: bucketOf(row.bucket),
          invoices: invoices.get(row.contract_id) ?? [],
        })),
        meta: {
          ...buildPaginationMeta(query.page, query.pageSize, sum(included.map((row) => row.count))),
          totalRemaining: sum(included.map((row) => row.remaining)),
          overdueRemaining: sum(included.map((row) => row.overdueRemaining)),
          invoiceCount: sum(included.map((row) => row.invoiceCount)),
          buckets: buckets.map(({ bucket, count, remaining }) => ({ bucket, count, remaining })),
        },
      };
    },
  );
}

/** Building-wide receivable totals (no `q`/`bucket`), with the overdue invoice count. */
export interface BuildingReceivableTotals {
  totalRemaining: number;
  overdueRemaining: number;
  invoiceCount: number;
  overdueInvoiceCount: number;
  /** Contracts per bucket, zeros included. */
  buckets: { bucket: ReceivableBucket; count: number }[];
}

/**
 * The same aggregation as `GET /buildings/:buildingId/receivables` `meta` without filters, so
 * the overview (ST-19) always equals the receivables screen. Run inside the caller's snapshot.
 */
export async function buildingReceivableTotals(
  buildingId: string,
  today: string,
  graceDays: number,
  transaction: Transaction,
): Promise<BuildingReceivableTotals> {
  const rows = await sequelize.query<BucketRecord>(BUCKETS_SQL, {
    replacements: { buildingId, today, graceDays, statuses: [...UNPAID_STATUSES], pattern: null },
    type: QueryTypes.SELECT,
    transaction,
  });
  const sum = (field: 'remaining' | 'overdue_remaining' | 'invoice_count' | 'overdue_count') =>
    vnd(rows.reduce((total, row) => total + vnd(row[field]), 0));

  return {
    totalRemaining: sum('remaining'),
    overdueRemaining: sum('overdue_remaining'),
    invoiceCount: sum('invoice_count'),
    overdueInvoiceCount: sum('overdue_count'),
    buckets: RECEIVABLE_BUCKETS.map((bucket) => ({
      bucket,
      count: rows.find((row) => row.bucket === bucket)?.count ?? 0,
    })),
  };
}
