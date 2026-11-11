import { BaseError, NotFound } from '@p4/server-core';
import {
  addDays,
  currentBillingPeriod,
  firstDayOfPeriod,
  isoDateInTimeZone,
  lastDayOfPeriod,
  type OverviewLink,
  type OverviewOccupancy,
  type OverviewPeriodAmounts,
  type OverviewTodo,
  occupancyRate,
  type Period,
  periodSeries,
  previousPeriod,
  type ReceivableBucket,
  type StayOverview,
  type StayUser,
} from '@stay/shared';
import { QueryTypes, Transaction } from 'sequelize';
import { canAccessRecord } from '@/middlewares/ability.middleware.js';
import { BuildingModel, sequelize } from '@/sequelize/models/index.js';
import { buildingReceivableTotals } from '../receivables/receivables.service.js';
import { billingDefaults } from '../settings/settings.service.js';

/** Invoices that count as billed: issued, never drafts or void (every kind). */
export const BILLED_STATUSES = ['issued', 'partially_paid', 'paid'];

/** Contracts that hold a room (room map derivation). */
const HOLDING_STATUSES = ['active', 'ending'];

/** Overdue buckets, most severe first: the overdue to-do opens the worst non-empty one. */
const OVERDUE_BUCKETS: ReceivableBucket[] = ['over_30', '8_30', '1_7'];

type Amount = string | number | null;

/** BIGINT sums arrive as strings; amounts beyond the safe integer range are refused. */
export function vnd(value: Amount): number {
  const amount = Number(value ?? 0);

  if (!Number.isSafeInteger(amount))
    throw new BaseError('overview_amount_overflow', 422, 'overview_amount_overflow');
  return amount;
}

interface PeriodRecord {
  period: string;
  billed: Amount;
  collected: Amount;
  invoice_count: number;
}

/**
 * Billed = totals of the issued invoices of each period; collected = their non-reversed
 * payments (equal to `paid_total`, which ST-15 keeps in sync). One grouped query for the series.
 */
const PERIODS_SQL = `
SELECT i.period,
  COALESCE(SUM(i.total), 0) AS billed,
  COALESCE(SUM(paid.amount), 0) AS collected,
  CAST(COUNT(*) AS int) AS invoice_count
FROM invoices i
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(p.amount), 0) AS amount
  FROM payments p
  WHERE p.invoice_id = i.id AND p.reversed_at IS NULL
) paid ON true
WHERE i.building_id = :buildingId
  AND i.period IN (:periods)
  AND i.status IN (:billedStatuses)
GROUP BY i.period`;

/** Cash basis: payments recorded with `paid_on` in the calendar month, whatever the invoice. */
const CASH_SQL = `
SELECT COALESCE(SUM(p.amount), 0) AS amount
FROM payments p
WHERE p.building_id = :buildingId
  AND p.reversed_at IS NULL
  AND p.paid_on BETWEEN CAST(:monthStart AS date) AND CAST(:monthEnd AS date)`;

interface RoomRecord {
  vacant: number;
  reserved: number;
  occupied: number;
  maintenance: number;
}

/** Room statuses today, as `roomStatusWhere`/`deriveRoomStatus` derive them. */
const ROOMS_SQL = `
SELECT
  CAST(COUNT(*) FILTER (WHERE h.start_date IS NULL AND NOT r.maintenance) AS int) AS vacant,
  CAST(COUNT(*) FILTER (WHERE h.start_date > CAST(:today AS date)) AS int) AS reserved,
  CAST(COUNT(*) FILTER (WHERE h.start_date <= CAST(:today AS date)) AS int) AS occupied,
  CAST(COUNT(*) FILTER (WHERE h.start_date IS NULL AND r.maintenance) AS int) AS maintenance
FROM rooms r
LEFT JOIN LATERAL (
  SELECT c.start_date
  FROM contracts c
  WHERE c.building_id = r.building_id
    AND c.status IN (:holdingStatuses)
    AND stay_contract_room_at(c.id, CAST(:today AS date)) = r.id
  ORDER BY c.start_date
  LIMIT 1
) h ON true
WHERE r.building_id = :buildingId AND r.archived_at IS NULL`;

interface OccupancyRecord {
  on_date: string;
  occupied: number;
  total: number;
}

/**
 * Occupied rooms on a date: a holding contract started by then, or an ended one that moved out
 * after it. Rooms count when created by that date and not archived on it (Asia/Ho_Chi_Minh).
 */
const OCCUPANCY_SQL = `
SELECT to_char(d.on_date, 'YYYY-MM-DD') AS on_date,
  (
    SELECT CAST(COUNT(DISTINCT stay_contract_room_at(c.id, d.on_date)) AS int)
    FROM contracts c
    WHERE c.building_id = :buildingId
      AND c.start_date <= d.on_date
      AND (
        c.status IN (:holdingStatuses)
        OR (c.status = 'ended' AND COALESCE(c.moved_out_at, c.end_date) > d.on_date)
      )
  ) AS occupied,
  (
    SELECT CAST(COUNT(*) AS int)
    FROM rooms r
    WHERE r.building_id = :buildingId
      AND CAST(r.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS date) <= d.on_date
      AND (r.archived_at IS NULL
        OR CAST(r.archived_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS date) > d.on_date)
  ) AS total
FROM (VALUES (CAST(:currentDate AS date)), (CAST(:previousDate AS date))) AS d(on_date)`;

interface TodoRecord {
  reading_rooms: number;
  reading_missing: number;
  to_create: number;
  drafts: number;
  unshared: number;
  expiring: number;
  ending: number;
}

/**
 * To-do counts in one statement:
 * - readings: rooms of the meter closing grid (ST-13) for consumption month M−1 whose current
 *   electricity and water meters do not both have a reading of M−1;
 * - invoices to create: contracts billable in M (as the ST-14 preview selects them) with no
 *   non-void monthly or move-in invoice of M;
 * - drafts of M; issued/partially paid invoices of M with something left and no active link;
 * - contracts ending within 30 days (the contract list `expiring=true` filter) and notices.
 */
const TODOS_SQL = `
WITH grid AS (
  SELECT DISTINCT ON (c.room_id) c.room_id, c.start_date
  FROM contracts c
  WHERE c.building_id = :buildingId
    AND c.status IN (:holdingStatuses)
    AND c.start_date <= CAST(:readingEnd AS date)
  ORDER BY c.room_id, c.start_date
),
closed AS (
  SELECT g.room_id,
    (
      SELECT COUNT(*)
      FROM (
        SELECT DISTINCT ON (m.kind) m.id
        FROM meters m
        WHERE m.room_id = g.room_id
          AND m.installed_on <= CAST(:readingEnd AS date)
          AND (m.removed_on IS NULL
            OR m.removed_on >= GREATEST(CAST(:readingStart AS date), g.start_date))
        ORDER BY m.kind, m.installed_on DESC, m.created_at DESC
      ) last
      JOIN meter_readings mr ON mr.meter_id = last.id AND mr.period = :readingPeriod
    ) = 2 AS complete
  FROM grid g
)
SELECT
  (SELECT CAST(COUNT(*) AS int) FROM closed) AS reading_rooms,
  (SELECT CAST(COUNT(*) AS int) FROM closed WHERE NOT complete) AS reading_missing,
  (
    SELECT CAST(COUNT(*) AS int)
    FROM contracts c
    WHERE c.building_id = :buildingId
      AND c.status IN (:holdingStatuses)
      AND c.start_date <= CAST(:periodEnd AS date)
      AND (c.end_date IS NULL OR c.end_date >= CAST(:periodStart AS date))
      AND NOT EXISTS (
        SELECT 1 FROM invoices i
        WHERE i.contract_id = c.id AND i.period = :period
          AND i.kind IN ('monthly', 'move_in') AND i.status <> 'void'
      )
  ) AS to_create,
  (
    SELECT CAST(COUNT(*) AS int) FROM invoices i
    WHERE i.building_id = :buildingId AND i.period = :period AND i.status = 'draft'
  ) AS drafts,
  (
    SELECT CAST(COUNT(*) AS int) FROM invoices i
    WHERE i.building_id = :buildingId AND i.period = :period
      AND i.status IN ('issued', 'partially_paid') AND i.total > i.paid_total
      AND (i.share_token_hash IS NULL OR i.share_expires_at IS NULL OR i.share_expires_at <= now())
  ) AS unshared,
  (
    SELECT CAST(COUNT(*) AS int) FROM contracts c
    WHERE c.building_id = :buildingId AND c.status IN (:holdingStatuses)
      AND c.end_date BETWEEN CAST(:today AS date) AND CAST(:expiringEnd AS date)
  ) AS expiring,
  (
    SELECT CAST(COUNT(*) AS int) FROM contracts c
    WHERE c.building_id = :buildingId AND c.status = 'ending'
  ) AS ending`;

const link = (path: string, query: Record<string, string> = {}): OverviewLink => ({ path, query });

function amountsOf(rows: PeriodRecord[], period: Period): OverviewPeriodAmounts {
  const row = rows.find((candidate) => candidate.period === period);
  const billed = vnd(row?.billed ?? 0);
  const collected = vnd(row?.collected ?? 0);

  return {
    period,
    billed,
    collected,
    remaining: billed - collected,
    invoiceCount: row?.invoice_count ?? 0,
  };
}

function occupancyOf(rows: OccupancyRecord[], date: string): OverviewOccupancy {
  const row = rows.find((candidate) => candidate.on_date === date);
  const occupied = row?.occupied ?? 0;
  const total = row?.total ?? 0;

  return { date, occupied, total, rate: occupancyRate(occupied, total) };
}

/** Occupancy is read on the period's last day, or today while the period is still running. */
const occupancyDate = (period: Period, today: string) => {
  const end = lastDayOfPeriod(period);

  return end < today ? end : today;
};

/** Accessible building or 404 (managers of other buildings, unknown ids). */
export async function overviewBuilding(
  user: StayUser,
  buildingId: string,
  transaction: Transaction,
) {
  if (!canAccessRecord(user, 'read', 'Report', { buildingId })) throw new NotFound();
  const building = await BuildingModel.findByPk(buildingId, { transaction });

  if (!building) throw new NotFound();
  return building;
}

/**
 * ST-19 Tổng quan tháng: every figure is aggregated in SQL inside one REPEATABLE READ
 * snapshot, so the cards, the chart and the to-do counts describe the same data. Read-only.
 */
export async function buildingOverview(
  user: StayUser,
  buildingId: string,
  requested: Period | undefined,
): Promise<StayOverview> {
  const today = isoDateInTimeZone(new Date());

  return sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (transaction) => {
      const building = await overviewBuilding(user, buildingId, transaction);
      const period =
        requested ??
        currentBillingPeriod(today, building.issueDay ?? (await billingDefaults()).issueDay);
      const previous = previousPeriod(period);
      const series = periodSeries(period);
      const base = { buildingId, holdingStatuses: HOLDING_STATUSES };
      const query = <T extends object>(sql: string, replacements: Record<string, unknown>) =>
        sequelize.query<T>(sql, {
          replacements: { ...base, ...replacements },
          type: QueryTypes.SELECT,
          transaction,
        });

      const periodRows = await query<PeriodRecord>(PERIODS_SQL, {
        periods: series,
        billedStatuses: BILLED_STATUSES,
      });
      const [cash] = await query<{ amount: Amount }>(CASH_SQL, {
        monthStart: firstDayOfPeriod(period),
        monthEnd: lastDayOfPeriod(period),
      });
      const [rooms] = await query<RoomRecord>(ROOMS_SQL, { today });
      const currentDate = occupancyDate(period, today);
      const previousDate = occupancyDate(previous, today);
      const occupancyRows = await query<OccupancyRecord>(OCCUPANCY_SQL, {
        currentDate,
        previousDate,
      });
      const readingPeriod = previous;
      const [todo] = await query<TodoRecord>(TODOS_SQL, {
        period,
        periodStart: firstDayOfPeriod(period),
        periodEnd: lastDayOfPeriod(period),
        readingPeriod,
        readingStart: firstDayOfPeriod(readingPeriod),
        readingEnd: lastDayOfPeriod(readingPeriod),
        today,
        expiringEnd: addDays(today, 30),
      });
      const receivables = await buildingReceivableTotals(buildingId, today, transaction);
      const worstBucket =
        OVERDUE_BUCKETS.find(
          (bucket) => (receivables.buckets.find((row) => row.bucket === bucket)?.count ?? 0) > 0,
        ) ?? '1_7';
      const counts = {
        vacant: rooms?.vacant ?? 0,
        reserved: rooms?.reserved ?? 0,
        occupied: rooms?.occupied ?? 0,
        maintenance: rooms?.maintenance ?? 0,
      };
      const todos: OverviewTodo[] = [
        {
          kind: 'readings',
          count: todo?.reading_missing ?? 0,
          total: todo?.reading_rooms ?? 0,
          amount: null,
          link: link('/readings', { period: readingPeriod }),
        },
        {
          kind: 'invoices_to_create',
          count: todo?.to_create ?? 0,
          total: null,
          amount: null,
          link: link('/invoices/run', { period }),
        },
        {
          kind: 'draft_invoices',
          count: todo?.drafts ?? 0,
          total: null,
          amount: null,
          link: link('/invoices', { period, status: 'draft' }),
        },
        {
          kind: 'unshared_invoices',
          count: todo?.unshared ?? 0,
          total: null,
          amount: null,
          link: link('/invoices/share', { period }),
        },
        {
          kind: 'overdue_invoices',
          count: receivables.overdueInvoiceCount,
          total: null,
          amount: receivables.overdueRemaining,
          link: link('/receivables', { bucket: worstBucket }),
        },
        {
          kind: 'expiring_contracts',
          count: todo?.expiring ?? 0,
          total: null,
          amount: null,
          link: link('/contracts', { expiring: 'true' }),
        },
        {
          kind: 'ending_contracts',
          count: todo?.ending ?? 0,
          total: null,
          amount: null,
          link: link('/contracts', { status: 'ending' }),
        },
      ];

      return {
        buildingId,
        period,
        previousPeriod: previous,
        today,
        current: amountsOf(periodRows, period),
        previous: amountsOf(periodRows, previous),
        collectedInMonth: vnd(cash?.amount ?? 0),
        receivables: {
          totalRemaining: receivables.totalRemaining,
          overdueRemaining: receivables.overdueRemaining,
          overdueInvoiceCount: receivables.overdueInvoiceCount,
        },
        rooms: {
          ...counts,
          total: counts.vacant + counts.reserved + counts.occupied + counts.maintenance,
        },
        occupancy: occupancyOf(occupancyRows, currentDate),
        previousOccupancy: occupancyOf(occupancyRows, previousDate),
        series: series.map((item) => amountsOf(periodRows, item)),
        todos,
      };
    },
  );
}

/** Periods the overview accepts: its six-period series must stay within supported years. */
export function assertOverviewPeriod(period: Period): Period {
  const year = Number(period.slice(0, 4));

  if (year < 2000 || year > 2099)
    throw new BaseError('period_out_of_range', 422, 'period_out_of_range');
  return period;
}
