import { BaseError, InputValidError } from '@p4/server-core';
import {
  firstDayOfPeriod,
  isPeriod,
  lastDayOfPeriod,
  type RevenueReport,
  type RoomsReport,
  type StayUser,
  type UtilitiesReport,
} from '@stay/shared';
import { QueryTypes, Transaction } from 'sequelize';
import { sequelize } from '@/sequelize/models/index.js';
import { BILLED_STATUSES, overviewBuilding, vnd } from '../overview/overview.service.js';

export function reportRange(from: unknown, to: unknown) {
  if (!isPeriod(from) || !isPeriod(to))
    throw new InputValidError('input_valid_error', { from: ['Kỳ phải có dạng YYYY-MM.'] });
  const index = (value: string) => Number(value.slice(0, 4)) * 12 + Number(value.slice(5));
  const count = index(to) - index(from) + 1;

  if (from < '2000-01' || to > '2099-12' || count < 1 || count > 24)
    throw new BaseError('report_range_invalid', 422, 'report_range_invalid');
  return { from, to, start: firstDayOfPeriod(from), end: lastDayOfPeriod(to) };
}

/** One consistent snapshot per report/export, scoped before reading any business data. */
export function reportSnapshot<T>(
  user: StayUser,
  buildingId: string,
  read: (transaction: Transaction) => Promise<T>,
): Promise<T> {
  return sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (transaction) => {
      await overviewBuilding(user, buildingId, transaction);
      return read(transaction);
    },
  );
}

export function reportQuery<T extends object>(
  sql: string,
  replacements: Record<string, unknown>,
  transaction: Transaction,
) {
  return sequelize.query<T>(sql, {
    replacements: { billedStatuses: BILLED_STATUSES, ...replacements },
    type: QueryTypes.SELECT,
    transaction,
  });
}

const MONTHS = `SELECT to_char(d, 'YYYY-MM') AS period
  FROM generate_series(CAST(:start AS date), CAST(:end AS date), interval '1 month') d`;

export async function revenueReport(
  user: StayUser,
  buildingId: string,
  from: unknown,
  to: unknown,
): Promise<RevenueReport> {
  const range = reportRange(from, to);

  return reportSnapshot(user, buildingId, async (transaction) => {
    const rows = await reportQuery<{
      period: string;
      billed: string;
      collected: string;
      expenses: string;
      total_billed: string;
      total_collected: string;
      total_expenses: string;
    }>(
      `
      WITH months AS (${MONTHS}),
      billed AS (SELECT period, SUM(total) amount FROM invoices
        WHERE building_id = :buildingId AND period BETWEEN :from AND :to
          AND status IN (:billedStatuses) GROUP BY period),
      cash AS (SELECT to_char(p.paid_on, 'YYYY-MM') period, SUM(p.amount) amount
        FROM payments p JOIN invoices i ON i.id = p.invoice_id
        WHERE p.building_id = :buildingId AND p.reversed_at IS NULL
          AND i.status IN (:billedStatuses) AND p.paid_on BETWEEN :start AND :end GROUP BY 1),
      costs AS (SELECT period, SUM(amount) amount FROM expenses
        WHERE building_id = :buildingId AND period BETWEEN :from AND :to GROUP BY period)
      SELECT m.period, COALESCE(b.amount, 0) billed, COALESCE(c.amount, 0) collected,
        COALESCE(e.amount, 0) expenses,
        SUM(COALESCE(b.amount,0)) OVER () total_billed,
        SUM(COALESCE(c.amount,0)) OVER () total_collected,
        SUM(COALESCE(e.amount,0)) OVER () total_expenses FROM months m
      LEFT JOIN billed b USING(period) LEFT JOIN cash c USING(period) LEFT JOIN costs e USING(period)
      ORDER BY m.period`,
      { buildingId, ...range },
      transaction,
    );
    const months = rows.map((row) => {
      const billed = vnd(row.billed);
      const collected = vnd(row.collected);
      const expenses = vnd(row.expenses);

      return { period: row.period, billed, collected, expenses, profit: vnd(collected - expenses) };
    });
    const billed = vnd(rows[0]?.total_billed ?? 0);
    const collected = vnd(rows[0]?.total_collected ?? 0);
    const expenses = vnd(rows[0]?.total_expenses ?? 0);
    const totals = { billed, collected, expenses, profit: vnd(collected - expenses) };

    return { buildingId, from: range.from, to: range.to, months, totals };
  });
}

export async function roomsReport(
  user: StayUser,
  buildingId: string,
  year: number,
): Promise<RoomsReport> {
  if (!Number.isInteger(year) || year < 2000 || year > 2099)
    throw new InputValidError('input_valid_error', { year: ['Năm phải từ 2000 đến 2099.'] });
  const range = reportRange(`${year}-01`, `${year}-12`);

  return reportSnapshot(user, buildingId, async (transaction) => {
    const rooms = await reportQuery<{
      roomId: string;
      roomCode: string;
      billed: string;
      collected: string;
      occupiedMonths: number;
      occupiedDays: number;
      availableDays: number;
      occupancyRate: number | null;
    }>(
      `
      WITH days AS (SELECT d::date day FROM generate_series(CAST(:start AS date), CAST(:end AS date), interval '1 day') d),
      occupied AS (
        SELECT DISTINCT stay_contract_room_at(c.id, d.day) room_id, d.day
        FROM contracts c JOIN days d ON c.start_date <= d.day
          AND (c.status IN ('active','ending') OR (c.status = 'ended'
            AND COALESCE(c.moved_out_at, c.end_date) >= d.day))
        WHERE c.building_id = :buildingId
      ), occupancy AS (
        SELECT r.id, COUNT(*)::int available, COUNT(o.day)::int occupied,
          COUNT(DISTINCT to_char(o.day, 'YYYY-MM'))::int months
        FROM rooms r CROSS JOIN days d
        LEFT JOIN occupied o ON o.room_id = r.id AND o.day = d.day
        WHERE r.building_id = :buildingId
          AND (r.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date <= d.day
          AND (r.archived_at IS NULL OR (r.archived_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date > d.day)
        GROUP BY r.id),
      billed AS (SELECT room_id, SUM(total) amount FROM invoices WHERE building_id = :buildingId
        AND period BETWEEN :from AND :to AND status IN (:billedStatuses) GROUP BY room_id),
      cash AS (SELECT i.room_id, SUM(p.amount) amount FROM payments p JOIN invoices i ON i.id = p.invoice_id
        WHERE p.building_id = :buildingId AND p.reversed_at IS NULL AND i.status IN (:billedStatuses)
          AND p.paid_on BETWEEN :start AND :end GROUP BY i.room_id)
      SELECT r.id "roomId", r.code "roomCode", COALESCE(b.amount,0) billed,
        COALESCE(c.amount,0) collected, COALESCE(o.months,0) "occupiedMonths",
        COALESCE(o.occupied,0) "occupiedDays", COALESCE(o.available,0) "availableDays",
        ROUND(o.occupied::numeric / NULLIF(o.available,0),4)::float8 "occupancyRate"
      FROM rooms r LEFT JOIN occupancy o ON o.id = r.id LEFT JOIN billed b ON b.room_id = r.id
      LEFT JOIN cash c ON c.room_id = r.id WHERE r.building_id = :buildingId ORDER BY r.code`,
      { buildingId, ...range },
      transaction,
    );

    return {
      buildingId,
      year,
      rooms: rooms.map((r) => ({ ...r, billed: vnd(r.billed), collected: vnd(r.collected) })),
    };
  });
}

/** Utility lines use their consumption period; category matching is documented in README. */
export async function utilitiesReport(
  user: StayUser,
  buildingId: string,
  from: unknown,
  to: unknown,
): Promise<UtilitiesReport> {
  const range = reportRange(from, to);

  return reportSnapshot(user, buildingId, async (transaction) => {
    const rows = await reportQuery<{
      period: string;
      eq: string;
      wq: string;
      eb: string;
      wb: string;
      ee: string;
      we: string;
      combined: string;
    }>(
      `
      WITH months AS (${MONTHS}), lines AS (
        SELECT l.period, SUM(l.quantity) FILTER (WHERE l.type = 'electricity') eq,
          SUM(l.quantity) FILTER (WHERE l.type = 'water') wq,
          SUM(l.amount) FILTER (WHERE l.type = 'electricity') eb,
          SUM(l.amount) FILTER (WHERE l.type = 'water') wb
        FROM invoice_lines l JOIN invoices i ON i.id = l.invoice_id
        WHERE i.building_id = :buildingId AND i.status IN (:billedStatuses)
          AND l.period BETWEEN :from AND :to GROUP BY l.period), costs AS (
        SELECT e.period, SUM(e.amount) FILTER (WHERE lower(trim(c.name)) = 'điện tổng') ee,
          SUM(e.amount) FILTER (WHERE lower(trim(c.name)) = 'nước tổng') we,
          SUM(e.amount) FILTER (WHERE lower(trim(c.name)) = 'điện nước tổng') combined
        FROM expenses e JOIN expense_categories c ON c.id = e.category_id
        WHERE e.building_id = :buildingId AND e.period BETWEEN :from AND :to GROUP BY e.period)
      SELECT m.period, l.eq, l.wq, l.eb, l.wb, c.ee, c.we, c.combined
      FROM months m LEFT JOIN lines l USING(period) LEFT JOIN costs c USING(period) ORDER BY m.period`,
      { buildingId, ...range },
      transaction,
    );
    const loss = (billed: number, expenses: number) =>
      expenses > 0 ? Math.round(((expenses - billed) / expenses) * 10000) / 100 : null;
    const months = rows.map((r) => {
      const electricityBilled = vnd(r.eb);
      const waterBilled = vnd(r.wb);
      const electricityExpenses = vnd(r.ee);
      const waterExpenses = vnd(r.we);

      return {
        period: r.period,
        electricityQuantity: vnd(r.eq),
        waterQuantity: vnd(r.wq),
        electricityBilled,
        waterBilled,
        electricityExpenses,
        waterExpenses,
        combinedExpenses: vnd(r.combined),
        electricityLossPercent: loss(electricityBilled, electricityExpenses),
        waterLossPercent: loss(waterBilled, waterExpenses),
      };
    });

    return { buildingId, from: range.from, to: range.to, months };
  });
}
